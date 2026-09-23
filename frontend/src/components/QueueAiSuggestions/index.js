import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import TextField from "@material-ui/core/TextField";
import Checkbox from "@material-ui/core/Checkbox";
import CircularProgress from "@material-ui/core/CircularProgress";
import OfflineBoltRoundedIcon from "@material-ui/icons/OfflineBoltRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";

/**
 * Filas de exemplo feitas pela IA: a pessoa conta o que a empresa faz e
 * recebe de 4 a 6 filas prontas (nome, cor, saudação e instruções para o
 * assistente da fila). Marca as que quiser e cria de uma vez.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: { width: 560, maxWidth: "calc(100vw - 24px)" },
    body: {
      padding: theme.spacing(2.5, 3),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2)
    },
    title: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      "& svg": { color: t.brand.text }
    },
    hint: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    item: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      width: "100%",
      padding: "10px 12px",
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      textAlign: "left"
    },
    dot: {
      flex: "none",
      width: 12,
      height: 12,
      borderRadius: "50%",
      marginTop: 12
    },
    name: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    about: { fontSize: "0.8125rem", color: theme.palette.text.secondary },
    foot: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: theme.spacing(0, 3, 2.5)
    },
    button: {
      height: 38,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      padding: "0 18px"
    }
  };
});

const QueueAiSuggestions = ({ open, onClose, onCreated }) => {
  const classes = useStyles();
  const [about, setAbout] = useState("");
  const [list, setList] = useState(null);
  const [chosen, setChosen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const close = () => {
    setList(null);
    setChosen([]);
    onClose();
  };

  const suggest = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/ai/queues/suggest", { about });
      setList(data || []);
      setChosen((data || []).map((_, index) => index));
    } catch (err) {
      toastError(err);
    }
    setLoading(false);
  };

  const create = async () => {
    setSaving(true);
    let done = 0;
    for (const index of chosen) {
      const queue = list[index];
      try {
        // eslint-disable-next-line no-await-in-loop
        await api.post("/queue", {
          name: queue.name,
          color: queue.color,
          greetingMessage: queue.greetingMessage,
          aiEnabled: false,
          aiConfig: JSON.stringify({
            about: queue.about,
            instructions: queue.instructions,
            tone: "friendly"
          })
        });
        done += 1;
      } catch (err) {
        toastError(err);
      }
    }
    setSaving(false);
    if (done) {
      toast.success(done === 1 ? "1 fila criada" : `${done} filas criadas`);
      onCreated();
      close();
    }
  };

  return (
    <Dialog open={open} onClose={close} classes={{ paper: classes.paper }}>
      <div className={classes.body}>
        <span className={classes.title}>
          <OfflineBoltRoundedIcon fontSize="small" />
          Sugerir filas com IA
        </span>

        {!list && (
          <>
            <span className={classes.hint}>
              Conte em uma linha o que a sua empresa faz. A IA monta as filas
              com nome, cor, saudação e instruções — você escolhe quais criar.
            </span>
            <TextField
              autoFocus
              multiline
              minRows={2}
              label="O que a empresa faz"
              placeholder="Ex.: loja de material de construção, vende e entrega na região"
              value={about}
              onChange={e => setAbout(e.target.value)}
            />
          </>
        )}

        {loading && (
          <CircularProgress size={24} style={{ alignSelf: "center" }} />
        )}

        {list && !loading && (
          <>
            <span className={classes.hint}>
              Marque as filas que quiser criar. O assistente de cada fila fica
              desligado até você ligar.
            </span>
            {list.map((queue, index) => (
              <ButtonBase
                key={queue.name}
                className={classes.item}
                onClick={() =>
                  setChosen(prev =>
                    prev.includes(index)
                      ? prev.filter(i => i !== index)
                      : [...prev, index]
                  )
                }
              >
                <Checkbox
                  size="small"
                  color="primary"
                  checked={chosen.includes(index)}
                  tabIndex={-1}
                />
                <span
                  className={classes.dot}
                  style={{ backgroundColor: queue.color }}
                />
                <span>
                  <div className={classes.name}>{queue.name}</div>
                  <div className={classes.about}>{queue.about}</div>
                </span>
              </ButtonBase>
            ))}
          </>
        )}
      </div>

      <div className={classes.foot}>
        <Button variant="outlined" className={classes.button} onClick={close}>
          Cancelar
        </Button>
        {list ? (
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.button}
            disabled={!chosen.length || saving}
            onClick={create}
          >
            Criar {chosen.length || ""}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.button}
            disabled={loading || about.trim().length < 5}
            onClick={suggest}
          >
            Sugerir
          </Button>
        )}
      </div>
    </Dialog>
  );
};

export default QueueAiSuggestions;
