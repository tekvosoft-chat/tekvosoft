import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import { toast } from "react-toastify";

import api from "../../services/api";
import { getBackendURL } from "../../services/config";
import toastError from "../../errors/toastError";

/**
 * Criação da caixa de entrada do site (a bolinha de conversa).
 *
 * Diferente do WhatsApp, aqui não há QR code: a caixa nasce no ar e o que a
 * pessoa leva embora é um script para colar no site dela. Por isso a tela
 * tem dois momentos — o formulário e, depois de criar, o script pronto.
 */
const CORES = [
  "#5C59E8",
  "#0B8043",
  "#039BE5",
  "#8E24AA",
  "#F4511E",
  "#111111"
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: { width: 560, maxWidth: "calc(100vw - 24px)", borderRadius: 18 },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 1.5, 3),
      borderBottom: `1px solid ${t.border}`
    },
    title: {
      flex: 1,
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    body: {
      padding: theme.spacing(2.5, 3),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2)
    },
    hint: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    cores: { display: "flex", gap: 10, alignItems: "center" },
    cor: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      border: "2px solid transparent",
      cursor: "pointer"
    },
    corOn: { borderColor: theme.palette.text.primary },
    script: {
      padding: "12px 14px",
      borderRadius: 12,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      fontFamily: "monospace",
      fontSize: "0.75rem",
      lineHeight: 1.6,
      wordBreak: "break-all",
      color: theme.palette.text.primary
    },
    foot: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: theme.spacing(0, 3, 2.5)
    },
    botao: {
      height: 38,
      borderRadius: t.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      padding: "0 18px"
    }
  };
});

const WebchatForm = ({ open, onClose, onCreated }) => {
  const classes = useStyles();
  const [nome, setNome] = useState("");
  const [dominio, setDominio] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [titulo, setTitulo] = useState("Olá! 👋");
  const [mensagem, setMensagem] = useState(
    "Estamos por aqui. Escreva sua dúvida que a gente responde."
  );
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState(null);

  const fechar = () => {
    setCriada(null);
    setNome("");
    setDominio("");
    onClose();
  };

  const criar = async () => {
    setSalvando(true);
    try {
      const { data } = await api.post("/whatsapp", {
        name: nome.trim(),
        channel: "webchat",
        status: "CONNECTED",
        config: {
          domain: dominio.trim(),
          color: cor,
          welcomeTitle: titulo.trim(),
          welcomeMessage: mensagem.trim()
        }
      });
      setCriada(data);
      onCreated?.(data);
    } catch (err) {
      toastError(err);
    }
    setSalvando(false);
  };

  const script = criada
    ? `<script src="${window.location.origin}/webchat.js" data-token="${criada.token}" data-api="${getBackendURL()}" defer></script>`
    : "";

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copiado");
    } catch (err) {
      toast.error("Não consegui copiar");
    }
  };

  return (
    <Dialog open={open} onClose={fechar} classes={{ paper: classes.paper }}>
      <div className={classes.head}>
        <span className={classes.title}>
          {criada ? "Cole isto no seu site" : "Caixa de entrada do site"}
        </span>
        <IconButton size="small" onClick={fechar} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>

      {criada ? (
        <div className={classes.body}>
          <span className={classes.hint}>
            Cole esta linha antes do <code>&lt;/body&gt;</code> das páginas em
            que a bolinha deve aparecer. As conversas chegam na sua lista como
            qualquer outra.
          </span>
          <div className={classes.script}>{script}</div>
          <Button
            className={classes.botao}
            variant="outlined"
            startIcon={<FileCopyOutlinedIcon />}
            onClick={copiar}
          >
            Copiar script
          </Button>
        </div>
      ) : (
        <div className={classes.body}>
          <span className={classes.hint}>
            A bolinha de conversa do seu site. Quem visitar escreve por ali e a
            mensagem cai aqui, na mesma lista do WhatsApp.
          </span>
          <TextField
            autoFocus
            label="Nome da caixa de entrada"
            placeholder="Ex.: Site da loja"
            variant="outlined"
            size="small"
            value={nome}
            onChange={e => setNome(e.target.value)}
          />
          <TextField
            label="Endereço do site"
            placeholder="minhaloja.com.br"
            variant="outlined"
            size="small"
            value={dominio}
            onChange={e => setDominio(e.target.value)}
          />
          <div>
            <div className={classes.hint} style={{ marginBottom: 8 }}>
              Cor da bolinha
            </div>
            <div className={classes.cores}>
              {CORES.map(item => (
                <button
                  key={item}
                  type="button"
                  aria-label={item}
                  className={`${classes.cor}${
                    cor === item ? ` ${classes.corOn}` : ""
                  }`}
                  style={{ backgroundColor: item }}
                  onClick={() => setCor(item)}
                />
              ))}
            </div>
          </div>
          <TextField
            label="Título da janela"
            variant="outlined"
            size="small"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
          <TextField
            label="Mensagem de boas-vindas"
            variant="outlined"
            size="small"
            multiline
            minRows={2}
            value={mensagem}
            onChange={e => setMensagem(e.target.value)}
          />
        </div>
      )}

      <div className={classes.foot}>
        {criada ? (
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.botao}
            onClick={fechar}
          >
            Pronto
          </Button>
        ) : (
          <>
            <Button
              variant="outlined"
              className={classes.botao}
              onClick={fechar}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              disableElevation
              className={classes.botao}
              disabled={salvando || nome.trim().length < 2}
              onClick={criar}
            >
              Criar caixa de entrada
            </Button>
          </>
        )}
      </div>
    </Dialog>
  );
};

export default WebchatForm;
