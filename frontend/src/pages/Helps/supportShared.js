import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import moment from "moment";

import api from "../../services/api";
import { SocketContext } from "../../context/Socket/SocketContext";

/** Etapas do chamado, na ordem do kanban. */
export const STATUSES = [
  {
    key: "open",
    label: "Novos",
    client: "Aberto",
    tone: "brand",
    note: "Seu chamado foi reaberto e voltou para a fila do suporte"
  },
  {
    key: "in_progress",
    label: "Em andamento",
    client: "Em andamento",
    tone: "info",
    note: "Nosso time já está cuidando do seu chamado"
  },
  {
    key: "waiting",
    label: "Aguardando cliente",
    client: "Aguardando você",
    tone: "warning",
    note: "Precisamos de uma resposta sua para continuar"
  },
  {
    key: "resolved",
    label: "Resolvidos",
    client: "Resolvido",
    tone: "success",
    note: "Chamado resolvido. Se precisar, é só responder que ele reabre"
  }
];
export const statusOf = key => STATUSES.find(s => s.key === key) || STATUSES[0];

export const CATEGORIES = [
  { key: "question", label: "Dúvida", emoji: "💬" },
  { key: "problem", label: "Problema", emoji: "🛠️" },
  { key: "billing", label: "Financeiro", emoji: "💳" },
  { key: "suggestion", label: "Sugestão", emoji: "💡" }
];
export const categoryOf = key =>
  CATEGORIES.find(c => c.key === key) || CATEGORIES[0];

export const PRIORITIES = [
  { key: "low", label: "Baixa", tone: "neutral" },
  { key: "normal", label: "Normal", tone: "info" },
  { key: "high", label: "Alta", tone: "danger" }
];
export const priorityOf = key =>
  PRIORITIES.find(p => p.key === key) || PRIORITIES[1];

export const toneStyle = (theme, tone) => {
  const t = theme.palette.tkv;
  const sem = t.semantic;
  switch (tone) {
    case "success":
      return { color: sem.success, backgroundColor: sem.successSoft };
    case "warning":
      return { color: sem.warning, backgroundColor: sem.warningSoft };
    case "danger":
      return { color: sem.danger, backgroundColor: sem.dangerSoft };
    case "info":
      return { color: sem.info, backgroundColor: sem.infoSoft };
    case "neutral":
      return {
        color: theme.palette.text.secondary,
        backgroundColor: t.surfaceSunken
      };
    default:
      return { color: t.brand.text, backgroundColor: t.brand.textSoft };
  }
};

export const ago = date => (date ? moment(date).fromNow() : "");

/**
 * Atualiza a tela quando um chamado muda (novo, resposta, etapa, lido).
 * O super recebe de todas as empresas; o cliente, só da empresa dele.
 */
export const useSupportLive = onChange => {
  const socketManager = useContext(SocketContext);
  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);
    const handler = data => onChange(data);
    socket.on("support-ticket", handler);
    return () => {
      socket.off?.("support-ticket", handler);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketManager]);
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    images: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
    thumb: {
      width: 132,
      height: 100,
      borderRadius: t.radius.md,
      overflow: "hidden",
      backgroundColor: t.surfaceSunken,
      "& img": { width: "100%", height: "100%", objectFit: "cover" }
    },
    file: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      maxWidth: 260,
      marginTop: 6,
      padding: "8px 12px",
      borderRadius: t.radius.md,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surface,
      fontSize: "0.8125rem",
      color: theme.palette.text.primary,
      "& span": {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      },
      "& svg": { fontSize: 20, color: t.brand.text, flex: "none" }
    }
  };
});

// o anexo é privado: baixa com o login e mostra por um endereço local
const blobs = new Map();
const loadBlob = (messageId, attachmentId) => {
  const key = `${messageId}/${attachmentId}`;
  if (!blobs.has(key)) {
    blobs.set(
      key,
      api
        .get(`/support/attachments/${messageId}/${attachmentId}`, {
          responseType: "blob"
        })
        .then(({ data }) => URL.createObjectURL(data))
        .catch(() => {
          blobs.delete(key);
          return null;
        })
    );
  }
  return blobs.get(key);
};

const openBlob = async (messageId, file) => {
  const url = await loadBlob(messageId, file.id);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  if (file.mimetype?.startsWith("image/")) a.target = "_blank";
  else a.download = file.name;
  a.rel = "noopener";
  a.click();
};

const AuthImage = ({ messageId, file, className }) => {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    loadBlob(messageId, file.id).then(url => alive && setSrc(url));
    return () => {
      alive = false;
    };
  }, [messageId, file.id]);
  return (
    <ButtonBase className={className} onClick={() => openBlob(messageId, file)}>
      {src && <img src={src} alt={file.name} />}
    </ButtonBase>
  );
};

/** Fotos em miniatura e demais arquivos como botão de baixar. */
export const Attachments = ({ messageId, files }) => {
  const classes = useStyles();
  if (!files?.length) return null;
  const images = files.filter(f => f.mimetype?.startsWith("image/"));
  const others = files.filter(f => !f.mimetype?.startsWith("image/"));
  return (
    <>
      {images.length > 0 && (
        <div className={classes.images}>
          {images.map(file => (
            <AuthImage
              key={file.id}
              messageId={messageId}
              file={file}
              className={classes.thumb}
            />
          ))}
        </div>
      )}
      {others.map(file => (
        <div key={file.id}>
          <ButtonBase
            className={classes.file}
            onClick={() => openBlob(messageId, file)}
          >
            <InsertDriveFileOutlinedIcon />
            <span>{file.name}</span>
          </ButtonBase>
        </div>
      ))}
    </>
  );
};
