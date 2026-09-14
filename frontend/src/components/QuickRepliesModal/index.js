import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import EditOutlinedIcon from "@material-ui/icons/EditOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import FlashOnRoundedIcon from "@material-ui/icons/FlashOnRounded";

import QuickMessageDialog from "../QuickMessageDialog";
import ConfirmationModal from "../ConfirmationModal";
import BoxLoader from "../ui/BoxLoader";
import useQuickMessages from "../../hooks/useQuickMessages";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";

/**
 * Respostas rápidas, direto da conversa.
 *
 * Substitui a aba que existia só para isso: aqui a pessoa procura, usa com
 * um toque e, se precisar, cria, edita ou exclui sem sair do atendimento.
 * Usa as mesmas rotas e o mesmo formulário da antiga tela.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    content: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5),
      minHeight: 280
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1)
    },
    item: {
      display: "flex",
      alignItems: "stretch",
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      overflow: "hidden",
      transition: "border-color .15s ease, background-color .15s ease",
      "&:hover": {
        borderColor: t.brand.textBorder,
        backgroundColor: t.brand.textSoft
      }
    },
    use: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      padding: theme.spacing(1.25, 1.5),
      textAlign: "left"
    },
    shortcode: {
      display: "inline-flex",
      alignItems: "center",
      gap: 2,
      padding: "1px 8px 1px 4px",
      borderRadius: t.radius.pill,
      fontSize: "0.75rem",
      fontWeight: 700,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text,
      "& svg": { fontSize: 14 }
    },
    message: {
      width: "100%",
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      whiteSpace: "pre-wrap",
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    },
    actions: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      padding: theme.spacing(0.5),
      borderLeft: `1px solid ${t.border}`
    },
    empty: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing(1),
      padding: theme.spacing(4, 2),
      textAlign: "center",
      color: theme.palette.text.secondary
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    }
  };
});

const QuickRepliesModal = ({ open, onClose, onPick, onChanged }) => {
  const classes = useStyles();
  const { list, save, update, deleteRecord } = useQuickMessages();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [removing, setRemoving] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await list());
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      setQuery("");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      item =>
        String(item.shortcode || "")
          .toLowerCase()
          .includes(q) ||
        String(item.message || "")
          .toLowerCase()
          .includes(q)
    );
  }, [items, query]);

  const afterChange = async text => {
    toast.success(text);
    await load();
    onChanged?.();
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>{i18n.t("quickReplies.title")}</DialogTitle>
        <DialogContent dividers className={classes.content}>
          <TextField
            variant="outlined"
            size="small"
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={i18n.t("quickReplies.search")}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />

          {loading ? (
            <div className={classes.empty}>
              <BoxLoader />
            </div>
          ) : filtered.length === 0 ? (
            <div className={classes.empty}>
              <span className={classes.emptyIcon}>
                <FlashOnRoundedIcon />
              </span>
              <Typography>
                {query
                  ? i18n.t("quickReplies.emptySearch")
                  : i18n.t("quickReplies.empty")}
              </Typography>
            </div>
          ) : (
            <div className={classes.list}>
              {filtered.map(item => (
                <div key={item.id} className={classes.item}>
                  <ButtonBase
                    className={classes.use}
                    onClick={() => {
                      onPick(item.message);
                      onClose();
                    }}
                    title={i18n.t("quickReplies.use")}
                  >
                    <span className={classes.shortcode}>
                      <FlashOnRoundedIcon />/{item.shortcode}
                    </span>
                    <span className={classes.message}>{item.message}</span>
                  </ButtonBase>
                  <div className={classes.actions}>
                    <Tooltip title={i18n.t("quickReplies.edit")}>
                      <IconButton
                        size="small"
                        aria-label={i18n.t("quickReplies.edit")}
                        onClick={() => {
                          setEditing(item);
                          setFormOpen(true);
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={i18n.t("quickReplies.delete")}>
                      <IconButton
                        size="small"
                        aria-label={i18n.t("quickReplies.delete")}
                        onClick={() => setRemoving(item)}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="outlined" color="secondary">
            {i18n.t("quickReplies.close")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            {i18n.t("quickReplies.add")}
          </Button>
        </DialogActions>
      </Dialog>

      <QuickMessageDialog
        messageSelected={editing || {}}
        modalOpen={formOpen}
        onClose={closeForm}
        saveMessage={async values => {
          closeForm();
          try {
            await save(values);
            await afterChange(i18n.t("quickReplies.added"));
          } catch (err) {
            toastError(err);
          }
        }}
        editMessage={async values => {
          closeForm();
          try {
            await update(values);
            await afterChange(i18n.t("quickReplies.updated"));
          } catch (err) {
            toastError(err);
          }
        }}
      />

      <ConfirmationModal
        title={i18n.t("quickReplies.deleteTitle")}
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={async () => {
          try {
            await deleteRecord(removing.id);
            await afterChange(i18n.t("quickReplies.deleted"));
          } catch (err) {
            toastError(err);
          }
          setRemoving(null);
        }}
      >
        {i18n.t("quickReplies.deleteMessage")}
      </ConfirmationModal>
    </>
  );
};

export default QuickRepliesModal;
