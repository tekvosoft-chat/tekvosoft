import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Popper from "@material-ui/core/Popper";
import Grow from "@material-ui/core/Grow";
import Paper from "@material-ui/core/Paper";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import Autocomplete, {
  createFilterOptions
} from "@material-ui/lab/Autocomplete";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import useQueues from "../../hooks/useQueues";

/**
 * Transferir, no computador: um painel que desce do próprio botão, sem
 * modal — a conversa continua à vista. Atendente é opcional; sem ele, o
 * atendimento volta para "Aguardando" da fila escolhida.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    popper: { zIndex: theme.zIndex.modal - 10 },
    paper: {
      width: 380,
      maxWidth: "calc(100vw - 24px)",
      marginTop: 8,
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceRaised || t.surface,
      boxShadow: "0 18px 48px -20px rgba(0, 0, 0, 0.45)"
    },
    // o miolo cobre o painel todo: clique na borda de dentro não é "fora"
    body: {
      padding: theme.spacing(2),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    },
    head: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: -4
    },
    title: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    hint: {
      margin: 0,
      fontSize: "0.75rem",
      lineHeight: 1.45,
      color: theme.palette.text.secondary
    },
    actions: { display: "flex", justifyContent: "flex-end", gap: 8 },
    button: {
      height: 36,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      padding: "0 16px"
    }
  };
});

const filterOptions = createFilterOptions({ trim: true });

const TransferTicketPanel = ({
  anchorEl,
  open,
  onClose,
  ticketid,
  hideUserSelection = false
}) => {
  const classes = useStyles();
  const history = useHistory();
  const { findAll: findAllQueues } = useQueues();
  const [allQueues, setAllQueues] = useState([]);
  const [queues, setQueues] = useState([]);
  const [options, setOptions] = useState([]);
  const [searchParam, setSearchParam] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);

  useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    findAllQueues()
      .then(list => {
        if (!mounted.current) return;
        setAllQueues(list);
        setQueues(list);
      })
      .catch(toastError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // fechou: começa limpo na próxima vez
  useEffect(() => {
    if (open) return;
    setSearchParam("");
    setSelectedUser(null);
    setSelectedQueue("");
    setOptions([]);
  }, [open]);

  useEffect(() => {
    if (hideUserSelection || !open || searchParam.length < 2) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/users/", { params: { searchParam } });
        if (mounted.current) setOptions(data.users);
      } catch (err) {
        toastError(err);
      }
      if (mounted.current) setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchParam, open, hideUserSelection]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleTransfer = async () => {
    if (!ticketid || !selectedQueue) return;
    setSaving(true);
    try {
      const data = { queueId: selectedQueue };
      if (selectedUser) {
        data.userId = selectedUser.id;
      } else {
        data.status = "pending";
        data.userId = null;
      }
      await api.put(`/tickets/${ticketid}`, data);
      onClose();
      history.push("/tickets");
    } catch (err) {
      toastError(err);
    }
    if (mounted.current) setSaving(false);
  };

  // clique no menu da fila ou na lista de atendentes (que abrem fora do
  // painel) não conta como "clicar fora"; nem o próprio botão Transferir,
  // que já abre e fecha o painel
  const handleClickAway = event => {
    if (event.target?.closest?.(".MuiPopover-root, .MuiAutocomplete-popper"))
      return;
    if (anchorEl && anchorEl.contains(event.target)) return;
    onClose();
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
      transition
      className={classes.popper}
    >
      {({ TransitionProps }) => (
        <Grow {...TransitionProps} style={{ transformOrigin: "top right" }}>
          <Paper className={classes.paper} elevation={0}>
            {/* no apertar do botão, não no clique: a lista da fila abre por
                cima da tela no meio do clique, o clique terminava "fora"
                e o painel inteiro fechava */}
            <ClickAwayListener
              mouseEvent="onMouseDown"
              touchEvent="onTouchStart"
              onClickAway={handleClickAway}
            >
              <div className={classes.body}>
                <div className={classes.head}>
                  <span className={classes.title}>
                    {i18n.t("transferTicketModal.title")}
                  </span>
                  <IconButton size="small" onClick={onClose}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </div>

                {!hideUserSelection && (
                  <Autocomplete
                    getOptionLabel={option => option?.name || ""}
                    onChange={(e, value) => {
                      setSelectedUser(value && value.id ? value : null);
                      if (value && Array.isArray(value.queues)) {
                        setQueues(value.queues);
                        if (
                          selectedQueue &&
                          !value.queues.some(q => q.id === selectedQueue)
                        ) {
                          setSelectedQueue("");
                        }
                      } else {
                        setQueues(allQueues);
                      }
                    }}
                    options={options}
                    filterOptions={filterOptions}
                    autoHighlight
                    noOptionsText={i18n.t("transferTicketModal.noOptions")}
                    loading={loading}
                    renderInput={params => (
                      <TextField
                        {...params}
                        autoFocus
                        label={i18n.t("transferTicketModal.userLabel")}
                        onChange={e => setSearchParam(e.target.value)}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loading ? (
                                <CircularProgress color="inherit" size={16} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}

                <TextField
                  select
                  fullWidth
                  label={i18n.t("transferTicketModal.fieldQueueLabel")}
                  value={selectedQueue}
                  onChange={e => setSelectedQueue(e.target.value)}
                >
                  {queues.map(queue => (
                    <MenuItem key={queue.id} value={queue.id}>
                      {queue.name}
                    </MenuItem>
                  ))}
                </TextField>

                <p className={classes.hint}>
                  {selectedUser
                    ? i18n.t("transferTicketModal.hintUser", {
                        name: selectedUser.name
                      })
                    : i18n.t("transferTicketModal.hintQueue")}
                </p>

                <div className={classes.actions}>
                  <Button
                    variant="outlined"
                    className={classes.button}
                    onClick={onClose}
                    disabled={saving}
                  >
                    {i18n.t("transferTicketModal.buttons.cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    className={classes.button}
                    disabled={!selectedQueue || saving}
                    onClick={handleTransfer}
                  >
                    {saving ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      i18n.t("transferTicketModal.buttons.ok")
                    )}
                  </Button>
                </div>
              </div>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};

export default TransferTicketPanel;
