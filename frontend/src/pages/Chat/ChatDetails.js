import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import moment from "moment";

import api from "../../services/api";
import UserAvatar from "../../components/ui/UserAvatar";
import { GroupIcon, OnlineDot, isDirect } from "./chatShared";

/**
 * Painel da direita, como no Discord: na conversa avulsa, o perfil da
 * pessoa; no grupo, a descrição e os membros (online primeiro).
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    root: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      backgroundColor: t.surfaceSunken,
      ...theme.scrollbarStyles
    },
    banner: { flex: "none", height: 92 },
    profile: {
      position: "relative",
      padding: theme.spacing(0, 2, 2),
      marginTop: -44
    },
    bigAvatar: {
      position: "relative",
      display: "inline-flex",
      borderRadius: "50%",
      border: `6px solid ${t.surfaceSunken}`
    },
    bigDot: { width: 20, height: 20, right: 2, bottom: 2 },
    name: {
      marginTop: 8,
      fontSize: "1.25rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere"
    },
    handle: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    card: {
      margin: theme.spacing(0, 1.5, 1.5),
      padding: theme.spacing(1.5),
      borderRadius: 10,
      backgroundColor: t.surface
    },
    label: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary,
      marginBottom: 4
    },
    value: {
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      "& + $label": { marginTop: 12 }
    },
    chips: { display: "flex", flexWrap: "wrap", gap: 6 },
    chip: {
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft
    },
    groupHead: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2)
    },
    groupTitle: {
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    section: {
      padding: theme.spacing(1.5, 2, 0.5),
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    member: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: "calc(100% - 16px)",
      margin: "0 8px",
      padding: "6px 8px",
      borderRadius: 8,
      justifyContent: "flex-start",
      textAlign: "left",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    offline: { opacity: 0.45 },
    memberName: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9063rem",
      fontWeight: 500,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    owner: { fontSize: "0.6875rem", color: "#F0B232" },
    actions: {
      marginTop: "auto",
      padding: theme.spacing(1.5, 2, 2),
      display: "flex",
      flexDirection: "column",
      gap: 8
    },
    action: { borderRadius: 8, textTransform: "none", fontWeight: 600 },
    danger: { color: theme.palette.tkv.semantic.danger }
  };
});

const ChatDetails = ({
  chat,
  me,
  presence,
  onOpenUser,
  onEdit,
  onLeave,
  onDelete
}) => {
  const classes = useStyles();
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!chat?.id) return undefined;
    let alive = true;
    api
      .get(`/chats/${chat.id}/members`)
      .then(({ data }) => alive && setMembers(Array.isArray(data) ? data : []))
      .catch(() => alive && setMembers([]));
    return () => {
      alive = false;
    };
  }, [chat?.id, chat?.users?.length]);

  const onlineOf = member =>
    presence[member.id] !== undefined ? presence[member.id] : member.online;

  if (!chat) return null;

  if (isDirect(chat)) {
    const other = members.find(m => m.id !== me.id);
    if (!other) return <div className={classes.root} />;
    return (
      <div className={classes.root}>
        <div
          className={classes.banner}
          style={{ backgroundColor: "var(--chat-banner)" }}
        />
        <div className={classes.profile}>
          <span className={classes.bigAvatar}>
            <UserAvatar user={other} size={80} />
            <OnlineDot online={onlineOf(other)} className={classes.bigDot} />
          </span>
          <div className={classes.name}>{other.name}</div>
          <div className={classes.handle}>
            {other.statusText || (onlineOf(other) ? "Online agora" : "Offline")}
          </div>
        </div>
        {other.bio && (
          <div className={classes.card}>
            <div className={classes.label}>Sobre mim</div>
            <div className={classes.value} style={{ whiteSpace: "pre-wrap" }}>
              {other.bio}
            </div>
          </div>
        )}
        <div className={classes.card}>
          <div className={classes.label}>E-mail</div>
          <div className={classes.value}>{other.email || "—"}</div>
          <div className={classes.label}>Função</div>
          <div className={classes.value}>
            {other.profile === "admin" ? "Administrador" : "Atendente"}
          </div>
          <div className={classes.label}>Membro desde</div>
          <div className={classes.value}>
            {moment(other.createdAt).format("D [de] MMM. [de] YYYY")}
          </div>
        </div>
        {other.commonGroups?.length > 0 && (
          <div className={classes.card}>
            <div className={classes.label}>
              {other.commonGroups.length} sala
              {other.commonGroups.length === 1 ? "" : "s"} em comum
            </div>
            <div className={classes.chips}>
              {other.commonGroups.map((title, i) => (
                <span key={`${title}-${i}`} className={classes.chip}>
                  {title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const online = members.filter(onlineOf);
  const offline = members.filter(m => !onlineOf(m));
  const isOwner = chat.ownerId === me.id;
  const canManage = isOwner || me.profile === "admin";

  const renderMember = (member, isOnline) => (
    <ButtonBase
      key={member.id}
      className={`${classes.member}${isOnline ? "" : ` ${classes.offline}`}`}
      disabled={member.id === me.id}
      onClick={() => onOpenUser(member)}
    >
      <span style={{ position: "relative", display: "inline-flex" }}>
        <UserAvatar user={member} size={32} />
        <OnlineDot online={isOnline} />
      </span>
      <span className={classes.memberName}>{member.name}</span>
      {member.id === chat.ownerId && <span className={classes.owner}>👑</span>}
    </ButtonBase>
  );

  return (
    <div className={classes.root}>
      <div className={classes.groupHead}>
        <GroupIcon title={chat.title} size={48} radius={16} />
        <div style={{ minWidth: 0 }}>
          <div className={classes.groupTitle}>{chat.title}</div>
          <div className={classes.handle}>
            {chat.isPublic ? "Sala pública" : "Sala privada"} · {members.length}{" "}
            membro{members.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>
      {chat.description && (
        <div className={classes.card}>
          <div className={classes.label}>Sobre</div>
          <div className={classes.value} style={{ whiteSpace: "pre-wrap" }}>
            {chat.description}
          </div>
        </div>
      )}
      <div className={classes.section}>Online — {online.length}</div>
      {online.map(m => renderMember(m, true))}
      {offline.length > 0 && (
        <>
          <div className={classes.section}>Offline — {offline.length}</div>
          {offline.map(m => renderMember(m, false))}
        </>
      )}
      <div className={classes.actions}>
        {canManage && (
          <Button
            variant="outlined"
            className={classes.action}
            onClick={onEdit}
          >
            Editar sala
          </Button>
        )}
        {!isOwner && (
          <Button
            variant="outlined"
            className={`${classes.action} ${classes.danger}`}
            onClick={onLeave}
          >
            Sair da sala
          </Button>
        )}
        {canManage && (
          <Button
            className={`${classes.action} ${classes.danger}`}
            onClick={onDelete}
          >
            Excluir sala
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatDetails;
