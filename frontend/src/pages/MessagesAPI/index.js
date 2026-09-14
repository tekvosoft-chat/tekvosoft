import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import {
  Button,
  ButtonBase,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";
import VpnKeyOutlinedIcon from "@material-ui/icons/VpnKeyOutlined";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@material-ui/icons/VisibilityOffOutlined";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import ErrorRoundedIcon from "@material-ui/icons/ErrorRounded";
import AttachFileRoundedIcon from "@material-ui/icons/AttachFileRounded";
import ArrowForwardRoundedIcon from "@material-ui/icons/ArrowForwardRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { getBackendURL } from "../../services/config";
import { monoStack } from "../../theme/tokens";

/**
 * API de mensagens: documentação que ensina a usar, não só lista campos.
 *
 * Organizada na ordem em que a pessoa precisa das coisas: pegar o token,
 * entender o endereço e os campos, copiar um exemplo pronto na linguagem que
 * ela usa e testar aqui mesmo, vendo a resposta do servidor. O teste chama a
 * mesma rota pública (/api/messages/send) que os sistemas externos chamam.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  const code = t.isDark ? "#0E0C14" : "#1A1626";
  return {
    page: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(3),
      ...theme.scrollbarStyles,
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2, 1.5, 4) }
    },
    inner: {
      maxWidth: 1080,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(3)
    },
    hero: { display: "flex", flexDirection: "column", gap: 6 },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    lead: {
      maxWidth: 680,
      fontSize: "0.9375rem",
      color: theme.palette.text.secondary
    },
    sectionTitle: {
      fontSize: "1rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      marginBottom: theme.spacing(1.25)
    },
    card: {
      borderRadius: t.radius.lg,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      padding: theme.spacing(2.5),
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(2) }
    },
    steps: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" }
    },
    step: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 700,
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    stepTitle: {
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    stepText: {
      fontSize: "0.875rem",
      lineHeight: 1.55,
      color: theme.palette.text.secondary,
      "& b": { color: theme.palette.text.primary, fontWeight: 600 }
    },
    endpoint: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      padding: theme.spacing(1, 1, 1, 1.25),
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken,
      border: `1px solid ${t.border}`,
      minWidth: 0
    },
    method: {
      flex: "none",
      padding: "3px 8px",
      borderRadius: t.radius.xs,
      fontSize: "0.75rem",
      fontWeight: 800,
      letterSpacing: "0.04em",
      backgroundColor: t.semantic.successSoft || t.brand.textSoft,
      color: t.semantic.success || t.brand.text
    },
    url: {
      flex: 1,
      minWidth: 0,
      fontFamily: monoStack,
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    tableWrap: { overflowX: "auto", marginTop: theme.spacing(2) },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.875rem",
      "& th": {
        textAlign: "left",
        fontSize: "0.75rem",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: theme.palette.text.secondary,
        padding: theme.spacing(1),
        borderBottom: `1px solid ${t.border}`,
        whiteSpace: "nowrap"
      },
      "& td": {
        padding: theme.spacing(1.25, 1),
        borderBottom: `1px solid ${t.border}`,
        verticalAlign: "top",
        color: theme.palette.text.primary
      },
      "& tr:last-child td": { borderBottom: "none" },
      "& code": {
        fontFamily: monoStack,
        fontSize: "0.8125rem",
        padding: "1px 6px",
        borderRadius: t.radius.xs,
        backgroundColor: t.surfaceSunken
      }
    },
    required: {
      marginLeft: 6,
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: t.semantic.danger
    },
    muted: { color: theme.palette.text.secondary },
    segmented: {
      display: "inline-flex",
      flexWrap: "wrap",
      gap: 4,
      padding: 4,
      borderRadius: t.radius.md,
      backgroundColor: t.surfaceSunken
    },
    segment: {
      padding: "6px 12px",
      borderRadius: t.radius.sm,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    segmentActive: {
      backgroundColor: t.surface,
      color: t.brand.text,
      boxShadow: theme.shadows[1]
    },
    codeHead: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1.5)
    },
    codeBox: {
      position: "relative",
      borderRadius: t.radius.md,
      backgroundColor: code,
      overflow: "hidden"
    },
    pre: {
      margin: 0,
      padding: theme.spacing(2, 2, 2, 2),
      paddingRight: 56,
      overflowX: "auto",
      fontFamily: monoStack,
      fontSize: "0.8125rem",
      lineHeight: 1.6,
      color: "#E9E6F5",
      whiteSpace: "pre"
    },
    copyCode: {
      position: "absolute",
      top: 8,
      right: 8,
      color: "#E9E6F5",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.16)" }
    },
    responses: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: theme.spacing(1)
    },
    response: {
      display: "flex",
      gap: theme.spacing(1),
      padding: theme.spacing(1.25),
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`
    },
    status: {
      flex: "none",
      height: 22,
      padding: "0 7px",
      borderRadius: t.radius.xs,
      fontFamily: monoStack,
      fontSize: "0.75rem",
      fontWeight: 700,
      display: "flex",
      alignItems: "center"
    },
    statusOk: {
      backgroundColor: t.semantic.successSoft,
      color: t.semantic.success
    },
    statusErr: {
      backgroundColor: t.semantic.dangerSoft,
      color: t.semantic.danger
    },
    testGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: theme.spacing(3),
      [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" }
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1.5)
    },
    fileBtn: {
      justifyContent: "flex-start",
      gap: 8,
      padding: theme.spacing(1.25, 1.5),
      borderRadius: t.radius.md,
      border: `1px dashed ${t.borderStrong}`,
      color: theme.palette.text.secondary,
      fontSize: "0.875rem",
      textAlign: "left"
    },
    result: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing(1)
    },
    resultHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontWeight: 600
    },
    hint: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    }
  };
});

const copy = async text => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  } catch (err) {
    toast.error("Não foi possível copiar");
  }
};

const buildExamples = ({ endpoint, token, number, body }) => {
  const tk = token || "SEU_TOKEN";
  const num = number || "5511999998888";
  const msg = body || "Olá! Seu pedido foi confirmado.";
  const json = JSON.stringify(
    { number: num, body: msg, saveOnTicket: true, linkPreview: true },
    null,
    2
  );
  return {
    text: {
      cURL: `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${tk}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ number: num, body: msg, saveOnTicket: true })}'`,
      JavaScript: `const resposta = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    Authorization: "Bearer ${tk}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(${json.replace(/\n/g, "\n  ")})
});

console.log(resposta.status, await resposta.json());`,
      PHP: `<?php
$ch = curl_init("${endpoint}");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer ${tk}",
    "Content-Type: application/json"
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "number" => "${num}",
    "body" => "${msg.replace(/"/g, '\\"')}",
    "saveOnTicket" => true
  ])
]);
echo curl_exec($ch);`,
      Python: `import requests

resposta = requests.post(
    "${endpoint}",
    headers={"Authorization": "Bearer ${tk}"},
    json={"number": "${num}", "body": "${msg.replace(/"/g, '\\"')}", "saveOnTicket": True},
)
print(resposta.status_code, resposta.json())`
    },
    media: {
      cURL: `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${tk}" \\
  -F "number=${num}" \\
  -F "saveOnTicket=true" \\
  -F "medias=@/caminho/para/arquivo.pdf"`,
      JavaScript: `const form = new FormData();
form.append("number", "${num}");
form.append("saveOnTicket", "true");
form.append("medias", arquivo); // um File/Blob, ex.: input.files[0]

const resposta = await fetch("${endpoint}", {
  method: "POST",
  headers: { Authorization: "Bearer ${tk}" },
  body: form
});

console.log(resposta.status, await resposta.json());`,
      PHP: `<?php
$ch = curl_init("${endpoint}");
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER => ["Authorization: Bearer ${tk}"],
  CURLOPT_POSTFIELDS => [
    "number" => "${num}",
    "saveOnTicket" => "true",
    "medias" => new CURLFile("/caminho/para/arquivo.pdf")
  ]
]);
echo curl_exec($ch);`,
      Python: `import requests

with open("/caminho/para/arquivo.pdf", "rb") as arquivo:
    resposta = requests.post(
        "${endpoint}",
        headers={"Authorization": "Bearer ${tk}"},
        data={"number": "${num}", "saveOnTicket": "true"},
        files={"medias": arquivo},
    )
print(resposta.status_code, resposta.json())`
    }
  };
};

const RESPONSES = [
  {
    code: 200,
    ok: true,
    title: "Mensagem na fila",
    text: 'Resposta: {"mensagem": "Message added to queue"}. O envio acontece em poucos segundos.'
  },
  {
    code: 400,
    title: "Falta o número",
    text: "O campo number não foi enviado (ERR_SYNTAX)."
  },
  {
    code: 401,
    title: "Token inválido",
    text: "Cabeçalho Authorization ausente ou token que não pertence a nenhuma conexão."
  },
  {
    code: 404,
    title: "Conexão não encontrada",
    text: "A conexão do token foi removida (ERR_WHATSAPP_NOT_FOUND)."
  },
  {
    code: 500,
    title: "Não foi possível enviar",
    text: "Número inválido/sem WhatsApp ou conexão desconectada. Confira o número e o status em Conexões."
  }
];

const MessagesAPI = () => {
  const classes = useStyles();
  const history = useHistory();
  const endpoint = `${getBackendURL()}/api/messages/send`;

  const [connections, setConnections] = useState([]);
  const [connectionId, setConnectionId] = useState("");
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [number, setNumber] = useState("");
  const [kind, setKind] = useState("text");
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [saveOnTicket, setSaveOnTicket] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [exampleKind, setExampleKind] = useState("text");
  const [language, setLanguage] = useState("cURL");

  useEffect(() => {
    api
      .get("/whatsapp/")
      .then(({ data }) => setConnections(Array.isArray(data) ? data : []))
      .catch(() => setConnections([]));
  }, []);

  const pickConnection = async id => {
    setConnectionId(id);
    if (!id) return;
    try {
      const { data } = await api.get(`/whatsapp/${id}`, {
        params: { session: 0 }
      });
      setToken(data?.token || "");
      if (!data?.token) {
        toast.info(
          "Essa conexão ainda não tem token. Crie um em Conexões > editar."
        );
      }
    } catch (err) {
      toastError(err);
    }
  };

  const examples = useMemo(
    () => buildExamples({ endpoint, token, number, body }),
    [endpoint, token, number, body]
  );
  const code = examples[exampleKind][language];

  const send = async e => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      let data;
      const headers = { Authorization: `Bearer ${token}` };
      if (kind === "text") {
        data = { number, body, saveOnTicket };
        headers["Content-Type"] = "application/json";
      } else {
        data = new FormData();
        data.append("number", number);
        data.append("saveOnTicket", String(saveOnTicket));
        if (file) data.append("medias", file);
      }
      const response = await axios.post(endpoint, data, { headers });
      setResult({ ok: true, status: response.status, data: response.data });
    } catch (err) {
      setResult({
        ok: false,
        status: err?.response?.status || "—",
        data: err?.response?.data || { error: err?.message }
      });
    }
    setSending(false);
  };

  const Segmented = ({ options, value, onChange }) => (
    <div className={classes.segmented} role="tablist">
      {options.map(option => (
        <ButtonBase
          key={option.value}
          role="tab"
          aria-selected={value === option.value}
          className={`${classes.segment}${value === option.value ? ` ${classes.segmentActive}` : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </ButtonBase>
      ))}
    </div>
  );

  return (
    <div className={classes.page}>
      <div className={classes.inner}>
        <header className={classes.hero}>
          <Typography component="h1" className={classes.title}>
            API de mensagens
          </Typography>
          <Typography className={classes.lead}>
            Envie mensagens e arquivos pelo WhatsApp a partir do seu sistema,
            site, loja virtual ou automação (n8n, Make, Zapier). Basta uma
            requisição HTTP com o token da conexão que vai enviar.
          </Typography>
        </header>

        <section>
          <Typography component="h2" className={classes.sectionTitle}>
            Como começar
          </Typography>
          <div className={classes.steps}>
            <div className={`${classes.card} ${classes.step}`}>
              <span className={classes.stepNumber}>1</span>
              <Typography className={classes.stepTitle}>
                Crie o token da conexão
              </Typography>
              <Typography className={classes.stepText}>
                Em <b>Conexões</b>, clique em <b>editar</b> na conexão que vai
                enviar, preencha o campo <b>Token</b> com uma senha longa e
                salve. Cada conexão tem o seu.
              </Typography>
              <Button
                size="small"
                color="primary"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => history.push("/connections")}
                style={{ alignSelf: "flex-start" }}
              >
                Ir para Conexões
              </Button>
            </div>
            <div className={`${classes.card} ${classes.step}`}>
              <span className={classes.stepNumber}>2</span>
              <Typography className={classes.stepTitle}>
                Faça a requisição
              </Typography>
              <Typography className={classes.stepText}>
                Envie um <b>POST</b> para o endereço abaixo com o cabeçalho{" "}
                <b>Authorization: Bearer SEU_TOKEN</b> e o número com DDI e DDD,
                só dígitos.
              </Typography>
            </div>
            <div className={`${classes.card} ${classes.step}`}>
              <span className={classes.stepNumber}>3</span>
              <Typography className={classes.stepTitle}>
                Confira o envio
              </Typography>
              <Typography className={classes.stepText}>
                A resposta <b>200</b> diz que a mensagem entrou na fila. Com{" "}
                <b>saveOnTicket: true</b> ela também aparece em{" "}
                <b>Atendimentos</b>, na conversa do contato.
              </Typography>
            </div>
          </div>
        </section>

        <section className={classes.card}>
          <Typography component="h2" className={classes.sectionTitle}>
            Endereço
          </Typography>
          <div className={classes.endpoint}>
            <span className={classes.method}>POST</span>
            <span className={classes.url}>{endpoint}</span>
            <Tooltip title="Copiar endereço">
              <IconButton size="small" onClick={() => copy(endpoint)}>
                <FileCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          <div className={classes.tableWrap}>
            <table className={classes.table}>
              <thead>
                <tr>
                  <th>Campo</th>
                  <th>Tipo</th>
                  <th>O que é</th>
                  <th>Exemplo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>Authorization</code>
                    <span className={classes.required}>obrigatório</span>
                  </td>
                  <td className={classes.muted}>cabeçalho</td>
                  <td>"Bearer " seguido do token da conexão.</td>
                  <td>
                    <code>Bearer abc123…</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>number</code>
                    <span className={classes.required}>obrigatório</span>
                  </td>
                  <td className={classes.muted}>texto</td>
                  <td>
                    Número com DDI + DDD, só dígitos. Para grupos, o ID que
                    termina em <code>@g.us</code>.
                  </td>
                  <td>
                    <code>5511999998888</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>body</code>
                  </td>
                  <td className={classes.muted}>texto</td>
                  <td>
                    Texto da mensagem. Aceita a formatação do WhatsApp (
                    <code>*negrito*</code>, <code>_itálico_</code>).
                  </td>
                  <td>
                    <code>Olá, Maria!</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>medias</code>
                  </td>
                  <td className={classes.muted}>arquivo</td>
                  <td>
                    Um ou mais arquivos (imagem, vídeo, áudio, PDF). Envie como{" "}
                    <code>multipart/form-data</code>; o nome do arquivo vira a
                    legenda.
                  </td>
                  <td>
                    <code>proposta.pdf</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>saveOnTicket</code>
                  </td>
                  <td className={classes.muted}>true / false</td>
                  <td>
                    Salva a mensagem na conversa do contato, para a equipe ver
                    em Atendimentos.
                  </td>
                  <td>
                    <code>true</code>
                  </td>
                </tr>
                <tr>
                  <td>
                    <code>linkPreview</code>
                  </td>
                  <td className={classes.muted}>true / false</td>
                  <td>Mostra a prévia de links enviados no texto.</td>
                  <td>
                    <code>true</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={classes.card}>
          <div className={classes.codeHead}>
            <Typography
              component="h2"
              className={classes.sectionTitle}
              style={{ marginBottom: 0 }}
            >
              Exemplos prontos
            </Typography>
            <Segmented
              value={exampleKind}
              onChange={setExampleKind}
              options={[
                { value: "text", label: "Texto" },
                { value: "media", label: "Arquivo" }
              ]}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Segmented
              value={language}
              onChange={setLanguage}
              options={["cURL", "JavaScript", "PHP", "Python"].map(l => ({
                value: l,
                label: l
              }))}
            />
          </div>
          <div className={classes.codeBox}>
            <pre className={classes.pre}>{code}</pre>
            <Tooltip title="Copiar código">
              <IconButton
                size="small"
                className={classes.copyCode}
                onClick={() => copy(code)}
              >
                <FileCopyOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
          <Typography className={classes.hint} style={{ marginTop: 8 }}>
            Os exemplos já usam o token e o número que você preencher no teste
            abaixo.
          </Typography>
        </section>

        <section className={classes.card}>
          <Typography component="h2" className={classes.sectionTitle}>
            Respostas
          </Typography>
          <div className={classes.responses}>
            {RESPONSES.map(item => (
              <div key={item.code} className={classes.response}>
                <span
                  className={`${classes.status} ${item.ok ? classes.statusOk : classes.statusErr}`}
                >
                  {item.code}
                </span>
                <div>
                  <Typography style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {item.title}
                  </Typography>
                  <Typography className={classes.hint}>{item.text}</Typography>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={classes.card}>
          <Typography component="h2" className={classes.sectionTitle}>
            Testar agora
          </Typography>
          <div className={classes.testGrid}>
            <form className={classes.form} onSubmit={send}>
              <TextField
                select
                variant="outlined"
                size="small"
                label="Conexão"
                value={connectionId}
                onChange={e => pickConnection(e.target.value)}
                helperText="Escolha a conexão e o token é preenchido sozinho."
              >
                <MenuItem value="">Digitar o token manualmente</MenuItem>
                {connections.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                variant="outlined"
                size="small"
                label="Token"
                required
                value={token}
                onChange={e => setToken(e.target.value)}
                type={showToken ? "text" : "password"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyOutlinedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowToken(v => !v)}
                        aria-label={
                          showToken ? "Ocultar token" : "Mostrar token"
                        }
                      >
                        {showToken ? (
                          <VisibilityOffOutlinedIcon fontSize="small" />
                        ) : (
                          <VisibilityOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                variant="outlined"
                size="small"
                label="Número"
                required
                value={number}
                onChange={e =>
                  setNumber(e.target.value.replace(/[^\d@.a-z-]/gi, ""))
                }
                placeholder="5511999998888"
                helperText="DDI + DDD + número, só dígitos."
                inputProps={{ inputMode: "numeric" }}
              />
              <Segmented
                value={kind}
                onChange={setKind}
                options={[
                  { value: "text", label: "Texto" },
                  { value: "media", label: "Arquivo" }
                ]}
              />
              {kind === "text" ? (
                <TextField
                  variant="outlined"
                  size="small"
                  label="Mensagem"
                  required
                  multiline
                  minRows={3}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                />
              ) : (
                <ButtonBase component="label" className={classes.fileBtn}>
                  <AttachFileRoundedIcon fontSize="small" />
                  {file ? file.name : "Escolher arquivo"}
                  <input
                    type="file"
                    hidden
                    required
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </ButtonBase>
              )}
              <FormControlLabel
                control={
                  <Switch
                    color="primary"
                    checked={saveOnTicket}
                    onChange={e => setSaveOnTicket(e.target.checked)}
                  />
                }
                label="Salvar na conversa (saveOnTicket)"
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={sending || !token || !number}
                startIcon={
                  sending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SendRoundedIcon />
                  )
                }
              >
                Enviar teste
              </Button>
            </form>

            <div className={classes.result}>
              <Typography className={classes.stepTitle}>
                Resposta do servidor
              </Typography>
              {result ? (
                <>
                  <div className={classes.resultHead}>
                    {result.ok ? (
                      <CheckCircleRoundedIcon style={{ color: "#16A34A" }} />
                    ) : (
                      <ErrorRoundedIcon style={{ color: "#DC2626" }} />
                    )}
                    {result.ok
                      ? "Tudo certo: a mensagem entrou na fila de envio."
                      : "A requisição falhou. Veja o código na lista de respostas."}
                  </div>
                  <div className={classes.codeBox}>
                    <pre className={classes.pre}>
                      {`HTTP ${result.status}\n${JSON.stringify(result.data, null, 2)}`}
                    </pre>
                  </div>
                </>
              ) : (
                <div className={classes.codeBox}>
                  <pre className={classes.pre} style={{ opacity: 0.7 }}>
                    <CodeRoundedIcon
                      style={{ fontSize: 16, verticalAlign: "middle" }}
                    />{" "}
                    Envie um teste para ver a resposta aqui.
                  </pre>
                </div>
              )}
              <Typography className={classes.hint}>
                O teste envia uma mensagem de verdade para o número informado.
              </Typography>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MessagesAPI;
