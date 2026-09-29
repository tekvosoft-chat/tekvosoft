import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import { ContactSelect } from "../ContactSelect";
import ContactModal from "../ContactModal";

const t = (key, fallback) => i18n.t(`newConversation.${key}`, fallback);

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    paper: { borderRadius: tkv.radius.xl },
    title: { paddingBottom: 4, "& h2": { fontWeight: 700 } },
    subtitle: {
      margin: 0,
      fontSize: "0.8125rem",
      fontWeight: 400,
      color: theme.palette.text.secondary
    },
    label: {
      display: "block",
      margin: theme.spacing(2, 0, 1),
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    inboxes: { display: "grid", gap: 8 },
    inbox: {
      justifyContent: "flex-start",
      gap: 12,
      width: "100%",
      padding: "10px 12px",
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      textAlign: "left",
      transition: "border-color .15s ease, background-color .15s ease",
      "&:hover": { backgroundColor: tkv.surfaceHover },
      "&.Mui-disabled": { opacity: 0.5 }
    },
    inboxOn: {
      borderColor: tkv.brand.main,
      backgroundColor: tkv.brand.textSoft,
      "&:hover": { backgroundColor: tkv.brand.textSoft }
    },
    inboxIcon: {
      flex: "none",
      display: "grid",
      placeItems: "center",
      width: 34,
      height: 34,
      borderRadius: "50%",
      color: "#fff",
      backgroundColor: "#25D366",
      "& svg": { fontSize: 19 }
    },
    inboxText: { flex: 1, minWidth: 0 },
    inboxName: {
      display: "block",
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    inboxStatus: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    check: { color: tkv.brand.main },
    empty: {
      padding: 12,
      borderRadius: tkv.radius.md,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surfaceSunken
    },
    picked: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 8px 8px 14px",
      borderRadius: tkv.radius.md,
      border: `1px solid ${tkv.border}`,
      fontWeight: 600
    },
    pickedName: { flex: 1, minWidth: 0 }
  };
});

/**
 * Nova conversa (o lápis ao lado da busca, no menu lateral): de qual caixa
 * de entrada ela sai e para quem. Só o WhatsApp conectado começa conversa —
 * site, Instagram e Facebook só respondem quem escreveu primeiro.
 */
const NewConversationModal = ({ open, onClose }) => {
  const classes = useStyles();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("xs"));
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { whatsApps } = useContext(WhatsAppsContext);

  const inboxes = (whatsApps || []).filter(
    item => (item.channel || "whatsapp") === "whatsapp"
  );
  const queues = user?.queues || [];
  const isAdmin = user?.profile === "admin";

  const [inboxId, setInboxId] = useState(null);
  const [contactId, setContactId] = useState(null);
  // contato criado agora: não aparece no campo de busca, vai numa linha
  const [created, setCreated] = useState(null);
  const [newContactName, setNewContactName] = useState(null);
  const [queueId, setQueueId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const connected = inboxes.filter(item => item.status === "CONNECTED");
    setInboxId(
      (connected.find(item => item.isDefault) || connected[0])?.id || null
    );
    setContactId(null);
    setCreated(null);
    setQueueId(queues.length === 1 ? queues[0].id : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // atendente precisa escolher a fila (como no "novo atendimento" antigo)
  const needsQueue = !isAdmin && queues.length > 0 && !queueId;
  const ready = !!inboxId && !!contactId && !needsQueue && !loading;

  const start = async () => {
    setLoading(true);
    try {
      const { data: ticket } = await api.post("/tickets", {
        contactId,
        whatsappId: inboxId,
        queueId: queueId || null,
        userId: user.id,
        status: "open"
      });
      onClose();
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  return (
    <>
      <ContactModal
        open={!!newContactName}
        initialValues={{ name: newContactName || "" }}
        onClose={() => setNewContactName(null)}
        onSave={contact => {
          setCreated(contact);
          setContactId(contact.id);
        }}
      />
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xs"
        fullScreen={phone}
        classes={{ paper: phone ? undefined : classes.paper }}
      >
        <DialogTitle className={classes.title}>
          {t("title", "Nova conversa")}
          <p className={classes.subtitle}>
            {t("subtitle", "Escolha por onde a mensagem sai e para quem.")}
          </p>
        </DialogTitle>
        <DialogContent>
          <span className={classes.label}>
            {t("inbox", "Caixa de entrada")}
          </span>
          {inboxes.length ? (
            <div className={classes.inboxes}>
              {inboxes.map(inbox => {
                const connected = inbox.status === "CONNECTED";
                const on = inbox.id === inboxId;
                return (
                  <ButtonBase
                    key={inbox.id}
                    className={clsx(classes.inbox, { [classes.inboxOn]: on })}
                    disabled={!connected}
                    onClick={() => setInboxId(inbox.id)}
                    aria-pressed={on}
                  >
                    <span className={classes.inboxIcon}>
                      <WhatsAppIcon />
                    </span>
                    <span className={classes.inboxText}>
                      <span className={classes.inboxName}>{inbox.name}</span>
                      <span className={classes.inboxStatus}>
                        {connected
                          ? t("connected", "Conectado")
                          : t("disconnected", "Desconectado")}
                      </span>
                    </span>
                    {on && <CheckCircleRoundedIcon className={classes.check} />}
                  </ButtonBase>
                );
              })}
            </div>
          ) : (
            <div className={classes.empty}>
              {t("noInbox", "Nenhum WhatsApp conectado para começar conversa.")}
            </div>
          )}

          <span className={classes.label}>{t("to", "Para")}</span>
          {created ? (
            <div className={classes.picked}>
              <span className={classes.pickedName}>{created.name}</span>
              <IconButton
                size="small"
                aria-label={t("changeContact", "Trocar contato")}
                onClick={() => {
                  setCreated(null);
                  setContactId(null);
                }}
              >
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </div>
          ) : (
            <ContactSelect
              label={t("searchContact", "Nome ou número")}
              onSelected={setContactId}
              allowCreate
              onCreateContact={setNewContactName}
              margin="none"
            />
          )}

          {queues.length > 0 && (
            <>
              <span className={classes.label}>{t("queue", "Fila")}</span>
              <TextField
                select
                fullWidth
                size="small"
                variant="outlined"
                value={queueId}
                onChange={e => setQueueId(e.target.value)}
                SelectProps={{ displayEmpty: true }}
              >
                {isAdmin && (
                  <MenuItem value="">{t("noQueue", "Sem fila")}</MenuItem>
                )}
                {queues.map(queue => (
                  <MenuItem key={queue.id} value={queue.id}>
                    {queue.name}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("cancel", "Cancelar")}</Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!ready}
            onClick={start}
          >
            {t("start", "Iniciar conversa")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewConversationModal;
