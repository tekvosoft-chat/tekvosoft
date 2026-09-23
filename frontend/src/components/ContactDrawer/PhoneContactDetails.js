import React, { useContext, useRef, useState } from "react";
import { AuthContext } from "../../context/Auth/AuthContext";
import { planAllows } from "../../helpers/planFeatures";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import ConfirmationModal from "../ConfirmationModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { Lightbox } from "react-modal-image";

import { alpha, makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Slide from "@material-ui/core/Slide";
import Typography from "@material-ui/core/Typography";
import ArrowBackIosRoundedIcon from "@material-ui/icons/ArrowBackIosRounded";
import PhoneOutlinedIcon from "@material-ui/icons/PhoneOutlined";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import EventOutlinedIcon from "@material-ui/icons/EventOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import PersonOutlineRoundedIcon from "@material-ui/icons/PersonOutlineRounded";
import SyncAltRoundedIcon from "@material-ui/icons/SyncAltRounded";
import MailOutlineRoundedIcon from "@material-ui/icons/MailOutlineRounded";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";

import { i18n } from "../../translate/i18n";
import {
  formatWhatsappContactName,
  formatWhatsappContactNumber
} from "../../helpers/formatWhatsappDisplay";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import { TicketNotes } from "../TicketNotes";
import { TagsContainer } from "../TagsContainer";
import ScheduleModal from "../ScheduleModal";
import ContactMedia from "./ContactMedia";
import ContactSchedules from "./ContactSchedules";
import ContactJourney from "../ContactJourney";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import PeopleOutlineRoundedIcon from "@material-ui/icons/PeopleOutlineRounded";
import PersonAddOutlinedIcon from "@material-ui/icons/PersonAddOutlined";
import BusinessOutlinedIcon from "@material-ui/icons/BusinessOutlined";
import InstagramIcon from "@material-ui/icons/Instagram";
import FacebookIcon from "@material-ui/icons/Facebook";
import TextField from "@material-ui/core/TextField";
import Switch from "@material-ui/core/Switch";
import OfflineBoltRoundedIcon from "@material-ui/icons/OfflineBoltRounded";
import {
  GroupDescription,
  GroupMembers,
  GroupMembership,
  useGroupInfo
} from "./GroupDetails";

/**
 * "Dados do contato" no celular, no desenho do WhatsApp do iPhone: tela
 * inteira que entra pela direita, foto grande, nome e número em destaque,
 * três atalhos em cartões e o resto em listas agrupadas.
 *
 * Tudo aqui já existia na gaveta lateral do computador (editar, observações,
 * tags, informações extras) ou no próprio atendimento (fila, atendente,
 * conexão). Nada novo é gravado: só muda como é mostrado.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const isDark = theme.mode === "dark";
  const group = isDark ? t.surface : "#FFFFFF";
  return {
    panel: {
      position: "absolute",
      inset: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: theme.zIndex.appBar + 5,
      display: "flex",
      flexDirection: "column",
      backgroundColor: isDark ? t.canvas : "#F2F2F7"
    },
    topBar: {
      flex: "none",
      display: "grid",
      gridTemplateColumns: "88px 1fr 88px",
      alignItems: "center",
      minHeight: 52,
      padding: "0 4px"
    },
    back: {
      justifySelf: "start",
      color: t.brand.text,
      "& svg": { fontSize: 24 }
    },
    topTitle: {
      textAlign: "center",
      fontSize: "1.0625rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    edit: {
      justifySelf: "end",
      padding: "8px 12px",
      borderRadius: t.radius.sm,
      fontSize: "1.0625rem",
      color: t.brand.text
    },
    scroll: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch",
      overscrollBehavior: "contain",
      padding: "8px 16px",
      paddingBottom: "calc(24px + var(--safe-bottom, 0px))"
    },
    hero: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "8px 0 20px"
    },
    avatar: {
      width: 112,
      height: 112,
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#FFFFFF",
      marginBottom: 14,
      cursor: "pointer"
    },
    name: {
      fontSize: "1.625rem",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary,
      wordBreak: "break-word"
    },
    number: {
      marginTop: 4,
      fontSize: "1.0625rem",
      color: theme.palette.text.secondary
    },
    // o lápis edita o nome aqui mesmo, no lugar dele
    nameField: {
      maxWidth: 320,
      "& input": {
        fontSize: "1.375rem",
        fontWeight: 700,
        textAlign: "center",
        color: theme.palette.text.primary
      }
    },
    groupCount: { color: t.brand.text, fontWeight: 600 },
    // dados de um membro do grupo, por cima do painel do grupo
    nested: { position: "absolute", inset: 0, zIndex: 3 },
    actions: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 10,
      marginBottom: 20
    },
    actionCard: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "14px 4px 12px",
      borderRadius: t.radius.lg,
      backgroundColor: group,
      color: t.brand.text,
      fontSize: "0.875rem",
      fontWeight: 500,
      "& svg": { fontSize: 26 },
      "&.Mui-disabled": { opacity: 0.45 }
    },
    group: {
      marginBottom: 20,
      borderRadius: t.radius.lg,
      backgroundColor: group,
      overflow: "hidden"
    },
    groupTitle: {
      padding: "0 16px 6px",
      fontSize: "0.8125rem",
      textTransform: "uppercase",
      letterSpacing: "0.02em",
      color: theme.palette.text.secondary
    },
    row: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 14,
      minHeight: 50,
      padding: "0 12px 0 16px",
      textAlign: "left",
      justifyContent: "flex-start",
      "& + $row $rowBody": { borderTop: `1px solid ${t.border}` }
    },
    rowIcon: {
      flex: "none",
      display: "flex",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 24 }
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      alignSelf: "stretch",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    rowLabel: {
      flex: "none",
      fontSize: "1rem",
      color: theme.palette.text.primary
    },
    rowValue: {
      flex: 1,
      minWidth: 0,
      textAlign: "right",
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    chevron: {
      flex: "none",
      color: theme.palette.text.secondary,
      opacity: 0.6,
      transition: "transform .2s ease"
    },
    chevronOpen: { transform: "rotate(90deg)" },
    brandRow: {
      "& $rowLabel": { color: t.brand.text },
      "& $rowIcon": { color: t.brand.text }
    },
    expand: {
      padding: "4px 12px 12px",
      borderTop: `1px solid ${t.border}`
    },

    // computador: dentro da gaveta, no desenho do WhatsApp Web
    // vidro fosco: o papel de parede da conversa aparece de leve por trás
    desktop: {
      position: "relative",
      height: "100%",
      backgroundColor: alpha(t.surface, 0.72),
      backdropFilter: "saturate(1.6) blur(20px)",
      WebkitBackdropFilter: "saturate(1.6) blur(20px)",
      "& $topBar": {
        gridTemplateColumns: "48px 1fr 48px",
        minHeight: 60,
        borderBottom: `1px solid ${alpha(t.border, 0.6)}`,
        "& $topTitle": { textAlign: "left", fontWeight: 500 }
      },
      "& $scroll": { padding: 0 },
      "& $hero": { padding: "28px 16px 20px" },
      "& $avatar": { width: 132, height: 132 },
      "& $name": { fontSize: "1.375rem", fontWeight: 500 },
      "& $actions": {
        display: "flex",
        justifyContent: "center",
        gap: 16,
        padding: "0 16px 20px",
        marginBottom: 0,
        borderBottom: `8px solid ${alpha(t.canvas, 0.45)}`
      },
      "& $actionCard": {
        width: 76,
        padding: 0,
        gap: 6,
        backgroundColor: "transparent",
        fontSize: "0.8125rem",
        color: theme.palette.text.secondary,
        "& svg": {
          boxSizing: "content-box",
          padding: 14,
          borderRadius: "50%",
          fontSize: 22,
          color: t.brand.text,
          backgroundColor: alpha(t.surface, 0.5),
          border: `1px solid ${t.border}`
        }
      },
      "& $group": {
        marginBottom: 0,
        borderRadius: 0,
        backgroundColor: "transparent",
        borderBottom: `8px solid ${alpha(t.canvas, 0.45)}`
      },
      "& $groupTitle": { padding: "14px 16px 4px" }
    },
    iconBtn: { color: theme.palette.text.secondary },
    deleteRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 16,
      width: "100%",
      minHeight: 52,
      padding: "0 16px",
      fontSize: "0.9375rem",
      fontWeight: 500,
      color: t.semantic.danger,
      "& svg": { fontSize: 22 },
      "&:hover": { backgroundColor: t.semantic.dangerSoft }
    }
  };
});

/**
 * Linha da ficha. Com "editing" ela vira um campo ali mesmo (no computador
 * abria uma janela só para mudar uma palavra) — Enter salva, Esc desiste.
 */
const Row = ({
  icon,
  label,
  value,
  onClick,
  chevron,
  open,
  brand,
  editing,
  onChangeEdit,
  onSave,
  onCancel
}) => {
  const classes = useStyles();
  if (editing) {
    return (
      <div className={classes.row}>
        <span className={classes.rowIcon}>{icon}</span>
        <span className={classes.rowBody}>
          <span className={classes.rowLabel}>{label}</span>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={value}
            onChange={e => onChangeEdit(e.target.value)}
            onBlur={onSave}
            onKeyDown={e => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onCancel();
            }}
            InputProps={{ disableUnderline: false }}
          />
        </span>
      </div>
    );
  }
  return (
    <ButtonBase
      component={onClick ? "button" : "div"}
      disabled={!onClick}
      onClick={onClick}
      className={`${classes.row}${brand ? ` ${classes.brandRow}` : ""}`}
      style={onClick ? undefined : { pointerEvents: "none" }}
    >
      <span className={classes.rowIcon}>{icon}</span>
      <span className={classes.rowBody}>
        <span className={classes.rowLabel}>{label}</span>
        <span className={classes.rowValue}>{value}</span>
        {chevron && (
          <ChevronRightRoundedIcon
            className={`${classes.chevron}${open ? ` ${classes.chevronOpen}` : ""}`}
          />
        )}
      </span>
    </ButtonBase>
  );
};

