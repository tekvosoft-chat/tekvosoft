import React, { useContext, useState } from "react";
import {
  Avatar,
  ButtonBase,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  makeStyles
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import MoreVertIcon from "@material-ui/icons/MoreVert";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";

import { AuthContext } from "../../context/Auth/AuthContext";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmptyState from "../../components/ui/EmptyState";
import { getInitials } from "../../helpers/getInitials";
import { i18n } from "../../translate/i18n";
import api from "../../services/api";

/**
 * Lista de conversas do chat interno.
 *
 * Antes: título com um Chip de não lidas grudado, a data completa colada na
 * frente da última mensagem ("11/09/2026 14:02: oi") e dois ícones de editar e
 * excluir sempre visíveis em cada linha, competindo com o conteúdo. O item
 * ativo era marcado por uma borda azul-marinho cravada (#002d6e) que não
 * existia em nenhum outro lugar do sistema.
 *
 * Agora cada linha segue o desenho de qualquer app de mensagens: avatar,
 * título, hora curta à direita, prévia da última mensagem embaixo e o contador
 * de não lidas na cor da marca. Editar e excluir foram para um menu — são
 * ações raras e destrutivas, não merecem ficar expostas o tempo todo.
 */
const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: theme.spacing(0.5, 1, 1),
    ...theme.scrollbarStyles
  },
  item: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1.5),
    width: "100%",
    padding: theme.spacing(1.25, 1),
    borderRadius: theme.palette.tkv.radius.md,
    textAlign: "left",
    transition: "background-color .12s ease, transform .12s ease",
    animation: "$slideIn .28s ease both",
    "&:hover": {
      backgroundColor: theme.palette.tkv.surfaceHover,
      transform: "translateX(2px)"
    },
    "&:active": { transform: "scale(0.98)" },
    "&:hover $menuButton, &:focus-within $menuButton": { opacity: 1 }
  },
  "@keyframes slideIn": {
    from: { opacity: 0, transform: "translateY(6px)" },
    to: { opacity: 1, transform: "none" }
  },
  "@keyframes pulse": {
    "0%": { boxShadow: `0 0 0 0 ${theme.palette.tkv.brand.main}` },
    "100%": { boxShadow: "0 0 0 8px transparent" }
  },
  itemActive: {
    boxShadow: `inset 3px 0 0 ${theme.palette.tkv.brand.main}`,
    backgroundColor: theme.palette.tkv.brand.soft,
    "&:hover": { backgroundColor: theme.palette.tkv.brand.softHover }
  },
  avatar: {
    width: 44,
    height: 44,
    flex: "none",
    fontSize: "0.875rem",
    fontWeight: 700,
    backgroundColor: theme.palette.tkv.brand.soft,
    color: theme.palette.tkv.brand.main,
    transition: "border-radius .2s ease, transform .2s ease"
  },
  avatarActive: {
    borderRadius: 14,
    transform: "scale(1.04)",
    backgroundColor: theme.palette.tkv.brand.main,
    color: theme.palette.tkv.brand.contrastText
  },
  body: { flex: 1, minWidth: 0 },
  row: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    minWidth: 0
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: "0.9063rem",
    fontWeight: 600,
    color: theme.palette.text.primary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  time: {
    flex: "none",
    fontSize: "0.6875rem",
    color: theme.palette.text.secondary
  },
  timeUnread: {
    color: theme.palette.tkv.brand.main,
    fontWeight: 700
  },
  preview: {
    flex: 1,
    minWidth: 0,
    marginTop: 2,
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  previewUnread: {
    color: theme.palette.text.primary,
    fontWeight: 500
  },
  unread: {
    flex: "none",
    minWidth: 20,
    height: 20,
    padding: "0 6px",
    borderRadius: theme.palette.tkv.radius.pill,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.6875rem",
    fontWeight: 700,
    backgroundColor: theme.palette.tkv.brand.main,
    color: theme.palette.tkv.brand.contrastText,
    animation: "$pulse 1.6s ease-out infinite"
  },
  menuSpacer: { flex: "none", width: 30 },
  menuButton: {
    flex: "none",
    opacity: 0,
    transition: "opacity .12s ease",
    // no toque não existe hover: o menu fica sempre visível
    "@media (hover: none)": { opacity: 1 }
  }
}));

