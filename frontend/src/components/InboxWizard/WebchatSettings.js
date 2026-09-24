import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import TextField from "@material-ui/core/TextField";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import { toast } from "react-toastify";

import api from "../../services/api";
import { getBackendURL } from "../../services/config";
import toastError from "../../errors/toastError";

/**
 * Ajustes da caixa de entrada do site.
 *
 * Tudo o que muda a bolinha do cliente mora aqui: cor, lado da tela, textos,
 * o que aparece na janela e o que acontece quando alguém começa a conversa.
 * A aba "Script" fica sempre à mão — dá para copiar quantas vezes quiser,
 * sem precisar criar a caixa de novo.
 */
export const CONFIG_PADRAO = {
  color: "#5C59E8",
  welcomeTitle: "Olá! 👋",
  welcomeMessage: "Estamos por aqui. Escreva sua dúvida que a gente responde.",
  domain: "",
  bubblePosition: "right",
  bubbleType: "standard",
  launcherTitle: "Fale conosco no chat",
  replyTime: "minutes",
  showEmoji: true,
  showFiles: true,
  allowEndConversation: true,
  greetingEnabled: false,
  collectEmail: false,
  allowAfterResolved: true,
  giphyKey: "",
  preChatFields: [
    { key: "name", label: "Seu nome", type: "text", required: true },
    { key: "email", label: "Seu e-mail", type: "email", required: false },
    {
      key: "phone",
      label: "Telefone para contato",
      type: "tel",
      required: false
    }
  ]
};

const TEMPOS = [
  { value: "minutes", label: "Em alguns minutos" },
  { value: "hours", label: "Em algumas horas" },
  { value: "day", label: "Em um dia" }
];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      width: 980,
      maxWidth: "calc(100vw - 24px)",
      maxHeight: "calc(100vh - 48px)",
      borderRadius: 18,
      display: "flex",
      flexDirection: "column"
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: theme.spacing(2, 2, 0, 3)
    },
    title: {
      flex: 1,
      fontSize: "1.0625rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    tabs: {
      borderBottom: `1px solid ${t.border}`,
      padding: theme.spacing(0, 2)
    },
    colunas: {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 360px",
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" }
    },
    body: {
      overflowY: "auto",
      padding: theme.spacing(2.5, 3),
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(2),
      ...theme.scrollbarStyles
    },

    // ── prévia: a bolinha do jeito que vai ficar no site ──
    previa: {
      borderLeft: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      padding: theme.spacing(2.5, 2),
      display: "flex",
      flexDirection: "column",
      gap: 10,
      [theme.breakpoints.down("sm")]: { display: "none" }
    },
    previaTitulo: {
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    palco: {
      flex: 1,
      position: "relative",
      borderRadius: 14,
      border: `1px solid ${t.border}`,
      backgroundColor: theme.mode === "dark" ? "#15151A" : "#FFFFFF",
      overflow: "hidden",
      minHeight: 420
    },
    fakeJanela: {
      position: "absolute",
      top: 14,
      width: 250,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: "#FFFFFF",
      boxShadow: "0 18px 40px -16px rgba(0,0,0,.45)"
    },
    fakeTopo: { padding: "12px 14px", color: "#fff" },
    fakeTitulo: { fontSize: "0.8125rem", fontWeight: 700 },
    fakeSub: { fontSize: "0.6875rem", opacity: 0.9, marginTop: 2 },
    fakeLista: {
      backgroundColor: "#F6F6F8",
      padding: 12,
      minHeight: 150,
      display: "flex",
      flexDirection: "column",
      gap: 6
    },
    fakeMsg: {
      alignSelf: "flex-start",
      maxWidth: "85%",
      padding: "7px 10px",
      borderRadius: 12,
      backgroundColor: "#fff",
      color: "#1A1A1F",
      fontSize: "0.6875rem",
      lineHeight: 1.4,
      boxShadow: "0 1px 2px rgba(0,0,0,.08)"
    },
    fakeAcoes: {
      display: "flex",
      gap: 6,
      padding: "0 10px 8px",
      backgroundColor: "#fff"
    },
    fakeChip: {
      padding: "4px 8px",
      borderRadius: 999,
      backgroundColor: "#F2F2F5",
      color: "#4A4A55",
      fontSize: "0.625rem"
    },
    fakeBarra: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: 8,
      backgroundColor: "#fff",
      borderTop: "1px solid #ECECF0"
    },
    fakeCampo: {
      flex: 1,
      padding: "7px 10px",
      borderRadius: 999,
      backgroundColor: "#F2F2F5",
      color: "#9A9AA5",
      fontSize: "0.6875rem"
    },
    fakeIcone: { fontSize: 13, color: "#7A7A85" },
    fakeEnviar: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 12
    },
    fakeBolha: {
      position: "absolute",
      bottom: 14,
      width: 46,
      height: 46,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontSize: 20,
      boxShadow: "0 8px 20px -6px rgba(0,0,0,.5)"
    },
    fakeChamada: {
      position: "absolute",
      bottom: 24,
      padding: "6px 10px",
      borderRadius: 999,
      backgroundColor: "#fff",
      color: "#1A1A1F",
      fontSize: "0.6875rem",
      fontWeight: 600,
      boxShadow: "0 6px 18px -6px rgba(0,0,0,.35)",
      maxWidth: 150,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    grupo: { display: "flex", gap: 12, flexWrap: "wrap" },
    meio: { flex: "1 1 220px", minWidth: 0 },
    secao: {
      marginTop: 6,
      fontSize: "0.6875rem",
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: theme.palette.text.secondary
    },
    linha: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
      borderTop: `1px solid ${t.border}`
    },
    linhaTexto: { flex: 1, minWidth: 0 },
    linhaTitulo: {
      fontSize: "0.9375rem",
      color: theme.palette.text.primary
    },
    linhaHint: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },
    cores: { display: "flex", gap: 10, alignItems: "center" },
    cor: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      border: "2px solid transparent",
      cursor: "pointer"
    },
    corOn: { borderColor: theme.palette.text.primary },
    obrigatorio: {
      flex: "none",
      padding: "5px 10px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: theme.palette.text.secondary
    },
    script: {
      padding: "12px 14px",
      borderRadius: 12,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      fontFamily: "monospace",
      fontSize: "0.75rem",
      lineHeight: 1.6,
      whiteSpace: "pre-wrap",
      color: theme.palette.text.primary
    },
    foot: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: theme.spacing(1.5, 3, 2.5),
      borderTop: `1px solid ${t.border}`
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

