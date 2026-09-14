import { useContext, useEffect, useRef, useState } from "react";

import { useParams, useHistory } from "react-router-dom";

import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  ListItemIcon,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import ArrowBackIosRoundedIcon from "@material-ui/icons/ArrowBackIosRounded";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import ForumOutlinedIcon from "@material-ui/icons/ForumOutlined";

import ChatList from "./ChatList";
import ChatMessages from "./ChatMessages";
import { UsersFilter } from "../../components/UsersFilter";
import ConfirmationModal from "../../components/ConfirmationModal";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";
import { getInitials } from "../../helpers/getInitials";

import { has, isObject } from "lodash";

import { AuthContext } from "../../context/Auth/AuthContext";
import withWidth, { isWidthUp } from "@material-ui/core/withWidth";

import { i18n } from "../../translate/i18n";

/**
 * Chat interno.
 *
 * Antes: um Paper com o papel de parede do WhatsApp atrás de tudo, uma grade
 * de 3/9 colunas com bordas de 1px dentro de outra borda, o botão "Nova"
 * alinhado à direita acima da lista e, no celular, duas abas ("Chats" e
 * "Mensagens") — que obrigavam a pessoa a escolher a conversa numa aba e
 * depois trocar de aba para lê-la.
 *
 * Agora é um mensageiro de verdade:
 *  - desktop: lista à esquerda, conversa à direita, dentro de um cartão só;
 *  - celular: a lista é a tela; tocar numa conversa abre a conversa em tela
 *    cheia e a seta de voltar retorna à lista. A própria URL (/chats/:id) diz
 *    qual das duas mostrar, sem abas.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      padding: theme.spacing(3),
      backgroundColor: t.canvas,
      [theme.breakpoints.down("sm")]: { padding: theme.spacing(2) },
      [theme.breakpoints.down("xs")]: { padding: 0 }
    },
    shell: {
      flex: 1,
      minHeight: 0,
      minWidth: 0,
      display: "flex",
      maxWidth: t.layout.contentMaxWidth,
      margin: "0 auto",
      width: "100%",
      overflow: "hidden",
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: { borderRadius: 0, border: "none" }
    },

    // ── coluna da lista ──
    sidebar: {
      width: 340,
      flex: "none",
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      borderRight: `1px solid ${t.border}`,
      [theme.breakpoints.down("sm")]: {
        width: "100%",
        borderRight: "none"
      }
    },
    sidebarHeader: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.5),
      padding: theme.spacing(2, 2, 1.5, 2.5),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1.5, 1.5, 1, 2) }
    },
    sidebarTitleBox: { flex: 1, minWidth: 0 },
    sidebarTitle: {
      fontSize: "1.1875rem",
      fontWeight: 700,
      letterSpacing: "-0.015em",
      color: theme.palette.text.primary,
      lineHeight: 1.25
    },
    sidebarSubtitle: {
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      marginTop: 2,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },

    // ── coluna da conversa ──
    conversation: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      display: "flex",
      flexDirection: "column"
    },
    conversationHeader: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1.25),
      minHeight: 64,
      padding: theme.spacing(1, 1.5, 1, 2.5),
      borderBottom: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        minHeight: 58,
        padding: theme.spacing(0.75, 0.5, 0.75, 0.5)
      }
    },
    headerAvatar: {
      width: 40,
      height: 40,
      fontSize: "0.8125rem",
      fontWeight: 700,
      backgroundColor: t.brand.main,
      color: t.brand.contrastText
    },
    headerText: { flex: 1, minWidth: 0 },
    headerTitle: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    headerSubtitle: {
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    placeholder: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.canvas
    }
  };
});

export function ChatModal({
  open,
  chat,
  type,
  handleClose,
  handleLoadNewChat,
  user
}) {
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle("");
    setUsers([]);
    if (type === "edit" && chat?.users) {
      const userList = chat.users.map(u => ({
        id: u.user.id,
        name: u.user.name
      }));
      setUsers(userList);
      setTitle(chat.title);
    }
  }, [chat, open, type]);

  const handleSave = async () => {
    try {
      if (!title) {
        alert("Por favor, preencha o título da conversa.");
        return;
      }

      if (!users || users.length === 0) {
        alert("Por favor, selecione pelo menos um usuário.");
        return;
      }

      if (type === "edit") {
        await api.put(`/chats/${chat.id}`, {
          users,
          title
        });
      } else {
        const { data } = await api.post("/chats", {
          users,
          title
        });
        handleLoadNewChat(data);
      }
      handleClose();
    } catch (err) {}
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Conversa</DialogTitle>
      <DialogContent>
        <Grid spacing={2} container>
          <Grid xs={12} style={{ padding: 18 }} item>
            <TextField
              label="Título"
              placeholder="Título"
              value={title}
              onChange={e => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
            />
          </Grid>
          <Grid xs={12} item>
            <UsersFilter
              multiple
              onFiltered={users => setUsers(users)}
              initialUsers={users}
              excludeId={user.id}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Fechar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Chat(props) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const history = useHistory();

  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState("new");
  const [currentChat, setCurrentChat] = useState({});
  const [chats, setChats] = useState([]);
  const [chatsPageInfo, setChatsPageInfo] = useState({ hasMore: false });
  const [messages, setMessages] = useState([]);
  const [messagesPageInfo, setMessagesPageInfo] = useState({ hasMore: false });
  const [messagesPage, setMessagesPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [, setTab] = useState(0);
  const [headerMenu, setHeaderMenu] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMounted = useRef(true);
  const scrollToBottomRef = useRef();
  const { id } = useParams();

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMounted.current) {
      findChats().then(data => {
        const { records } = data;
        if (records.length > 0) {
          setChats(records);
          setChatsPageInfo(data);

          if (id && records.length) {
            const chat = records.find(r => r.uuid === id);
            selectChat(chat);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isObject(currentChat) && has(currentChat, "id")) {
      findMessages(currentChat.id).then(() => {
        if (typeof scrollToBottomRef.current === "function") {
          setTimeout(() => {
            scrollToBottomRef.current();
          }, 300);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onChatUser = data => {
      if (data.action === "create") {
        setChats(prev => [data.record, ...prev]);
      }
      if (data.action === "update") {
        const changedChats = chats.map(chat => {
          if (chat.id === data.record.id) {
            setCurrentChat(data.record);
            return {
              ...data.record
            };
          }
          return chat;
        });
        setChats(changedChats);
      }
    };

    const onChat = data => {
      if (data.action === "delete") {
        const filteredChats = chats.filter(c => c.id !== +data.id);
        setChats(filteredChats);
        setMessages([]);
        setMessagesPage(1);
        setMessagesPageInfo({ hasMore: false });
        setCurrentChat({});
        history.push("/chats");
      }
    };

    const onCurrentChat = data => {
      if (data.action === "new-message") {
        setMessages(prev => [...prev, data.newMessage]);
        const changedChats = chats.map(chat => {
          if (chat.id === data.newMessage.chatId) {
            return {
              ...data.chat
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }

      if (data.action === "update") {
        const changedChats = chats.map(chat => {
          if (chat.id === data.chat.id) {
            return {
              ...data.chat
            };
          }
          return chat;
        });
        setChats(changedChats);
        scrollToBottomRef.current();
      }
    };

    socket.on(`company-${companyId}-chat-user-${user.id}`, onChatUser);
    socket.on(`company-${companyId}-chat`, onChat);
    if (isObject(currentChat) && has(currentChat, "id")) {
      socket.on(`company-${companyId}-chat-${currentChat.id}`, onCurrentChat);
    }

    return () => {
      socket.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat, socketManager]);

  const selectChat = chat => {
    try {
      setMessages([]);
      setMessagesPage(1);
      setCurrentChat(chat);
      setTab(1);
    } catch (err) {}
  };

  const sendMessage = async contentMessage => {
    setLoading(true);
    try {
      await api.post(`/chats/${currentChat.id}/messages`, {
        message: contentMessage
      });
    } catch (err) {}
    setLoading(false);
  };

  const deleteChat = async chat => {
    try {
      await api.delete(`/chats/${chat.id}`);
    } catch (err) {}
  };

  const findMessages = async chatId => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/chats/${chatId}/messages?pageNumber=${messagesPage}`
      );
      setMessagesPage(prev => prev + 1);
      setMessagesPageInfo(data);
      setMessages(prev => [...data.records, ...prev]);
    } catch (err) {}
    setLoading(false);
  };

  const loadMoreMessages = async () => {
    if (!loading) {
      findMessages(currentChat.id);
    }
  };

  const findChats = async () => {
    try {
      const { data } = await api.get("/chats");
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  const hasChat = isObject(currentChat) && has(currentChat, "id");
  const isWide = isWidthUp("md", props.width);
  // No celular a URL decide: /chats mostra a lista, /chats/:id a conversa.
  const showList = isWide || !id;
  const showConversation = isWide || !!id;

  const openNewChat = () => {
    setDialogType("new");
    setShowDialog(true);
  };

  const participantsLabel = chat => {
    const names = (chat.users || [])
      .map(u =>
        u.userId === user.id ? i18n.t("internalChat.you") : u.user?.name
      )
      .filter(Boolean);
    return names.length
      ? names.join(", ")
      : `${(chat.users || []).length} ${i18n.t("internalChat.participants")}`;
  };

  const newChatButton = (
    <Button
      variant="contained"
      color="primary"
      size="small"
      startIcon={<AddRoundedIcon />}
      onClick={openNewChat}
    >
      {i18n.t("internalChat.newChat")}
    </Button>
  );

  const renderSidebar = () => (
    <aside className={classes.sidebar}>
      <div className={classes.sidebarHeader}>
        <div className={classes.sidebarTitleBox}>
          <Typography component="h1" className={classes.sidebarTitle}>
            {i18n.t("internalChat.title")}
          </Typography>
          <Typography className={classes.sidebarSubtitle}>
            {i18n.t("internalChat.subtitle")}
          </Typography>
        </div>
        {isWide ? (
          newChatButton
        ) : (
          <Tooltip title={i18n.t("internalChat.newChat")}>
            <IconButton
              color="primary"
              onClick={openNewChat}
              aria-label={i18n.t("internalChat.newChat")}
            >
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
      <ChatList
        chats={chats}
        pageInfo={chatsPageInfo}
        loading={loading}
        handleSelectChat={chat => selectChat(chat)}
        handleDeleteChat={chat => deleteChat(chat)}
        handleEditChat={() => {
          setDialogType("edit");
          setShowDialog(true);
        }}
        onNewChat={newChatButton}
      />
    </aside>
  );

  const renderConversation = () => {
    if (!hasChat) {
      return (
        <section className={classes.conversation}>
          <div className={classes.placeholder}>
            <EmptyState
              icon={<ForumOutlinedIcon />}
              title={i18n.t("internalChat.selectTitle")}
              description={i18n.t("internalChat.selectDescription")}
              action={chats.length ? null : newChatButton}
            />
          </div>
        </section>
      );
    }

    const isOwner = currentChat.ownerId === user.id;

    return (
      <section className={classes.conversation}>
        <header className={classes.conversationHeader}>
          {!isWide && (
            <IconButton
              size="small"
              onClick={() => history.push("/chats")}
              aria-label={i18n.t("common.back")}
            >
              <ArrowBackIosRoundedIcon fontSize="small" />
            </IconButton>
          )}
          <Avatar className={classes.headerAvatar}>
            {getInitials(currentChat.title)}
          </Avatar>
          <div className={classes.headerText}>
            <Typography component="h2" className={classes.headerTitle}>
              {currentChat.title}
            </Typography>
            <Typography className={classes.headerSubtitle}>
              {participantsLabel(currentChat)}
            </Typography>
          </div>
          {isOwner && (
            <>
              <IconButton
                onClick={e => setHeaderMenu(e.currentTarget)}
                aria-label={i18n.t("common.actions")}
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={headerMenu}
                open={Boolean(headerMenu)}
                onClose={() => setHeaderMenu(null)}
                getContentAnchorEl={null}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem
                  onClick={() => {
                    setHeaderMenu(null);
                    setDialogType("edit");
                    setShowDialog(true);
                  }}
                >
                  <ListItemIcon>
                    <EditOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  {i18n.t("internalChat.edit")}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setHeaderMenu(null);
                    setConfirmDelete(true);
                  }}
                >
                  <ListItemIcon>
                    <DeleteOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  {i18n.t("internalChat.delete")}
                </MenuItem>
              </Menu>
            </>
          )}
        </header>
        <ChatMessages
          chat={currentChat}
          scrollToBottomRef={scrollToBottomRef}
          pageInfo={messagesPageInfo}
          messages={messages}
          loading={loading}
          handleSendMessage={sendMessage}
          handleLoadMore={loadMoreMessages}
        />
      </section>
    );
  };

  return (
    <>
      <ChatModal
        type={dialogType}
        open={showDialog}
        chat={currentChat}
        handleLoadNewChat={data => {
          setMessages([]);
          setMessagesPage(1);
          setCurrentChat(data);
          setTab(1);
          history.push(`/chats/${data.uuid}`);
        }}
        handleClose={() => setShowDialog(false)}
        user={user}
      />
      <ConfirmationModal
        title={i18n.t("internalChat.deleteTitle")}
        open={confirmDelete}
        onClose={setConfirmDelete}
        onConfirm={() => deleteChat(currentChat)}
      >
        {i18n.t("internalChat.deleteMessage")}
      </ConfirmationModal>
      <div className={classes.page}>
        <div className={classes.shell}>
          {showList && renderSidebar()}
          {showConversation && renderConversation()}
        </div>
      </div>
    </>
  );
}

export default withWidth()(Chat);
