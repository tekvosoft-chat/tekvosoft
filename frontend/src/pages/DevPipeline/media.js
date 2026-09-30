import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import AddPhotoAlternateOutlinedIcon from "@material-ui/icons/AddPhotoAlternateOutlined";
import { toast } from "react-toastify";

import api from "../../services/api";
import { t } from "./shared";

/**
 * Imagens do pipeline: a pasta é privada, então a miniatura vem pela API
 * (com o login) e vira um endereço local do navegador. O seletor aceita
 * botão, arrastar e soltar e Ctrl+V de print.
 */
export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp"
];
export const MAX_IMAGES = 6;
const MAX_BYTES = 8 * 1024 * 1024;

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    thumbs: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
    thumb: {
      position: "relative",
      width: 96,
      height: 72,
      borderRadius: tkv.radius.md,
      overflow: "hidden",
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surfaceSunken,
      "& img": { width: "100%", height: "100%", objectFit: "cover" }
    },
    thumbLarge: { width: 132, height: 96 },
    // foto do teste: inteira (a do celular é em pé), num quadro maior
    thumbWhole: {
      width: 176,
      height: 132,
      "& img": { objectFit: "contain" },
      [theme.breakpoints.down("xs")]: { width: "calc(50% - 3px)" }
    },
    remove: {
      position: "absolute",
      top: 2,
      right: 2,
      padding: 2,
      color: "#fff",
      backgroundColor: "rgba(0,0,0,.55)",
      "&:hover": { backgroundColor: "rgba(0,0,0,.75)" },
      "& svg": { fontSize: 14 }
    },
    drop: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      width: "100%",
      minHeight: 56,
      marginTop: 8,
      padding: theme.spacing(1, 1.5),
      borderRadius: tkv.radius.md,
      border: `1px dashed ${tkv.borderStrong || tkv.border}`,
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      textAlign: "center"
    },
    dropOver: {
      borderColor: tkv.brand.main,
      backgroundColor: tkv.brand.textSoft,
      color: tkv.brand.text
    },
    // vídeo do teste: computador ao lado do celular; no celular, um embaixo
    // do outro
    videos: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 8,
      marginTop: 8
    },
    video: {
      margin: 0,
      "& video": {
        display: "block",
        width: "100%",
        maxHeight: 360,
        borderRadius: tkv.radius.md,
        border: `1px solid ${tkv.border}`,
        backgroundColor: "#000"
      },
      "& figcaption": {
        marginTop: 4,
        fontSize: "0.72rem",
        color: theme.palette.text.secondary
      }
    },
    videoLoading: {
      display: "block",
      height: 160,
      borderRadius: tkv.radius.md,
      backgroundColor: tkv.surfaceSunken
    }
  };
});

const blobs = new Map();

const loadImage = async (taskId, fileId) => {
  const key = `${taskId}/${fileId}`;
  if (!blobs.has(key)) {
    const { data } = await api.get(`/dev-tasks/${taskId}/files/${fileId}`, {
      responseType: "blob"
    });
    blobs.set(key, URL.createObjectURL(data));
  }
  return blobs.get(key);
};

/** Miniatura de uma imagem já anexada; tocar abre em tamanho real. */
export const DevImage = ({ taskId, file, large, whole }) => {
  const classes = useStyles();
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    loadImage(taskId, file.id)
      .then(url => alive && setSrc(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [taskId, file.id]);
  return (
    <ButtonBase
      className={clsx(classes.thumb, {
        [classes.thumbLarge]: large,
        [classes.thumbWhole]: whole
      })}
      onClick={() => src && window.open(src, "_blank", "noopener")}
      aria-label={file.name}
      title={file.name}
    >
      {src && <img src={src} alt={file.name} />}
    </ButtonBase>
  );
};

export const DevImages = ({ taskId, files, large, whole }) => {
  const classes = useStyles();
  if (!files?.length) return null;
  return (
    <div className={classes.thumbs}>
      {files.map(file => (
        <DevImage
          key={file.id}
          taskId={taskId}
          file={file}
          large={large}
          whole={whole}
        />
      ))}
    </div>
  );
};

/** Vídeo do teste de tela (webm), carregado pela API como as imagens. */
export const DevVideo = ({ taskId, file }) => {
  const classes = useStyles();
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    loadImage(taskId, file.id)
      .then(url => alive && setSrc(url))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [taskId, file.id]);
  return (
    <figure className={classes.video}>
      {src ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={src} controls playsInline preload="metadata" />
      ) : (
        <span className={classes.videoLoading} />
      )}
      <figcaption>
        {t(`devices.${file.name.replace(/\.webm$/, "")}`)}
      </figcaption>
    </figure>
  );
};

export const DevVideos = ({ taskId, files }) => {
  const classes = useStyles();
  if (!files?.length) return null;
  return (
    <div className={classes.videos}>
      {files.map(file => (
        <DevVideo key={file.id} taskId={taskId} file={file} />
      ))}
    </div>
  );
};

/** Filtra o que a IA consegue ver (imagem, até 8 MB, até 6). */
export const pickImages = (current, incoming) => {
  const valid = Array.from(incoming || []).filter(file => {
    if (!IMAGE_TYPES.includes(file.type)) return false;
    if (file.size > MAX_BYTES) {
      toast.error(t("images.tooBig", { name: file.name || "imagem" }));
      return false;
    }
    return true;
  });
  const next = [...current, ...valid].slice(0, MAX_IMAGES);
  if (current.length + valid.length > MAX_IMAGES) {
    toast.info(t("images.limit", { count: MAX_IMAGES }));
  }
  return next;
};

/** Imagens do clipboard (Ctrl+V de print) de um evento de colar. */
export const pastedImages = event =>
  Array.from(event.clipboardData?.items || [])
    .filter(item => item.kind === "file" && IMAGE_TYPES.includes(item.type))
    .map(item => item.getAsFile())
    .filter(Boolean);

/** Prévia das imagens escolhidas e ainda não enviadas. */
export const PendingImages = ({ files, onRemove }) => {
  const classes = useStyles();
  const [urls, setUrls] = useState([]);
  useEffect(() => {
    const next = files.map(file => URL.createObjectURL(file));
    setUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  if (!files.length) return null;
  return (
    <div className={classes.thumbs}>
      {files.map((file, index) => (
        <span key={`${file.name}-${index}`} className={classes.thumb}>
          {urls[index] && <img src={urls[index]} alt={file.name} />}
          <IconButton
            size="small"
            className={classes.remove}
            aria-label={t("images.remove")}
            onClick={() => onRemove(index)}
          >
            <CloseRoundedIcon />
          </IconButton>
        </span>
      ))}
    </div>
  );
};

/** Área de soltar/escolher imagens (o formulário de nova demanda). */
export const ImageDrop = ({ files, onChange }) => {
  const classes = useStyles();
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <>
      <ButtonBase
        className={clsx(classes.drop, { [classes.dropOver]: over })}
        onClick={() => inputRef.current?.click()}
        onDragOver={event => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={event => {
          event.preventDefault();
          setOver(false);
          onChange(pickImages(files, event.dataTransfer.files));
        }}
      >
        <AddPhotoAlternateOutlinedIcon />
        {t("images.drop")}
      </ButtonBase>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        multiple
        hidden
        onChange={event => {
          onChange(pickImages(files, event.target.files));
          event.target.value = "";
        }}
      />
      <PendingImages
        files={files}
        onRemove={index => onChange(files.filter((_, i) => i !== index))}
      />
    </>
  );
};