const CORES = [
  "#5C59E8",
  "#0B8043",
  "#039BE5",
  "#8E24AA",
  "#F4511E",
  "#111111"
];

const WebchatSettings = ({ open, onClose, inbox, onSaved }) => {
  const classes = useStyles();
  const [aba, setAba] = useState(0);
  const [nome, setNome] = useState("");
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !inbox) return;
    setNome(inbox.name || "");
    setConfig({ ...CONFIG_PADRAO, ...(inbox.config || {}) });
    setAba(0);
  }, [open, inbox]);

  const set = (chave, valor) =>
    setConfig(prev => ({ ...prev, [chave]: valor }));

  const salvar = async () => {
    setSalvando(true);
    try {
      const { data } = await api.put(`/whatsapp/${inbox.id}`, {
        name: nome.trim(),
        config
      });
      toast.success("Caixa de entrada atualizada");
      onSaved?.(data);
      onClose();
    } catch (err) {
      toastError(err);
    }
    setSalvando(false);
  };

  const script = inbox
    ? `<script>
  window.vuupSettings = {"position":"${config.bubblePosition || "right"}","type":"${config.bubbleType || "standard"}","launcherTitle":"${config.launcherTitle || ""}"};
  (function(d,t){
    var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
    g.src="${window.location.origin}/webchat.js";
    g.charset="utf-8";
    g.async=true;
    g.setAttribute("data-token","${inbox.token}");
    g.setAttribute("data-api","${getBackendURL()}");
    s.parentNode.insertBefore(g,s);
  })(document,"script");
</script>`
    : "";

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(script);
      toast.success("Script copiado");
    } catch (err) {
      toast.error("Não consegui copiar");
    }
  };

  const TEMPO_TEXTO = {
    minutes: "Normalmente responde em alguns minutos",
    hours: "Normalmente responde em algumas horas",
    day: "Normalmente responde em um dia"
  };

  /** O mesmo desenho do widget, montado com o que está no formulário. */
  const previa = () => {
    const esquerda = config.bubblePosition === "left";
    const lado = esquerda ? { left: 14 } : { right: 14 };
    const ladoChamada = esquerda ? { left: 68 } : { right: 68 };
    return (
      <div className={classes.previa}>
        <span className={classes.previaTitulo}>Prévia</span>
        <div className={classes.palco}>
          <div className={classes.fakeJanela} style={lado}>
            <div
              className={classes.fakeTopo}
              style={{ backgroundColor: config.color }}
            >
              <div className={classes.fakeTitulo}>
                {config.welcomeTitle || nome}
              </div>
              <div className={classes.fakeSub}>
                {TEMPO_TEXTO[config.replyTime] || TEMPO_TEXTO.minutes}
              </div>
            </div>
            <div className={classes.fakeLista}>
              {config.welcomeMessage && (
                <span className={classes.fakeMsg}>{config.welcomeMessage}</span>
              )}
            </div>
            {config.allowEndConversation && (
              <div className={classes.fakeAcoes}>
                <span className={classes.fakeChip}>Encerrar conversa</span>
              </div>
            )}
            <div className={classes.fakeBarra}>
              {config.showFiles && (
                <span className={classes.fakeIcone}>📎</span>
              )}
              {config.showEmoji && (
                <span className={classes.fakeIcone}>🙂</span>
              )}
              <span className={classes.fakeCampo}>Escreva sua mensagem</span>
              <span
                className={classes.fakeEnviar}
                style={{ backgroundColor: config.color }}
              >
                ➤
              </span>
            </div>
          </div>

          {config.bubbleType === "expanded" && config.launcherTitle && (
            <div className={classes.fakeChamada} style={ladoChamada}>
              {config.launcherTitle}
            </div>
          )}
          <div
            className={classes.fakeBolha}
            style={{ ...lado, backgroundColor: config.color }}
          >
            💬
          </div>
        </div>
      </div>
    );
  };

  const chave = (titulo, hint, campo) => (
    <div className={classes.linha}>
      <span className={classes.linhaTexto}>
        <div className={classes.linhaTitulo}>{titulo}</div>
        <div className={classes.linhaHint}>{hint}</div>
      </span>
      <Switch
        color="primary"
        checked={!!config[campo]}
        onChange={e => set(campo, e.target.checked)}
      />
    </div>
  );

  return (
    <Dialog open={open} onClose={onClose} classes={{ paper: classes.paper }}>
      <div className={classes.head}>
        <span className={classes.title}>{inbox?.name || "Caixa do site"}</span>
        <IconButton size="small" onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>
      <Tabs
        className={classes.tabs}
        value={aba}
        onChange={(e, valor) => setAba(valor)}
        indicatorColor="primary"
        textColor="primary"
      >
        <Tab label="Aparência" />
        <Tab label="Comportamento" />
        <Tab label="Script" />
      </Tabs>

      {aba !== 2 && (
        <div className={classes.colunas}>
          <div
            style={{ minWidth: 0, display: "flex", flexDirection: "column" }}
          >
            {aba === 0 && (
              <div className={classes.body}>
                <TextField
                  label="Nome da caixa de entrada"
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
                  value={config.domain}
                  onChange={e => set("domain", e.target.value)}
                />
                <TextField
                  label="Bem-vindo (título)"
                  variant="outlined"
                  size="small"
                  value={config.welcomeTitle}
                  onChange={e => set("welcomeTitle", e.target.value)}
                />
                <TextField
                  label="Bem-vindo (saudação)"
                  variant="outlined"
                  size="small"
                  multiline
                  minRows={2}
                  inputProps={{ maxLength: 255 }}
                  value={config.welcomeMessage}
                  onChange={e => set("welcomeMessage", e.target.value)}
                />
                <div>
                  <div className={classes.secao}>Cor do widget</div>
                  <div className={classes.cores} style={{ marginTop: 8 }}>
                    {CORES.map(item => (
                      <button
                        key={item}
                        type="button"
                        aria-label={item}
                        className={`${classes.cor}${
                          config.color === item ? ` ${classes.corOn}` : ""
                        }`}
                        style={{ backgroundColor: item }}
                        onClick={() => set("color", item)}
                      />
                    ))}
                    <TextField
                      variant="outlined"
                      size="small"
                      style={{ width: 130 }}
                      value={config.color}
                      onChange={e => set("color", e.target.value)}
                    />
                  </div>
                </div>
                <div className={classes.grupo}>
                  <TextField
                    select
                    className={classes.meio}
                    label="Lado da bolinha"
                    variant="outlined"
                    size="small"
                    value={config.bubblePosition}
                    onChange={e => set("bubblePosition", e.target.value)}
                  >
                    <MenuItem value="right">Direita</MenuItem>
                    <MenuItem value="left">Esquerda</MenuItem>
                  </TextField>
                  <TextField
                    select
                    className={classes.meio}
                    label="Tipo da bolinha"
                    variant="outlined"
                    size="small"
                    value={config.bubbleType}
                    onChange={e => set("bubbleType", e.target.value)}
                  >
                    <MenuItem value="standard">Padrão (só o ícone)</MenuItem>
                    <MenuItem value="expanded">Com chamada ao lado</MenuItem>
                  </TextField>
                </div>
                <TextField
                  label="Título do iniciador"
                  placeholder="Fale conosco no chat"
                  helperText="Aparece ao lado da bolinha quando o tipo é “com chamada”"
                  variant="outlined"
                  size="small"
                  value={config.launcherTitle}
                  onChange={e => set("launcherTitle", e.target.value)}
                />
                <TextField
                  select
                  label="Tempo de resposta"
                  helperText="Mostrado embaixo do título, na janela"
                  variant="outlined"
                  size="small"
                  value={config.replyTime}
                  onChange={e => set("replyTime", e.target.value)}
                >
                  {TEMPOS.map(item => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </TextField>
              </div>
            )}

            {aba === 1 && (
              <div className={classes.body}>
                <div className={classes.secao}>O que aparece na janela</div>
                {chave(
                  "Enviar arquivos",
                  "O visitante pode anexar imagem ou documento.",
                  "showFiles"
                )}
                {chave(
                  "Seletor de emoji",
                  "Um teclado de emoji dentro da janela.",
                  "showEmoji"
                )}
                {chave(
                  "Encerrar a conversa",
                  "O visitante pode dar a conversa por encerrada.",
                  "allowEndConversation"
                )}

                <div className={classes.secao}>Como a conversa começa</div>
                {chave(
                  "Saudação automática",
                  "Manda a mensagem de boas-vindas assim que a conversa nasce.",
                  "greetingEnabled"
                )}
                {chave(
                  "Pedir nome e e-mail antes",
                  "Um formulário curto antes da primeira mensagem.",
                  "collectEmail"
                )}
                {chave(
                  "Escrever depois de resolvida",
                  "Deixa o visitante mandar mensagem mesmo depois do atendimento encerrado.",
                  "allowAfterResolved"
                )}
              </div>
            )}
          </div>
          {previa()}
        </div>
      )}

      {aba === 2 && (
        <div className={classes.body}>
          <span className={classes.linhaHint}>
            Cole esta linha antes do <code>&lt;/body&gt;</code> das páginas em
            que a bolinha deve aparecer. Pode copiar quantas vezes quiser — o
            script é o mesmo para o site inteiro.
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
      )}

      <div className={classes.foot}>
        <Button variant="outlined" className={classes.botao} onClick={onClose}>
          Fechar
        </Button>
        {aba !== 2 && (
          <Button
            variant="contained"
            color="primary"
            disableElevation
            className={classes.botao}
            disabled={salvando || nome.trim().length < 2}
            onClick={salvar}
          >
            Salvar
          </Button>
        )}
      </div>
    </Dialog>
  );
};

export default WebchatSettings;