// "14:02" hoje, "Ontem" ontem, "09/09" antes disso.
const shortTime = value => {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return i18n.t("common.yesterday", "Ontem");
  return format(date, "dd/MM");
};

export default function ChatList({
  chats,
  handleSelectChat,
  handleDeleteChat,
  handleEditChat,
  onNewChat
}) {
  const classes = useStyles();
  const history = useHistory();
  const { user } = useContext(AuthContext);

  const [confirmationModal, setConfirmModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState({});
  const [menu, setMenu] = useState({ anchor: null, chat: null });

  const { id } = useParams();

  const unreadMessages = chat => {
    const currentUser = chat.users.find(u => u.userId === user.id);
    return currentUser?.unreads || 0;
  };

  const goToMessages = async chat => {
    if (unreadMessages(chat) > 0) {
      try {
        await api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }

    if (id !== chat.uuid) {
      history.push(`/chats/${chat.uuid}`);
      handleSelectChat(chat);
    }
  };

  const closeMenu = () => setMenu({ anchor: null, chat: null });

  if (!Array.isArray(chats) || chats.length === 0) {
    return (
      <div className={classes.root}>
        <EmptyState
          icon={<ForumOutlinedIcon />}
          title={i18n.t("internalChat.emptyListTitle")}
          description={i18n.t("internalChat.emptyListDescription")}
          action={onNewChat}
        />
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        title={i18n.t("internalChat.deleteTitle")}
        open={confirmationModal}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteChat(selectedChat)}
      >
        {i18n.t("internalChat.deleteMessage")}
      </ConfirmationModal>

      <Menu
        anchorEl={menu.anchor}
        open={Boolean(menu.anchor)}
        onClose={closeMenu}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            const chat = menu.chat;
            closeMenu();
            goToMessages(chat).then(() => handleEditChat?.(chat));
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("internalChat.edit")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedChat(menu.chat);
            closeMenu();
            setConfirmModalOpen(true);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" />
          </ListItemIcon>
          {i18n.t("internalChat.delete")}
        </MenuItem>
      </Menu>

      <div className={classes.root} role="list">
        {chats.map(chat => {
          const active = chat.uuid === id;
          const unreads = unreadMessages(chat);
          return (
            <div role="listitem" key={chat.id}>
              <ButtonBase
                component="div"
                className={`${classes.item}${active ? ` ${classes.itemActive}` : ""}`}
                onClick={() => goToMessages(chat)}
                aria-current={active ? "true" : undefined}
              >
                <Avatar
                  className={`${classes.avatar}${active ? ` ${classes.avatarActive}` : ""}`}
                >
                  {getInitials(chat.title)}
                </Avatar>

                <div className={classes.body}>
                  <div className={classes.row}>
                    <Typography component="span" className={classes.title}>
                      {chat.title}
                    </Typography>
                    <span
                      className={`${classes.time}${unreads > 0 ? ` ${classes.timeUnread}` : ""}`}
                    >
                      {shortTime(chat.updatedAt)}
                    </span>
                  </div>
                  <div className={classes.row}>
                    <Typography
                      component="span"
                      className={`${classes.preview}${unreads > 0 ? ` ${classes.previewUnread}` : ""}`}
                    >
                      {chat.lastMessage || " "}
                    </Typography>
                    {unreads > 0 && (
                      <span className={classes.unread}>{unreads}</span>
                    )}
                  </div>
                </div>

                {chat.ownerId !== user.id ? (
                  // mesmo sem menu, reserva o espaço: senão a hora de quem
                  // não é dono fica desalinhada da hora dos demais itens
                  <span className={classes.menuSpacer} aria-hidden="true" />
                ) : (
                  <IconButton
                    size="small"
                    className={classes.menuButton}
                    aria-label={i18n.t("common.actions")}
                    onClick={e => {
                      e.stopPropagation();
                      setMenu({ anchor: e.currentTarget, chat });
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                )}
              </ButtonBase>
            </div>
          );
        })}
      </div>
    </>
  );
}
