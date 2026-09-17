import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Paper from "@material-ui/core/Paper";
import InputBase from "@material-ui/core/InputBase";
import IconButton from "@material-ui/core/IconButton";
import ButtonBase from "@material-ui/core/ButtonBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Avatar from "@material-ui/core/Avatar";
import Tooltip from "@material-ui/core/Tooltip";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import PersonAddOutlinedIcon from "@material-ui/icons/PersonAddOutlined";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import PhoneAndroidRoundedIcon from "@material-ui/icons/PhoneAndroidRounded";
import { toast } from "react-toastify";

import TicketsList from "../TicketsListCustom";
import NewContactPanel from "./NewContactPanel";
import ConfirmationModal from "../ConfirmationModal";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import useSettings from "../../hooks/useSettings";
import api from "../../services/api";
import toastError from "../../errors/toastError";

/**
 * Painel de conversas, no desenho do WhatsApp Web.
 *
 *  - uma busca só: "Pesquisar ou começar uma nova conversa" procura nas
 *    conversas e nos contatos (tocar num contato já abre a conversa);
 *  - as filas viram botõezinhos: nenhum marcado = todas;
 *  - "Resolvidos" (e "Grupos", quando ligado) ficam na mesma fileira;
 *  - o "+" cria contato ali mesmo (e importa contatos), sem abrir modal.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      position: "relative",
      display: "flex",
      height: "100%",
      flexDirection: "column",
      overflow: "hidden",
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    },
    header: { flex: "none", padding: theme.spacing(1.5, 1.5, 1) },
    titleRow: {
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: theme.spacing(0, 0, 1.25, 0.5)
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    plus: {
      width: 40,
      height: 40,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      transition: "transform .15s ease, background-color .15s ease",
      "&:hover": { backgroundColor: t.brand.hover, transform: "rotate(90deg)" }
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 42,
      padding: "0 8px 0 14px",
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      transition: "box-shadow .15s ease, background-color .15s ease",
      "&:focus-within": {
        backgroundColor: t.surface,
        boxShadow: `0 0 0 2px ${t.brand.main}`
      }
    },
    searchInput: { flex: 1, fontSize: 15, color: theme.palette.text.primary },
    chips: {
      display: "flex",
      gap: 8,
      marginTop: theme.spacing(1.25),
      overflowX: "auto",
      paddingBottom: 2,
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    chip: {
      flex: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 32,
      padding: "0 14px",
      borderRadius: 999,
      fontSize: 13.5,
      fontWeight: 500,
      whiteSpace: "nowrap",
      color: theme.palette.text.secondary,
      border: `1px solid ${t.border}`,
      backgroundColor: "transparent",
      transition: "all .18s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    chipOn: {
      color: t.brand.text,
      fontWeight: 700,
      borderColor: "transparent",
      backgroundColor: t.brand.textSoft,
      "&:hover": { backgroundColor: t.brand.textSoft }
    },
    dot: { width: 9, height: 9, borderRadius: "50%", flex: "none" },
    queueChips: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: theme.spacing(1),
      "& $chip": { height: 28, padding: "0 12px", fontSize: 12.5 }
    },
    pillTabs: {
      flex: "none",
      minHeight: 36,
      margin: theme.spacing(0.5, 1.5, 0.5),
      padding: 3,
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      "& .MuiTabs-flexContainer": { position: "relative", zIndex: 1 }
    },
    pillIndicator: {
      height: "100%",
      borderRadius: 999,
      zIndex: 0,
      backgroundColor: t.surface,
      boxShadow: "0 2px 8px -2px rgba(12, 10, 20, 0.25)",
      transition: "all .28s cubic-bezier(.3, 1.3, .5, 1)"
    },
    pillTab: {
      minWidth: 0,
      flex: 1,
      minHeight: 30,
      padding: "2px 8px",
      borderRadius: 999,
      textTransform: "none",
      fontSize: 13,
      fontWeight: 600,
      color: theme.palette.text.secondary,
      opacity: 1,
      "&.Mui-selected": { color: theme.palette.text.primary }
    },
    count: {
      marginLeft: 6,
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 9,
      fontSize: 11,
      fontWeight: 700,
      lineHeight: "18px",
      color: t.brand.contrastText,
      backgroundColor: t.brand.main
    },
    listArea: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      animation: "$fade .22s ease both"
    },
    "@keyframes fade": {
      from: { opacity: 0, transform: "translateY(4px)" },
      to: { opacity: 1, transform: "none" }
    },
    sectionLabel: {
      flex: "none",
      padding: theme.spacing(1.25, 2.5, 0.5),
      fontSize: 13,
      fontWeight: 600,
      color: t.brand.text
    },
    contacts: { flex: "none", maxHeight: "40%", overflowY: "auto" },
    contactsFull: { flex: 1, maxHeight: "none" },
    sectionRow: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: theme.spacing(2),
      "& $sectionLabel": { flex: "none" }
    },
    deleteImported: {
      height: 24,
      padding: "0 10px",
      marginTop: 6,
      borderRadius: 999,
      fontSize: 11.5,
      fontWeight: 700,
      color: t.semantic.danger,
      backgroundColor: t.semantic.dangerSoft,
      transition: "transform .12s ease",
      "&:active": { transform: "scale(0.95)" }
    },
    contactRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 14,
      width: "100%",
      padding: theme.spacing(1, 2.5),
      textAlign: "left",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    contactAvatar: {
      flex: "none",
      width: 44,
      height: 44,
      fontWeight: 700,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft
    },
    contactText: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      paddingBottom: 10,
      marginBottom: -10,
      borderBottom: `1px solid ${t.border}`
    },
    contactName: {
      fontSize: 15,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    contactNumber: { fontSize: 13, color: theme.palette.text.secondary },
    hidden: { display: "none" }
  };
});

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { getSetting } = useSettings();
  const csvInput = useRef(null);
  const theme = useTheme();
  // no celular as abas não mostram a contagem
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));

  const [view, setView] = useState("list");
  const [query, setQuery] = useState("");
  const [searchParam, setSearchParam] = useState("");
  const [filter, setFilter] = useState("open"); // open | closed | groups
  const [tabOpen, setTabOpen] = useState("open");
  const [queueFilter, setQueueFilter] = useState([]);
  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [showTabGroups, setShowTabGroups] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmDeleteImported, setConfirmDeleteImported] = useState(false);

  const deleteImported = async () => {
    try {
      const { data } = await api.delete("/contacts/imported");
      toast.success(`${data?.deleted || 0} contatos excluídos`);
      // fecha a busca: ao abrir de novo, a lista já vem atualizada
      setContacts([]);
      setQuery("");
      setFocused(false);
    } catch (err) {
      toastError(err);
    }
  };

  // admin vê todas as filas da empresa; atendente, só as dele
  const [companyQueues, setCompanyQueues] = useState([]);
  useEffect(() => {
    if (user?.profile !== "admin") return;
    api
      .get("/queue")
      .then(({ data }) => setCompanyQueues(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [user?.profile]);
  const userQueues = useMemo(
    () =>
      user?.profile === "admin" && companyQueues.length
        ? companyQueues
        : user?.queues || [],
    [user, companyQueues]
  );
  // nenhuma fila marcada = todas as filas da pessoa
  // memorizado: um array novo a cada render fazia a lista se zerar em
  // loop (e as conversas não apareciam em Atendendo/Aguardando)
  const selectedQueueIds = useMemo(
    () => (queueFilter.length ? queueFilter : userQueues.map(q => q.id)),
    [queueFilter, userQueues]
  );
  const [focused, setFocused] = useState(false);
  const searchRef = useRef(null);
  const showAll = user?.profile === "admin";

  useEffect(() => {
    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")]).then(
      ([ignoreGroups, groupsTab]) =>
        setShowTabGroups(ignoreGroups === "disabled" && groupsTab === "enabled")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // busca: conversas e contatos
  useEffect(() => {
    const term = query.trim();
    const timer = setTimeout(
      async () => {
        setSearchParam(term.length >= 2 ? term.toLowerCase() : "");
        if (!focused && term.length < 2) {
          setContacts([]);
          return;
        }
        try {
          const { data } = await api.get("/contacts", {
            params: { searchParam: term.length >= 2 ? term : "", pageNumber: 1 }
          });
          setContacts(
            (data?.contacts || [])
              .filter(c => !c.isGroup)
              .slice(0, term.length >= 2 ? 10 : 40)
          );
        } catch (err) {
          setContacts([]);
        }
      },
      term ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [query, focused]);

  const typed = searchParam.length >= 2;
  // clicou na busca: já mostra os contatos; digitando, filtra
  const searching = focused || typed;

  const closeSearch = () => {
    setQuery("");
    setFocused(false);
    searchRef.current?.blur();
  };

  const toggleQueue = id =>
    setQueueFilter(prev =>
      prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
    );

  const startConversation = async contact => {
    try {
      const { data: ticket } = await api.post("/tickets", {
        contactId: contact.id,
        queueId: queueFilter.length === 1 ? queueFilter[0] : null,
        userId: user.id,
        status: "open"
      });
      setQuery("");
      setFocused(false);
      if (ticket?.uuid) history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    }
  };

  const importCsv = async e => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("contacts", file);
    try {
      await api.post("/contacts/importCsv", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success(i18n.t("contacts.toasts.imported"));
    } catch (err) {
      toastError(err);
    }
  };

  const importFromPhone = async () => {
    try {
      const { data } = await api.get("/whatsapp");
      const connection = (data || []).find(w => w.status === "CONNECTED");
      if (!connection) {
        toast.error("Nenhuma conexão do WhatsApp conectada");
        return;
      }
      await api.post("/contacts/import", { whatsappId: connection.id });
      toast.success("Importando os contatos do celular…");
    } catch (err) {
      toastError(err);
    }
  };

  if (view === "newContact") {
    return (
      <Paper elevation={0} variant="outlined" className={classes.root}>
        <NewContactPanel
          onBack={() => setView("list")}
          onSaved={contact => {
            setView("list");
            setQuery(contact?.name || "");
          }}
        />
      </Paper>
    );
  }

  const chip = (key, label, active, onClick, color) => (
    <ButtonBase
      key={key}
      className={`${classes.chip}${active ? ` ${classes.chipOn}` : ""}`}
      onClick={onClick}
    >
      {color && (
        <span className={classes.dot} style={{ backgroundColor: color }} />
      )}
      {label}
    </ButtonBase>
  );

  return (
    <Paper elevation={0} variant="outlined" className={classes.root}>
      <ConfirmationModal
        title="Excluir contatos importados?"
        open={confirmDeleteImported}
        onClose={() => setConfirmDeleteImported(false)}
        onConfirm={deleteImported}
      >
        Apaga todos os contatos que nunca tiveram conversa nem agendamento (os
        importados do celular ou da planilha). Contatos com conversas continuam.
        Nada é apagado no celular.
      </ConfirmationModal>
      <input
        ref={csvInput}
        type="file"
        accept=".csv"
        className={classes.hidden}
        onChange={importCsv}
      />
      <div className={classes.header}>
        <div className={classes.titleRow}>
          <span className={classes.title}>
            {i18n.t("ticketsManager.title", "Conversas")}
          </span>
          <Tooltip title="Novo contato">
            <IconButton
              className={classes.plus}
              onClick={e => setMenuAnchor(e.currentTarget)}
              aria-label="Novo"
            >
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setView("newContact");
              }}
            >
              <ListItemIcon>
                <PersonAddOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Novo contato
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                importFromPhone();
              }}
            >
              <ListItemIcon>
                <PhoneAndroidRoundedIcon fontSize="small" />
              </ListItemIcon>
              Importar contatos do celular
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                csvInput.current?.click();
              }}
            >
              <ListItemIcon>
                <InsertDriveFileOutlinedIcon fontSize="small" />
              </ListItemIcon>
              Importar planilha (CSV)
            </MenuItem>
          </Menu>
        </div>

        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            className={classes.searchInput}
            placeholder="Pesquisar ou começar uma nova conversa"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() =>
              // espera o clique num contato acontecer antes de fechar
              setTimeout(() => {
                if (!searchRef.current?.value) setFocused(false);
              }, 200)
            }
            inputRef={searchRef}
            onKeyDown={e => e.key === "Escape" && closeSearch()}
          />
          {searching && (
            <IconButton
              size="small"
              onMouseDown={e => e.preventDefault()}
              onClick={closeSearch}
              aria-label="Limpar"
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </label>

        {!searching && (
          <div className={classes.chips}>
            {chip(
              "all",
              "Tudo",
              filter === "open" && queueFilter.length === 0,
              () => {
                setFilter("open");
                setQueueFilter([]);
              }
            )}
            {showTabGroups &&
              chip(
                "groups",
                i18n.t("tickets.tabs.groups.title"),
                filter === "groups",
                () => setFilter(f => (f === "groups" ? "open" : "groups"))
              )}
            {chip(
              "closed",
              i18n.t("tickets.tabs.closed.title"),
              filter === "closed",
              () => setFilter(f => (f === "closed" ? "open" : "closed"))
            )}
          </div>
        )}
        {/* filas em balõezinhos, embaixo: vão quebrando linha conforme a quantidade */}
        {!searching && userQueues.length > 0 && (
          <div className={classes.queueChips}>
            {userQueues.map(queue =>
              chip(
                `q-${queue.id}`,
                queue.name,
                queueFilter.includes(queue.id),
                () => toggleQueue(queue.id),
                queue.color
              )
            )}
          </div>
        )}
      </div>

      {searching ? (
        <div className={classes.listArea} key="search">
          {contacts.length > 0 && (
            <>
              <div className={classes.sectionRow}>
                <span className={classes.sectionLabel}>Contatos</span>
                {user?.profile === "admin" && (
                  <ButtonBase
                    className={classes.deleteImported}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setConfirmDeleteImported(true)}
                  >
                    Excluir importados
                  </ButtonBase>
                )}
              </div>
              <div
                className={`${classes.contacts}${typed ? "" : ` ${classes.contactsFull}`}`}
              >
                {contacts.map(contact => (
                  <ButtonBase
                    key={contact.id}
                    className={classes.contactRow}
                    onClick={() => startConversation(contact)}
                  >
                    <Avatar
                      src={contact.profilePicUrl || undefined}
                      className={classes.contactAvatar}
                    >
                      {(contact.name || "?").trim().charAt(0).toUpperCase()}
                    </Avatar>
                    <span className={classes.contactText}>
                      <div className={classes.contactName}>{contact.name}</div>
                      <div className={classes.contactNumber}>
                        {contact.number}
                      </div>
                    </span>
                  </ButtonBase>
                ))}
              </div>
            </>
          )}
          {typed && <div className={classes.sectionLabel}>Conversas</div>}
          {typed && (
            <TicketsList
              isSearch
              searchParam={searchParam}
              showAll
              selectedQueueIds={selectedQueueIds}
              showTabGroups={showTabGroups}
            />
          )}
        </div>
      ) : filter === "closed" ? (
        <div className={classes.listArea} key="closed">
          <TicketsList
            status="closed"
            showAll
            selectedQueueIds={selectedQueueIds}
            showTabGroups={showTabGroups}
          />
        </div>
      ) : filter === "groups" ? (
        <div className={classes.listArea} key="groups">
          <TicketsList
            groups
            showAll
            selectedQueueIds={selectedQueueIds}
            showTabGroups={showTabGroups}
          />
        </div>
      ) : (
        <div className={classes.listArea} key="open">
          <Tabs
            value={tabOpen}
            onChange={(e, value) => setTabOpen(value)}
            variant="fullWidth"
            classes={{
              root: classes.pillTabs,
              indicator: classes.pillIndicator
            }}
          >
            <Tab
              value="open"
              classes={{ root: classes.pillTab }}
              label={
                <span>
                  {i18n.t("ticketsList.assignedHeader")}
                  {!isPhone && openCount > 0 && (
                    <span className={classes.count}>{openCount}</span>
                  )}
                </span>
              }
            />
            <Tab
              value="pending"
              classes={{ root: classes.pillTab }}
              label={
                <span>
                  {i18n.t("ticketsList.pendingHeader")}
                  {!isPhone && pendingCount > 0 && (
                    <span className={classes.count}>{pendingCount}</span>
                  )}
                </span>
              }
            />
          </Tabs>
          <TicketsList
            status="open"
            showAll={showAll}
            selectedQueueIds={selectedQueueIds}
            updateCount={setOpenCount}
            style={tabOpen === "open" ? undefined : { width: 0, height: 0 }}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            updateCount={setPendingCount}
            style={tabOpen === "pending" ? undefined : { width: 0, height: 0 }}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
        </div>
      )}
    </Paper>
  );
};

export default TicketsManagerTabs;
