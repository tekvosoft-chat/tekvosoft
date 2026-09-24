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
import Tooltip from "@material-ui/core/Tooltip";
import Collapse from "@material-ui/core/Collapse";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import PersonAddOutlinedIcon from "@material-ui/icons/PersonAddOutlined";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import PhoneAndroidRoundedIcon from "@material-ui/icons/PhoneAndroidRounded";
import { toast } from "react-toastify";

import TicketsList from "../TicketsListCustom";
import NewContactPanel from "./NewContactPanel";
import ContactPicture from "./ContactPicture";
import {
  addRecentContact,
  getRecentContacts
} from "../../helpers/recentContacts";
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
/**
 * De onde a mensagem chega. O WhatsApp já existe; os outros aparecem no
 * filtro assim que houver uma caixa de entrada daquele tipo conectada.
 */
const CANAIS = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  instagram: { label: "Instagram", color: "#E1306C" },
  facebook: { label: "Facebook", color: "#1877F2" },
  tiktok: { label: "TikTok", color: "#69C9D0" },
  webchat: { label: "Site", color: "#6C4BD8" }
};

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
    header: {
      position: "relative",
      zIndex: 6,
      flex: "none",
      padding: theme.spacing(1.5, 1.5, 1)
    },
    // filtros à esquerda e o "+" à direita, logo abaixo da busca
    filterRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: theme.spacing(1.25),
      "& $chips": { flex: 1, minWidth: 0, marginTop: 0 }
    },
    plus: {
      flex: "none",
      width: 34,
      height: 34,
      color: t.brand.contrastText,
      backgroundColor: t.brand.main,
      transition: "transform .15s ease, background-color .15s ease",
      "&:hover": { backgroundColor: t.brand.hover, transform: "rotate(90deg)" },
      "& svg": { fontSize: 22 }
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
    searchWrap: { position: "relative" },
    // painel que abre embaixo da busca e empurra a lista para baixo
    dropdown: {
      marginTop: 8,
      display: "flex",
      flexDirection: "column",
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: t.surfaceSunken
    },
    "@keyframes drop": {
      from: { opacity: 0, transform: "translateY(-10px) scaleY(.92)" },
      to: { opacity: 1, transform: "none" }
    },
    dropdownList: {
      maxHeight: "min(320px, calc(var(--vh, 100vh) * 0.4))",
      overflowY: "auto",
      paddingBottom: 6
    },
    dropdownHint: {
      padding: theme.spacing(1, 2.5, 2),
      fontSize: 13.5,
      color: theme.palette.text.secondary
    },
    // conversas atrás do painel ficam levemente escurecidas
    dim: {
      position: "absolute",
      inset: 0,
      zIndex: 5,
      backgroundColor: "rgba(12, 10, 20, 0.18)",
      animation: "$dimIn .2s ease both"
    },
    "@keyframes dimIn": { from: { opacity: 0 }, to: { opacity: 1 } },
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
      animation: "$rowIn .22s ease both",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    "@keyframes rowIn": {
      from: { opacity: 0, transform: "translateY(-4px)" },
      to: { opacity: 1, transform: "none" }
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
    // últimos contatos pesquisados, em bolinhas, ao abrir a busca
    recentRow: {
      display: "flex",
      gap: 4,
      padding: theme.spacing(0.5, 1.5, 1),
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" }
    },
    recentItem: {
      flex: "none",
      width: 68,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "8px 2px 6px",
      borderRadius: 14,
      animation: "$rowIn .22s ease both",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.surfaceHover },
      "&:hover $recentAvatar": { transform: "scale(1.06)" }
    },
    recentAvatar: {
      width: 50,
      height: 50,
      fontWeight: 700,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      boxShadow: `0 0 0 2px ${t.surface}, 0 0 0 4px ${t.brand.main}33`,
      transition: "transform .15s ease"
    },
    recentName: {
      maxWidth: "100%",
      fontSize: 12,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
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
  // canais marcados no filtro (vazio = todos)
  const [channelFilter, setChannelFilter] = useState([]);
  const [canais, setCanais] = useState([]);
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
  const [recentContacts, setRecentContacts] = useState(() =>
    getRecentContacts(user)
  );
  const rememberContact = contact =>
    setRecentContacts(addRecentContact(user, contact));
  const showAll = user?.profile === "admin";

  // canais conectados: o filtro só aparece quando há mais de um
  useEffect(() => {
    api
      .get("/whatsapp", { params: { session: 0 } })
      .then(({ data }) => {
        const tipos = [
          ...new Set((data || []).map(item => item.channel || "whatsapp"))
        ].filter(tipo => CANAIS[tipo]);
        setCanais(tipos);
      })
      .catch(() => setCanais([]));
  }, []);

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
        // só busca contatos quando a pessoa começa a digitar
        if (term.length < 2) {
          setContacts([]);
          setContactsLoaded(false);
          return;
        }
        try {
          const { data } = await api.get("/contacts", {
            params: { searchParam: term, pageNumber: 1 }
          });
          setContacts(
            (data?.contacts || []).filter(c => !c.isGroup).slice(0, 8)
          );
          setContactsLoaded(true);
        } catch (err) {
          setContacts([]);
        }
      },
      term ? 300 : 0
    );
    return () => clearTimeout(timer);
  }, [query]);

  const typed = searchParam.length >= 2;
  const searching = focused || typed;
  const [contactsLoaded, setContactsLoaded] = useState(false);

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
    rememberContact(contact);
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
        <div className={classes.searchWrap}>
          <label className={classes.search}>
            <SearchRoundedIcon fontSize="small" />
            <InputBase
              className={classes.searchInput}
              placeholder={
                isPhone
                  ? "Pesquisar ou nova conversa"
                  : "Pesquisar ou começar uma nova conversa"
              }
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

          {/* painel que desce da busca: contatos conforme digita; as conversas
            continuam aparecendo atrás, levemente escurecidas */}
          <Collapse in={focused} timeout={260} unmountOnExit>
            <div className={classes.dropdown} role="listbox">
              <div className={classes.sectionRow}>
                <span className={classes.sectionLabel}>
                  {query.trim().length < 2 && recentContacts.length
                    ? "Recentes"
                    : "Contatos"}
                </span>
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
              {query.trim().length < 2 ? (
                <>
                  {recentContacts.length > 0 && (
                    <div className={classes.recentRow}>
                      {recentContacts.map((contact, index) => (
                        <ButtonBase
                          key={contact.id}
                          className={classes.recentItem}
                          style={{ animationDelay: `${index * 30}ms` }}
                          title={contact.name}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => startConversation(contact)}
                        >
                          <ContactPicture
                            contact={contact}
                            className={classes.recentAvatar}
                          />
                          <span className={classes.recentName}>
                            {
                              (contact.name || contact.number || "")
                                .trim()
                                .split(/\s+/)[0]
                            }
                          </span>
                        </ButtonBase>
                      ))}
                    </div>
                  )}
                  <div className={classes.dropdownHint}>
                    Digite o nome ou o número para encontrar um contato
                  </div>
                </>
              ) : contacts.length === 0 ? (
                <div className={classes.dropdownHint}>
                  {contactsLoaded ? "Nenhum contato encontrado" : "Buscando…"}
                </div>
              ) : (
                <div className={classes.dropdownList}>
                  {contacts.map((contact, index) => (
                    <ButtonBase
                      key={contact.id}
                      className={classes.contactRow}
                      style={{ animationDelay: `${index * 25}ms` }}
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => startConversation(contact)}
                    >
                      <ContactPicture
                        contact={contact}
                        className={classes.contactAvatar}
                      />
                      <span className={classes.contactText}>
                        <div className={classes.contactName}>
                          {contact.name}
                        </div>
                        <div className={classes.contactNumber}>
                          {contact.number}
                        </div>
                      </span>
                    </ButtonBase>
                  ))}
                </div>
              )}
            </div>
          </Collapse>
        </div>

        <div className={classes.filterRow}>
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
        {/* de onde chega: só faz sentido quando existe mais de um canal */}
        {canais.length > 1 && (
          <div className={classes.queueChips}>
            {chip(
              "canal-todos",
              "Todos os canais",
              channelFilter.length === 0,
              () => setChannelFilter([])
            )}
            {canais.map(tipo =>
              chip(
                `canal-${tipo}`,
                CANAIS[tipo].label,
                channelFilter.includes(tipo),
                () =>
                  setChannelFilter(prev =>
                    prev.includes(tipo)
                      ? prev.filter(item => item !== tipo)
                      : [...prev, tipo]
                  ),
                CANAIS[tipo].color
              )
            )}
          </div>
        )}
        {/* filas em balõezinhos, embaixo: vão quebrando linha conforme a quantidade */}
        {userQueues.length > 0 && (
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

      {typed ? (
        <div className={classes.listArea} key="search">
          <div className={classes.sectionLabel}>Conversas</div>
          <TicketsList
            isSearch
            onSelectTicket={ticket => rememberContact(ticket.contact)}
            searchParam={searchParam}
            showAll
            selectedQueueIds={selectedQueueIds}
            channelFilter={channelFilter}
            showTabGroups={showTabGroups}
          />
        </div>
      ) : filter === "closed" ? (
        <div className={classes.listArea} key="closed">
          <TicketsList
            status="closed"
            showAll
            selectedQueueIds={selectedQueueIds}
            channelFilter={channelFilter}
            showTabGroups={showTabGroups}
          />
        </div>
      ) : filter === "groups" ? (
        <div className={classes.listArea} key="groups">
          <TicketsList
            groups
            showAll
            selectedQueueIds={selectedQueueIds}
            channelFilter={channelFilter}
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
            channelFilter={channelFilter}
            updateCount={setOpenCount}
            style={tabOpen === "open" ? undefined : { width: 0, height: 0 }}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            channelFilter={channelFilter}
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
