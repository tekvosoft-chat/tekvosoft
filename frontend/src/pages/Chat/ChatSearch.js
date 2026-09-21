import React, { useEffect, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import InputBase from "@material-ui/core/InputBase";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import LockRoundedIcon from "@material-ui/icons/LockRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import UserAvatar from "../../components/ui/UserAvatar";
import { GroupIcon, OnlineDot } from "./chatShared";

/**
 * "Encontre ou comece uma conversa": busca pessoas (com foto e nome, e se
 * estão online) e grupos da empresa. Tocar numa pessoa abre a conversa
 * avulsa; num grupo público, entra nele.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 560,
      maxWidth: "calc(100vw - 24px)",
      borderRadius: 16,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        maxWidth: "100vw",
        margin: 0,
        height: "100%",
        maxHeight: "none",
        borderRadius: 0
      }
    },
    head: { padding: theme.spacing(2, 2, 1) },
    title: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      marginBottom: 10
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 46,
      padding: "0 14px",
      borderRadius: 10,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      "& input": { fontSize: "1rem" }
    },
    tabs: { display: "flex", gap: 6, marginTop: 10 },
    tab: {
      height: 30,
      padding: "0 12px",
      borderRadius: t.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    tabOn: { color: t.brand.text, backgroundColor: t.brand.textSoft },
    body: {
      maxHeight: "min(60vh, 520px)",
      overflowY: "auto",
      padding: theme.spacing(0.5, 1, 1.5),
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: { maxHeight: "none", flex: 1 }
    },
    section: {
      padding: theme.spacing(1.5, 1, 0.5),
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      padding: theme.spacing(1, 1),
      borderRadius: 10,
      textAlign: "left",
      justifyContent: "flex-start",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    avatarWrap: { position: "relative", flex: "none" },
    text: { flex: 1, minWidth: 0 },
    name: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: "0.9688rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      "& svg": { fontSize: 14, color: theme.palette.text.secondary }
    },
    sub: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    join: {
      flex: "none",
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700
    },
    empty: {
      padding: theme.spacing(4, 2),
      textAlign: "center",
      color: theme.palette.text.secondary,
      fontSize: "0.875rem"
    }
  };
});

const ChatSearch = ({
  open,
  initialTab = "all",
  onClose,
  onOpenUser,
  onOpenGroup
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(initialTab);
  const [result, setResult] = useState({ users: [], groups: [] });
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTab(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    const timer = setTimeout(() => {
      api
        .get("/chats/directory", { params: { search: query } })
        .then(({ data }) => alive && setResult(data))
        .catch(() => {});
    }, 200);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, query]);

  const pickUser = async user => {
    setBusy(`u${user.id}`);
    try {
      const { data } = await api.post("/chats/direct", { userId: user.id });
      onOpenUser(data);
    } catch (err) {
      toastError(err);
    }
    setBusy(null);
  };

  const pickGroup = async group => {
    setBusy(`g${group.id}`);
    try {
      const data = group.joined
        ? group
        : (await api.post(`/chats/${group.id}/join`)).data;
      onOpenGroup(data);
    } catch (err) {
      toastError(err);
    }
    setBusy(null);
  };

  const showUsers = tab !== "groups";
  const showGroups = tab !== "people";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.head}>
        <div className={classes.title}>Encontre ou comece uma conversa</div>
        <label className={classes.search}>
          <SearchRoundedIcon />
          <InputBase
            fullWidth
            autoFocus
            placeholder="Buscar pessoas e grupos da empresa"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
        <div className={classes.tabs}>
          {[
            ["all", "Tudo"],
            ["people", "Pessoas"],
            ["groups", "Grupos"]
          ].map(([key, label]) => (
            <ButtonBase
              key={key}
              className={`${classes.tab}${tab === key ? ` ${classes.tabOn}` : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </ButtonBase>
          ))}
        </div>
      </div>

      <div className={classes.body}>
        {showUsers && result.users.length > 0 && (
          <>
            <div className={classes.section}>Pessoas</div>
            {result.users.map(user => (
              <ButtonBase
                key={user.id}
                className={classes.row}
                disabled={busy === `u${user.id}`}
                onClick={() => pickUser(user)}
              >
                <span className={classes.avatarWrap}>
                  <UserAvatar user={user} size={40} />
                  <OnlineDot online={user.online} />
                </span>
                <span className={classes.text}>
                  <span className={classes.name}>{user.name}</span>
                  <span className={classes.sub}>{user.email}</span>
                </span>
              </ButtonBase>
            ))}
          </>
        )}

        {showGroups && result.groups.length > 0 && (
          <>
            <div className={classes.section}>Grupos</div>
            {result.groups.map(group => (
              <ButtonBase
                key={group.id}
                component="div"
                className={classes.row}
                onClick={() => pickGroup(group)}
              >
                <GroupIcon title={group.title} size={40} />
                <span className={classes.text}>
                  <span className={classes.name}>
                    {group.title}
                    {!group.isPublic && <LockRoundedIcon />}
                  </span>
                  <span className={classes.sub}>
                    {group.members} membro{group.members === 1 ? "" : "s"}
                    {group.description ? ` · ${group.description}` : ""}
                  </span>
                </span>
                {!group.joined && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disableElevation
                    className={classes.join}
                    disabled={busy === `g${group.id}`}
                  >
                    Entrar
                  </Button>
                )}
              </ButtonBase>
            ))}
          </>
        )}

        {(showUsers ? result.users.length : 0) +
          (showGroups ? result.groups.length : 0) ===
          0 && (
          <div className={classes.empty}>
            Nada encontrado{query ? ` para “${query}”` : ""}.
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ChatSearch;