const PhoneContactDetails = ({
  open,
  onClose,
  contact,
  ticket,
  showTags,
  variant = "phone"
}) => {
  const classes = useStyles();
  const desktop = variant === "desktop";
  const [panelEl, setPanelEl] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [schedulesVersion, setSchedulesVersion] = useState(0);
  const { user } = useContext(AuthContext);
  const canSchedule = planAllows(user, "useSchedules");
  const [photoOpen, setPhotoOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const history = useHistory();

  const name = formatWhatsappContactName(contact, ticket);
  const number = formatWhatsappContactNumber(contact);
  const digits = String(contact?.number || "").replace(/\D/g, "");
  const photo = contact?.profileHiresPictureUrl || contact?.profilePicUrl;
  const t = key => i18n.t(`contactDrawer.phone.${key}`);

  // grupo: membros, descrição e sair/entrar vêm do WhatsApp
  // o contato do atendimento às vezes chega sem isGroup: vale o do ticket
  const isGroup = !!(contact?.isGroup || ticket?.isGroup);
  const [memberContact, setMemberContact] = useState(null);
  const openMember = async member => {
    try {
      const { data } = member.contactId
        ? await api.get(`/contacts/${member.contactId}`)
        : await api.post("/contacts", {
            name: member.name || member.number,
            number: member.number
          });
      setMemberContact(data);
    } catch (err) {
      toastError(err);
    }
  };

  // detalhes do contato: e-mail no próprio contato; sobrenome, empresa e
  // redes sociais em "informações extras" (sem mudar o banco)
  const [saved, setSaved] = useState(null);
  const current = saved?.id === contact?.id ? saved : contact;
  const [editing, setEditing] = useState(null);
  const DETAILS = [
    ["Sobrenome", <PersonAddOutlinedIcon />],
    ["Empresa", <BusinessOutlinedIcon />],
    ["Instagram", <InstagramIcon />],
    ["Facebook", <FacebookIcon />]
  ];
  const detailNames = DETAILS.map(([key]) => key);
  const extraOf = key =>
    current?.extraInfo?.find(info => info.name === key)?.value || "";
  // o que a IA já entendeu do contato abre no mapa da conversa
  const [journeyOpen, setJourneyOpen] = useState(false);

  const setSyncToPhone = async value => {
    try {
      const { data } = await api.put(`/contacts/${current.id}`, {
        name: current.name,
        number: current.number,
        email: current.email || "",
        syncToPhone: value
      });
      setSaved(data);
      toast.success(
        value
          ? "Contato sincronizado com a agenda do celular"
          : "Sincronização desligada"
      );
    } catch (err) {
      toastError(err);
    }
  };

  const saveDetail = async () => {
    const { key, value } = editing;
    const isExtra = !["name", "email"].includes(key);
    const extra = (current?.extraInfo || []).filter(
      info => !isExtra || info.name !== key
    );
    const old = current?.extraInfo?.find(info => info.name === key);
    if (isExtra && value.trim()) {
      extra.push({ ...(old?.id ? { id: old.id } : {}), name: key, value });
    }
    try {
      const { data } = await api.put(`/contacts/${current.id}`, {
        // nome vazio não apaga o que já estava
        name: key === "name" ? value.trim() || current.name : current.name,
        number: current.number,
        email: key === "email" ? value.trim() : current.email || "",
        extraInfo: extra
      });
      setSaved(data);
      setEditing(null);
    } catch (err) {
      toastError(err);
    }
  };
  const startNameEdit = () => {
    if (!current?.id || isGroup) return;
    setEditing({ key: "name", value: current?.name || "" });
  };

  const { info: groupInfo, reload: reloadGroup } = useGroupInfo(
    ticket?.id,
    open && isGroup
  );
  const memberSearch = useRef(null);
  const membersRef = useRef(null);
  const header = isGroup
    ? i18n.t("contactDrawer.group.header")
    : i18n.t("contactDrawer.header");

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(digits ? `+${digits}` : number);
      toast.success(t("copied"));
    } catch (err) {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <>
      {photoOpen && photo && (
        <Lightbox
          medium={photo}
          large={photo}
          onClose={() => setPhotoOpen(false)}
        />
      )}
      <Slide
        direction="left"
        in={open}
        mountOnEnter
        unmountOnExit
        timeout={desktop ? 0 : undefined}
      >
        <div
          ref={setPanelEl}
          className={
            desktop ? `${classes.panel} ${classes.desktop}` : classes.panel
          }
          role="dialog"
          aria-label={i18n.t("contactDrawer.header")}
        >
          {desktop ? (
            <div className={classes.topBar}>
              <IconButton
                className={classes.iconBtn}
                onClick={onClose}
                aria-label={i18n.t("common.close")}
              >
                <CloseRoundedIcon />
              </IconButton>
              <Typography className={classes.topTitle} component="h2">
                {header}
              </Typography>
              {isGroup ? (
                <span />
              ) : (
                <IconButton
                  className={classes.iconBtn}
                  onClick={startNameEdit}
                  aria-label={t("edit")}
                >
                  <EditOutlinedIcon />
                </IconButton>
              )}
            </div>
          ) : (
            <div className={classes.topBar}>
              <IconButton
                className={classes.back}
                onClick={onClose}
                aria-label={i18n.t("common.back")}
              >
                <ArrowBackIosRoundedIcon />
              </IconButton>
              <Typography className={classes.topTitle} component="h2">
                {header}
              </Typography>
              {isGroup ? (
                <span />
              ) : (
                <ButtonBase className={classes.edit} onClick={startNameEdit}>
                  {t("edit")}
                </ButtonBase>
              )}
            </div>
          )}

          <div className={classes.scroll}>
            <div className={classes.hero}>
              <Avatar
                src={contact?.profilePicUrl}
                alt=""
                className={classes.avatar}
                style={{ backgroundColor: generateColor(contact?.number) }}
                onClick={() => photo && setPhotoOpen(true)}
              >
                {getInitials(name)}
              </Avatar>
              {editing?.key === "name" ? (
                <TextField
                  autoFocus
                  fullWidth
                  size="small"
                  className={classes.nameField}
                  value={editing.value}
                  onChange={e =>
                    setEditing(prev => ({ ...prev, value: e.target.value }))
                  }
                  onBlur={saveDetail}
                  onKeyDown={e => {
                    if (e.key === "Enter") saveDetail();
                    if (e.key === "Escape") setEditing(null);
                  }}
                  inputProps={{
                    "aria-label": i18n.t("contactModal.form.name")
                  }}
                />
              ) : (
                <Typography
                  className={classes.name}
                  component="h1"
                  onDoubleClick={startNameEdit}
                >
                  {name}
                </Typography>
              )}
              {isGroup ? (
                <Typography className={classes.number}>
                  {i18n.t("contactDrawer.group.kind")}
                  {groupInfo?.size > 0 && (
                    <>
                      {" · "}
                      <span className={classes.groupCount}>
                        {i18n.t("contactDrawer.group.members", {
                          count: groupInfo.size
                        })}
                      </span>
                    </>
                  )}
                </Typography>
              ) : (
                number && (
                  <Typography className={classes.number}>{number}</Typography>
                )
              )}
            </div>

            {isGroup ? (
              <div className={classes.actions}>
                <ButtonBase
                  className={classes.actionCard}
                  onClick={() => memberSearch.current?.()}
                  disabled={!groupInfo?.participants?.length}
                >
                  <SearchRoundedIcon />
                  {i18n.t("contactDrawer.group.actionSearch")}
                </ButtonBase>
                <ButtonBase
                  className={classes.actionCard}
                  onClick={() =>
                    membersRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start"
                    })
                  }
                  disabled={!groupInfo?.participants?.length}
                >
                  <PeopleOutlineRoundedIcon />
                  {i18n.t("contactDrawer.group.actionMembers")}
                </ButtonBase>
                <ButtonBase
                  className={classes.actionCard}
                  onClick={() => setScheduleOpen(true)}
                  disabled={!contact?.id || !canSchedule}
                >
                  <EventOutlinedIcon />
                  {t("schedule")}
                </ButtonBase>
              </div>
            ) : (
              <div className={classes.actions}>
                <ButtonBase
                  className={classes.actionCard}
                  component="a"
                  href={digits ? `tel:+${digits}` : undefined}
                  disabled={!digits || contact?.isGroup}
                >
                  <PhoneOutlinedIcon />
                  {t("call")}
                </ButtonBase>
                <ButtonBase
                  className={classes.actionCard}
                  onClick={copyNumber}
                  disabled={!number}
                >
                  <FileCopyOutlinedIcon />
                  {t("copy")}
                </ButtonBase>
                <ButtonBase
                  className={classes.actionCard}
                  onClick={() => setScheduleOpen(true)}
                  disabled={!contact?.id || !canSchedule}
                >
                  <EventOutlinedIcon />
                  {t("schedule")}
                </ButtonBase>
              </div>
            )}

            {isGroup && (
              <GroupDescription info={groupInfo} className={classes.group} />
            )}

            {contact?.id && (
              <div className={classes.group}>
                <ContactMedia
                  contactId={contact.id}
                  galleryHost={node =>
                    panelEl ? createPortal(node, panelEl) : null
                  }
                />
              </div>
            )}

            {isGroup && (
              <div ref={membersRef}>
                <GroupMembers
                  info={groupInfo}
                  ticketId={ticket?.id}
                  searchRef={memberSearch}
                  onSelect={openMember}
                  className={classes.group}
                />
              </div>
            )}

            {contact?.id && canSchedule && (
              <div className={classes.group}>
                <ContactSchedules
                  contactId={contact.id}
                  reloadKey={schedulesVersion}
                  onNew={() => setScheduleOpen(true)}
                />
              </div>
            )}

            <div className={classes.group}>
              <Row
                brand
                chevron
                open={notesOpen}
                icon={<DescriptionOutlinedIcon />}
                label={t("notes")}
                onClick={() => setNotesOpen(v => !v)}
              />
              {notesOpen && ticket?.id && (
                <div className={classes.expand}>
                  <TicketNotes ticket={ticket} />
                </div>
              )}
            </div>

            <div className={classes.group}>
              {showTags && (
                <>
                  <Row
                    chevron
                    open={tagsOpen}
                    icon={<LocalOfferOutlinedIcon />}
                    label={t("tags")}
                    value={
                      contact?.tags?.length
                        ? contact.tags.map(tag => tag.name).join(", ")
                        : t("none")
                    }
                    onClick={() => setTagsOpen(v => !v)}
                  />
                  {tagsOpen && (
                    <div className={classes.expand}>
                      <TagsContainer contact={contact} />
                    </div>
                  )}
                </>
              )}
              {!isGroup && contact?.id && (
                <>
                  <Row
                    icon={<MailOutlineRoundedIcon />}
                    label={t("email")}
                    value={current?.email || "—"}
                    onClick={() =>
                      setEditing({ key: "email", value: current?.email || "" })
                    }
                  />
                  {DETAILS.map(([key, icon]) => (
                    <Row
                      key={key}
                      icon={icon}
                      label={i18n.t(`contactDrawer.details.${key}`, key)}
                      value={
                        editing?.key === key
                          ? editing.value
                          : extraOf(key) || "—"
                      }
                      editing={editing?.key === key}
                      onChangeEdit={value =>
                        setEditing(prev => ({ ...prev, value }))
                      }
                      onSave={saveDetail}
                      onCancel={() => setEditing(null)}
                      onClick={() => setEditing({ key, value: extraOf(key) })}
                    />
                  ))}
                  <Row
                    brand
                    chevron
                    icon={<OfflineBoltRoundedIcon />}
                    label="Assistente"
                    value="Mapa da conversa"
                    onClick={() => setJourneyOpen(true)}
                  />
                  <div className={classes.row}>
                    <span className={classes.rowIcon}>
                      <SyncAltRoundedIcon />
                    </span>
                    <span className={classes.rowBody}>
                      <span className={classes.rowLabel}>
                        Agenda do celular
                      </span>
                      <span className={classes.rowValue}>
                        {current?.syncToPhone
                          ? "O nome daqui vai para o celular"
                          : "Não sincroniza"}
                      </span>
                    </span>
                    <Switch
                      size="small"
                      color="primary"
                      checked={!!current?.syncToPhone}
                      onChange={e => setSyncToPhone(e.target.checked)}
                    />
                  </div>
                </>
              )}
              {ticket && (
                <>
                  <Row
                    icon={<AccountTreeOutlinedIcon />}
                    label={t("queue")}
                    value={ticket?.queue?.name || t("noQueue")}
                  />
                  <Row
                    icon={<PersonOutlineRoundedIcon />}
                    label={t("attendant")}
                    value={ticket?.user?.name || t("unassigned")}
                  />
                  <Row
                    icon={<SyncAltRoundedIcon />}
                    label={t("connection")}
                    value={ticket?.whatsapp?.name || "—"}
                  />
                </>
              )}
            </div>

            {isGroup && (
              <GroupMembership
                info={groupInfo}
                ticketId={ticket?.id}
                isAdmin={user?.profile === "admin"}
                onChange={reloadGroup}
                className={classes.group}
              />
            )}

            {user?.profile === "admin" && ticket?.id && (
              <div className={classes.group}>
                <ButtonBase
                  className={classes.deleteRow}
                  onClick={() => setConfirmDelete(true)}
                >
                  <DeleteOutlineRoundedIcon />
                  Excluir conversa
                </ButtonBase>
              </div>
            )}

            {current?.extraInfo?.some(i => !detailNames.includes(i.name)) && (
              <>
                <Typography className={classes.groupTitle} component="h3">
                  {i18n.t("contactModal.form.extraInfo")}
                </Typography>
                <div className={classes.group}>
                  {current.extraInfo
                    .filter(info => !detailNames.includes(info.name))
                    .map(info => (
                      <Row
                        key={info.id || info.name}
                        icon={<InfoOutlinedIcon />}
                        label={info.name}
                        value={info.value}
                      />
                    ))}
                </div>
              </>
            )}
          </div>
          {memberContact && (
            <div className={classes.nested}>
              <PhoneContactDetails
                variant="desktop"
                open
                contact={memberContact}
                ticket={null}
                showTags={false}
                onClose={() => setMemberContact(null)}
              />
            </div>
          )}
        </div>
      </Slide>

      <ConfirmationModal
        title="Excluir esta conversa?"
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/tickets/${ticket.id}`);
            toast.success("Conversa excluída do sistema");
            onClose?.();
            history.push("/tickets");
          } catch (err) {
            toastError(err);
          }
        }}
      >
        Ela some do vuup.me (atendimento e mensagens salvas aqui), como se nunca
        tivesse existido. Nada é apagado no WhatsApp do cliente nem no seu
        celular.
      </ConfirmationModal>

      {journeyOpen && (
        <ContactJourney
          open={journeyOpen}
          onClose={() => setJourneyOpen(false)}
          contact={current}
        />
      )}
      {scheduleOpen && (
        <ScheduleModal
          open={scheduleOpen}
          onClose={() => {
            setScheduleOpen(false);
            setSchedulesVersion(v => v + 1);
          }}
          reload={() => setSchedulesVersion(v => v + 1)}
          contactId={contact?.id}
        />
      )}
    </>
  );
};

export default PhoneContactDetails;
