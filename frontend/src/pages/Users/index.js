import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  useMemo
} from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import PersonAddRoundedIcon from "@material-ui/icons/PersonAddRounded";
import MailOutlineRoundedIcon from "@material-ui/icons/MailOutlineRounded";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";

import MainContainer from "../../components/MainContainer";
import UserAvatar from "../../components/ui/UserAvatar";
import EmptyState from "../../components/ui/EmptyState";
import PageLoader from "../../components/ui/PageLoader";
import UserModal from "../../components/UserModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";

/**
 * Usuários em cartões (celular e computador).
 *
 * Cada cartão mostra foto, nome, e-mail, perfil e filas; o admin liga e
 * desliga o acesso de cada pessoa ali mesmo, sem abrir formulário. Quem
 * está inativo aparece apagado e não consegue entrar no sistema.
 */
const reducer = (state, action) => {
  if (action.type === "LOAD_USERS") {
    const next = [...state];
    action.payload.forEach(user => {
      const i = next.findIndex(u => u.id === user.id);
      if (i !== -1) next[i] = user;
      else next.push(user);
    });
    return next;
  }
  if (action.type === "UPDATE_USERS") {
    const user = action.payload;
    const i = state.findIndex(u => u.id === user.id);
    if (i !== -1) {
      const next = [...state];
      next[i] = { ...state[i], ...user };
      return next;
    }
    return [user, ...state];
  }
  if (action.type === "DELETE_USER") {
    return state.filter(u => u.id !== action.payload);
  }
  if (action.type === "RESET") return [];
  return state;
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles,
      // a página rola inteira: nenhum bloco pode ser espremido pela altura
      "& > div > *": { flexShrink: 0 }
    },
    head: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1.5)
    },
    titleBox: { flex: 1, minWidth: 200 },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    subtitle: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 42,
      minWidth: 240,
      padding: "0 14px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: {
        order: 3,
        flex: "1 1 100%",
        minWidth: 0
      }
    },
    add: {
      height: 42,
      borderRadius: 999,
      padding: "0 18px",
      fontWeight: 700,
      textTransform: "none",
      [theme.breakpoints.down("xs")]: {
        minWidth: 42,
        padding: 0,
        "& .MuiButton-startIcon": { margin: 0 },
        "& $addLabel": { display: "none" }
      }
    },
    addLabel: {},
    filters: { display: "flex", gap: 8, flexWrap: "wrap" },
    filter: {
      height: 34,
      padding: "0 14px",
      borderRadius: 999,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      gap: 6
    },
    filterOn: {
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      borderColor: t.brand.main
    },
    filterCount: { opacity: 0.75, fontWeight: 700 },
    grid: {
      display: "grid",
      alignItems: "start",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: theme.spacing(2),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "1fr",
        gap: theme.spacing(1.25)
      }
    },
    // cartão em edição: fica parado (sem o "pulinho" do hover) e destacado
    cardEditing: {
      borderColor: t.brand.main,
      "&:hover": { transform: "none" }
    },
    card: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      borderRadius: t.radius.xl,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      transition: "transform .18s ease, box-shadow .18s ease, opacity .2s ease",
      animation: "$rise .35s ease both",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 12px 30px -18px rgba(12, 10, 20, 0.4)"
      },
      [theme.breakpoints.down("xs")]: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        padding: theme.spacing(1.5),
        gap: theme.spacing(1.5),
        // formulário de edição ocupa a largura toda, embaixo da linha
        "& > .MuiCollapse-container": {
          flexBasis: "100%",
          width: "100%",
          margin: theme.spacing(0, -1.5, -1.5)
        }
      }
    },
    inactive: {
      "& $avatarWrap, & $info": { opacity: 0.55, filter: "grayscale(0.8)" }
    },
    band: {
      height: 64,
      background: `linear-gradient(135deg, ${t.brand.soft}, ${t.brand.softHover || t.brand.soft})`,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    avatarWrap: {
      position: "relative",
      alignSelf: "center",
      marginTop: -40,
      transition: "opacity .2s ease, filter .2s ease",
      [theme.breakpoints.down("xs")]: { marginTop: 0, alignSelf: "flex-start" }
    },
    avatar: {
      border: `4px solid ${t.surface}`,
      boxShadow: "0 4px 14px rgba(12, 10, 20, 0.12)",
      [theme.breakpoints.down("xs")]: { border: "none", boxShadow: "none" }
    },
    info: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 4,
      padding: theme.spacing(1, 2, 0),
      textAlign: "center",
      minWidth: 0,
      transition: "opacity .2s ease, filter .2s ease",
      [theme.breakpoints.down("xs")]: {
        flex: 1,
        alignItems: "flex-start",
        textAlign: "left",
        padding: 0
      }
    },
    name: {
      maxWidth: "100%",
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    email: {
      maxWidth: "100%",
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 15, flex: "none" },
      "& span": {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    },
    badges: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 6,
      marginTop: 6,
      [theme.breakpoints.down("xs")]: { justifyContent: "flex-start" }
    },
    badge: {
      padding: "2px 10px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.03em",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    queue: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "2px 9px",
      borderRadius: 999,
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: t.surfaceSunken
    },
    dot: { width: 7, height: 7, borderRadius: "50%" },
    foot: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: "auto",
      padding: theme.spacing(1.5, 1.5, 1.5, 2),
      [theme.breakpoints.down("xs")]: {
        flexDirection: "column",
        alignItems: "flex-end",
        padding: 0,
        marginTop: 0
      }
    },
    status: {
      height: 32,
      padding: "0 12px 0 8px",
      borderRadius: 999,
      gap: 8,
      fontSize: "0.8125rem",
      fontWeight: 700,
      transition: "background-color .2s ease, color .2s ease",
      "&.Mui-disabled": { opacity: 1 }
    },
    statusOn: { backgroundColor: sem.successSoft, color: sem.success },
    statusOff: {
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    },
    track: {
      position: "relative",
      width: 30,
      height: 18,
      borderRadius: 999,
      backgroundColor: "currentColor",
      opacity: 0.9,
      "&::after": {
        content: "''",
        position: "absolute",
        top: 2,
        left: 2,
        width: 14,
        height: 14,
        borderRadius: "50%",
        backgroundColor: "#FFFFFF",
        transition: "transform .22s cubic-bezier(.34, 1.56, .64, 1)"
      }
    },
    trackOn: { "&::after": { transform: "translateX(12px)" } },
    spacer: { flex: 1, [theme.breakpoints.down("xs")]: { display: "none" } },
    icons: { display: "flex" },
    center: { display: "flex", justifyContent: "center", padding: 32 },
    "@keyframes rise": {
      from: { opacity: 0, transform: "translateY(8px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

const Users = () => {
  const classes = useStyles();
  const { user: me } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);
  const u = (key, opts) => i18n.t(`usersPage.${key}`, opts);

  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const formRef = React.useRef(null);
  // abriu o formulário (editar num cartão lá embaixo): leva a tela até ele
  useEffect(() => {
    // só o "adicionar" rola até o topo; editar abre dentro do próprio cartão
    if (!userModalOpen || selectedUser) return;
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60
    );
  }, [userModalOpen]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [filter, setFilter] = useState("all");
  const [toggling, setToggling] = useState(null);
  const [users, dispatch] = useReducer(reducer, []);

  const isAdmin = me?.profile === "admin" || me?.super;

  useEffect(() => {
    dispatch({ type: "RESET" });
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/users/", {
          params: { searchParam, pageNumber: 1 }
        });
        dispatch({ type: "LOAD_USERS", payload: data.users });
      } catch (err) {
        toastError(err);
      }
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchParam]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const onCompanyUser = data => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_USERS", payload: data.user });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_USER", payload: +data.userId });
      }
    };
    socket.on(`company-${companyId}-user`, onCompanyUser);
    return () => socket.disconnect();
  }, [socketManager]);

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter(x => x.active !== false).length,
      inactive: users.filter(x => x.active === false).length
    }),
    [users]
  );

  const visible = users.filter(x =>
    filter === "all"
      ? true
      : filter === "active"
        ? x.active !== false
        : x.active === false
  );

  const toggleActive = async target => {
    const next = target.active === false;
    setToggling(target.id);
    dispatch({ type: "UPDATE_USERS", payload: { ...target, active: next } });
    try {
      await api.put(`/users/${target.id}/active`, { active: next });
      toast.success(
        next
          ? u("activated", { name: target.name })
          : u("deactivated", { name: target.name }),
        {
          autoClose: 2000
        }
      );
    } catch (err) {
      dispatch({ type: "UPDATE_USERS", payload: target });
      toastError(err);
    }
    setToggling(null);
  };

  const handleDeleteUser = async userId => {
    try {
      await api.delete(`/users/${userId}`);
      toast.success(i18n.t("users.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingUser(null);
  };

  const profileLabel = profile =>
    profile === "admin"
      ? i18n.t("userModal.listItems.adminProfile")
      : profile === "user"
        ? i18n.t("userModal.listItems.userProfile")
        : profile;

  return (
    <MainContainer className={classes.page}>
      <ConfirmationModal
        title={
          deletingUser &&
          `${i18n.t("users.confirmationModal.deleteTitle")} ${deletingUser.name}?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteUser(deletingUser.id)}
      >
        {i18n.t("users.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <div className={classes.head}>
        <div className={classes.titleBox}>
          <Typography component="h1" className={classes.title}>
            {i18n.t("users.title")}
          </Typography>
          <Typography className={classes.subtitle}>{u("subtitle")}</Typography>
        </div>
        <div className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            placeholder={i18n.t("contacts.searchPlaceholder")}
            value={searchParam}
            onChange={e => setSearchParam(e.target.value.toLowerCase())}
          />
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.add}
          startIcon={<PersonAddRoundedIcon />}
          onClick={() => {
            setSelectedUser(null);
            setUserModalOpen(true);
          }}
          aria-label={i18n.t("users.buttons.add")}
        >
          <span className={classes.addLabel}>
            {i18n.t("users.buttons.add")}
          </span>
        </Button>
      </div>

      {/* adicionar/editar usuário: desce aqui mesmo, sem modal por cima */}
      <div ref={formRef}>
        <UserModal
          inline
          key="new"
          open={userModalOpen && !selectedUser}
          onClose={() => {
            setSelectedUser(null);
            setUserModalOpen(false);
          }}
          userId={selectedUser && selectedUser.id}
        />
      </div>

      <div className={classes.filters} role="tablist">
        {["all", "active", "inactive"].map(key => (
          <ButtonBase
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`${classes.filter}${filter === key ? ` ${classes.filterOn}` : ""}`}
            onClick={() => setFilter(key)}
          >
            {u(`filters.${key}`)}
            <span className={classes.filterCount}>{counts[key]}</span>
          </ButtonBase>
        ))}
      </div>

      {loading && users.length === 0 ? (
        <PageLoader />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<PeopleAltOutlinedIcon />}
          title={
            searchParam
              ? i18n.t("common.emptySearchTitle")
              : i18n.t("common.emptyTitle")
          }
          description={
            searchParam
              ? i18n.t("common.emptySearchDescription")
              : i18n.t("common.emptyDescription")
          }
        />
      ) : (
        <div className={classes.grid}>
          {visible.map((user, index) => {
            const active = user.active !== false;
            const self = user.id === me?.id;
            return (
              <div
                key={user.id}
                className={`${classes.card}${active ? "" : ` ${classes.inactive}`}${userModalOpen && selectedUser?.id === user.id ? ` ${classes.cardEditing}` : ""}`}
                style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
              >
                <div className={classes.band} />
                <div className={classes.avatarWrap}>
                  <UserAvatar
                    user={user}
                    size={72}
                    className={classes.avatar}
                  />
                </div>
                <div className={classes.info}>
                  <span className={classes.name}>{user.name}</span>
                  <span className={classes.email}>
                    <MailOutlineRoundedIcon />
                    <span>{user.email}</span>
                  </span>
                  <div className={classes.badges}>
                    <span className={classes.badge}>
                      {profileLabel(user.profile)}
                    </span>
                    {(user.queues || []).slice(0, 3).map(q => (
                      <span key={q.id} className={classes.queue}>
                        <span
                          className={classes.dot}
                          style={{ backgroundColor: q.color }}
                        />
                        {q.name}
                      </span>
                    ))}
                    {(user.queues || []).length > 3 && (
                      <span className={classes.queue}>
                        +{user.queues.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div className={classes.foot}>
                  <Tooltip
                    title={
                      self
                        ? u("selfHint")
                        : active
                          ? u("deactivateHint")
                          : u("activateHint")
                    }
                  >
                    <span>
                      <ButtonBase
                        className={`${classes.status} ${active ? classes.statusOn : classes.statusOff}`}
                        disabled={!isAdmin || self || toggling === user.id}
                        onClick={() => toggleActive(user)}
                        role="switch"
                        aria-checked={active}
                      >
                        <span
                          className={`${classes.track}${active ? ` ${classes.trackOn}` : ""}`}
                        />
                        {active ? u("active") : u("inactive")}
                      </ButtonBase>
                    </span>
                  </Tooltip>
                  <span className={classes.spacer} />
                  <div className={classes.icons}>
                    <Tooltip title={u("edit")}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserModalOpen(true);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!self && (
                      <Tooltip title={u("delete")}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setDeletingUser(user);
                            setConfirmModalOpen(true);
                          }}
                        >
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </div>
                </div>
                {/* editar: o formulário desce aqui dentro do cartão */}
                <UserModal
                  inline
                  compact
                  open={userModalOpen && selectedUser?.id === user.id}
                  onClose={() => {
                    setSelectedUser(null);
                    setUserModalOpen(false);
                  }}
                  userId={user.id}
                />
              </div>
            );
          })}
        </div>
      )}
    </MainContainer>
  );
};

export default Users;
