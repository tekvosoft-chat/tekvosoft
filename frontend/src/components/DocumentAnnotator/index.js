import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import IconButton from "@material-ui/core/IconButton";
import ButtonBase from "@material-ui/core/ButtonBase";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import PanToolOutlinedIcon from "@material-ui/icons/PanToolOutlined";
import BrushOutlinedIcon from "@material-ui/icons/BrushOutlined";
import BorderColorOutlinedIcon from "@material-ui/icons/BorderColorOutlined";
import FormatUnderlinedIcon from "@material-ui/icons/FormatUnderlined";
import FormatStrikethroughIcon from "@material-ui/icons/FormatStrikethrough";
import TextFieldsOutlinedIcon from "@material-ui/icons/TextFieldsOutlined";
import UndoRoundedIcon from "@material-ui/icons/UndoRounded";
import RedoRoundedIcon from "@material-ui/icons/RedoRounded";
import DeleteSweepOutlinedIcon from "@material-ui/icons/DeleteSweepOutlined";
import ZoomInRoundedIcon from "@material-ui/icons/ZoomInRounded";
import ZoomOutRoundedIcon from "@material-ui/icons/ZoomOutRounded";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";
import SendRoundedIcon from "@material-ui/icons/SendRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../ui/BoxLoader";
import { i18n } from "../../translate/i18n";
import {
  BASE,
  COLORS,
  DEFAULT_COLORS,
  HIGHLIGHT_OPACITY,
  LINE_WIDTH,
  SIZES,
  TEXT_SIZE,
  normRect,
  penPath
} from "./paint";
import { exportImage, exportPdf } from "./exporters";

GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Visualizador de PDF e imagem com ferramentas de anotação, no estilo do
 * "Editar PDF" do Acrobat: desenhar, destacar, sublinhar, riscar, escrever
 * e apagar, com desfazer/refazer e zoom.
 *
 * O resultado pode ser baixado, enviado na conversa ou — quando o arquivo
 * ainda vai ser enviado — devolvido no lugar do original. No PDF, o texto
 * continua sendo texto: as anotações entram como uma camada por cima.
 */
const EraserIcon = props => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20 20H9L4 15a2 2 0 0 1 0-2.8l9.2-9.2a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L11 19" />
    <path d="M7 11l6 6" />
  </svg>
);

const TOOL_ICONS = {
  pan: <PanToolOutlinedIcon />,
  pen: <BrushOutlinedIcon />,
  highlight: <BorderColorOutlinedIcon />,
  underline: <FormatUnderlinedIcon />,
  strike: <FormatStrikethroughIcon />,
  text: <TextFieldsOutlinedIcon />,
  eraser: <EraserIcon style={{ width: 22, height: 22 }} />
};
const TOOL_ORDER = [
  "pan",
  "pen",
  "highlight",
  "underline",
  "strike",
  "text",
  "eraser"
];
const COLORED = ["pen", "highlight", "underline", "strike", "text"];

const ZOOMS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      backgroundColor: "#2A2A2E",
      color: "#F4F4F5",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    },
    top: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      paddingTop: "calc(8px + var(--safe-top, 0px))",
      backgroundColor: "#1F1F23",
      borderBottom: "1px solid rgba(255,255,255,0.08)"
    },
    iconBtn: {
      color: "#E4E4E7",
      "&.Mui-disabled": { color: "rgba(228,228,231,0.35)" }
    },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9375rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },
    pageInfo: {
      fontSize: "0.8125rem",
      color: "#A1A1AA",
      fontVariantNumeric: "tabular-nums",
      whiteSpace: "nowrap"
    },
    zoom: {
      display: "flex",
      alignItems: "center",
      gap: 2,
      [theme.breakpoints.down("xs")]: { display: "none" }
    },
    zoomLabel: {
      minWidth: 44,
      textAlign: "center",
      fontSize: "0.8125rem",
      fontVariantNumeric: "tabular-nums"
    },
    primary: {
      borderRadius: 999,
      textTransform: "none",
      fontWeight: 700,
      boxShadow: "none",
      whiteSpace: "nowrap",
      [theme.breakpoints.down("xs")]: {
        minWidth: 40,
        padding: "6px 10px",
        "& .MuiButton-startIcon": { margin: 0 },
        "& .label": { display: "none" }
      }
    },

    // ferramentas
    toolbar: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      padding: "8px 12px",
      backgroundColor: "#26262B",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      overflowX: "auto",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
      [theme.breakpoints.down("xs")]: {
        order: 3,
        justifyContent: "flex-start",
        borderBottom: "none",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "calc(8px + var(--safe-bottom, 0px))"
      }
    },
    tool: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      minWidth: 64,
      padding: "6px 8px",
      borderRadius: 10,
      color: "#D4D4D8",
      fontSize: "0.6875rem",
      fontWeight: 600,
      transition: "background-color .15s ease, color .15s ease",
      "& svg": { fontSize: 22 },
      "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" }
    },
    toolOn: {
      color: "#FFFFFF",
      backgroundColor: t.brand.main,
      "&:hover": { backgroundColor: t.brand.main }
    },
    sep: {
      flex: "none",
      width: 1,
      height: 32,
      margin: "0 6px",
      backgroundColor: "rgba(255,255,255,0.12)"
    },
    options: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: "6px 12px",
      backgroundColor: "#232327",
      animation: "$drop .2s ease both",
      [theme.breakpoints.down("xs")]: { order: 2 }
    },
    swatch: {
      width: 26,
      height: 26,
      borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.25)",
      transition: "transform .15s ease",
      "&:hover": { transform: "scale(1.12)" }
    },
    swatchOn: { boxShadow: "0 0 0 2px #2A2A2E, 0 0 0 4px #FFFFFF" },
    size: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "& span": { borderRadius: "50%", backgroundColor: "#E4E4E7" }
    },
    sizeOn: { backgroundColor: "rgba(255,255,255,0.14)" },

    // páginas
    stage: {
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      padding: "24px 16px 48px",
      display: "flex",
      flexDirection: "column",
      // margem automática nas páginas: centraliza sem cortar o lado
      // esquerdo quando o zoom deixa a página mais larga que a tela
      alignItems: "flex-start",
      gap: 20,
      WebkitOverflowScrolling: "touch",
      [theme.breakpoints.down("xs")]: {
        order: 1,
        padding: "12px 8px 24px",
        gap: 12
      }
    },
    page: {
      position: "relative",
      flex: "none",
      margin: "0 auto",
      backgroundColor: "#FFFFFF",
      boxShadow: "0 6px 24px rgba(0,0,0,0.45)"
    },
    base: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      display: "block",
      userSelect: "none",
      WebkitUserDrag: "none"
    },
    overlay: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      touchAction: "none"
    },
    overlayPan: { pointerEvents: "none" },
    textBox: {
      position: "absolute",
      zIndex: 2,
      minWidth: 120,
      padding: "2px 4px",
      border: `2px dashed ${t.brand.main}`,
      borderRadius: 4,
      background: "rgba(255,255,255,0.85)",
      fontWeight: 600,
      fontFamily: "inherit",
      lineHeight: 1.25,
      resize: "none",
      outline: "none"
    },
    center: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      color: "#D4D4D8"
    },
    "@keyframes drop": {
      from: { opacity: 0, transform: "translateY(-6px)" },
      to: { opacity: 1, transform: "none" }
    }
  };
});

// uma página: base (PDF renderizado ou foto) + camada de anotações
const Page = ({
  page,
  width,
  index,
  tool,
  annotations,
  draft,
  typing,
  onPointer,
  onTypingChange,
  onTypingDone,
  registerPage,
  classes
}) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [visible, setVisible] = useState(index < 2);
  const height = Math.round(width * page.aspect);
  const unitsH = BASE * page.aspect;

  useEffect(() => {
    const el = wrapRef.current;
    registerPage(index, el);
    if (!el || visible) return undefined;
    const observer = new IntersectionObserver(
      entries => entries[0].isIntersecting && setVisible(true),
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index, registerPage, visible]);

  // PDF: renderiza (de novo quando o zoom muda) na densidade da tela
  useEffect(() => {
    if (page.kind !== "pdf" || !visible) return undefined;
    let task = null;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = page.pdfPage.getViewport({ scale: 1 });
      const scale = (width / viewport.width) * dpr;
      const scaled = page.pdfPage.getViewport({ scale });
      const off = document.createElement("canvas");
      off.width = Math.round(scaled.width);
      off.height = Math.round(scaled.height);
      task = page.pdfPage.render({
        canvasContext: off.getContext("2d"),
        viewport: scaled
      });
      try {
        await task.promise;
        if (cancelled) return;
        canvas.width = off.width;
        canvas.height = off.height;
        canvas.getContext("2d").drawImage(off, 0, 0);
      } catch (e) {
        // render cancelado pelo zoom seguinte
      }
    }, 120);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      task?.cancel?.();
    };
  }, [page, width, visible]);

  const shapes = draft ? [...annotations, draft] : annotations;

  return (
    <div
      ref={wrapRef}
      className={classes.page}
      style={{ width, height }}
      data-page={index}
    >
      {page.kind === "pdf" ? (
        <canvas ref={canvasRef} className={classes.base} />
      ) : (
        <img
          crossOrigin="anonymous"
          src={page.src}
          alt=""
          className={classes.base}
          draggable={false}
        />
      )}
      <svg
        className={`${classes.overlay}${tool === "pan" ? ` ${classes.overlayPan}` : ""}`}
        viewBox={`0 0 ${BASE} ${unitsH}`}
        preserveAspectRatio="none"
        onPointerDown={e => onPointer("down", e, index, page)}
        onPointerMove={e => onPointer("move", e, index, page)}
        onPointerUp={e => onPointer("up", e, index, page)}
        onPointerCancel={e => onPointer("up", e, index, page)}
        style={{
          cursor:
            tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair"
        }}
      >
        {shapes.map(a => {
          const common = { key: a.id, "data-ann": a.id };
          if (a.type === "pen") {
            return (
              <path
                {...common}
                d={penPath(a.points)}
                fill="none"
                stroke={a.color}
                strokeWidth={a.size}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }
          if (a.type === "highlight") {
            const r = normRect(a);
            return (
              <rect
                {...common}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                fill={a.color}
                opacity={HIGHLIGHT_OPACITY}
                style={{ mixBlendMode: "multiply" }}
              />
            );
          }
          if (a.type === "underline" || a.type === "strike") {
            return (
              <line
                {...common}
                x1={a.x0}
                y1={a.y0}
                x2={a.x1}
                y2={a.y0}
                stroke={a.color}
                strokeWidth={LINE_WIDTH}
                strokeLinecap="round"
              />
            );
          }
          if (a.type === "text") {
            return (
              <text
                {...common}
                x={a.x}
                y={a.y}
                fill={a.color}
                fontSize={TEXT_SIZE}
                fontWeight="600"
                dominantBaseline="hanging"
                style={{ fontFamily: "inherit" }}
              >
                {String(a.text)
                  .split("\n")
                  .map((line, i) => (
                    <tspan key={i} x={a.x} dy={i === 0 ? 0 : TEXT_SIZE * 1.25}>
                      {line || " "}
                    </tspan>
                  ))}
              </text>
            );
          }
          return null;
        })}
      </svg>
      {typing && typing.page === index && (
        <textarea
          autoFocus
          className={classes.textBox}
          style={{
            left: (typing.x / BASE) * width,
            top: (typing.y / unitsH) * height,
            color: typing.color,
            fontSize: (TEXT_SIZE / BASE) * width
          }}
          value={typing.value}
          placeholder={i18n.t("annotator.typeHere")}
          onChange={e => onTypingChange(e.target.value)}
          onBlur={onTypingDone}
          onKeyDown={e => {
            if (e.key === "Escape") onTypingDone(true);
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onTypingDone();
            }
          }}
        />
      )}
    </div>
  );
};

let seq = 0;
const nextId = () => `a${Date.now().toString(36)}${(seq += 1)}`;

const DocumentAnnotator = ({
  open,
  onClose,
  src,
  type,
  fileName,
  ticketId,
  onSave
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const stageRef = useRef(null);
  const pageEls = useRef([]);
  const drawing = useRef(null);

  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [tool, setTool] = useState("pan");
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [size, setSize] = useState("medium");
  const [zoom, setZoom] = useState(1);
  const [stageWidth, setStageWidth] = useState(800);
  const [annotations, setAnnotations] = useState({});
  // espelho síncrono: dois registros no mesmo toque não se atropelam
  const annRef = useRef({});
  const typingRef = useRef(null);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [draft, setDraft] = useState(null);
  const [typing, setTyping] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [busy, setBusy] = useState(false);

  const kind = type === "pdf" ? "pdf" : "image";

  // carrega o documento
  useEffect(() => {
    if (!open || !src) return undefined;
    let alive = true;
    let pdfDoc = null;
    setStatus("loading");
    setPages([]);
    setAnnotations({});
    annRef.current = {};
    setPast([]);
    setFuture([]);
    setTool(isPhone ? "pan" : "pen");
    setZoom(1);
    (async () => {
      try {
        if (kind === "pdf") {
          pdfDoc = await getDocument({ url: src }).promise;
          const list = [];
          for (let i = 1; i <= pdfDoc.numPages; i += 1) {
            const pdfPage = await pdfDoc.getPage(i);
            const vp = pdfPage.getViewport({ scale: 1 });
            list.push({ kind: "pdf", pdfPage, aspect: vp.height / vp.width });
          }
          if (alive) setPages(list);
        } else {
          const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = src;
          });
          if (alive) {
            setPages([
              {
                kind: "image",
                src,
                aspect: img.naturalHeight / img.naturalWidth
              }
            ]);
          }
        }
        if (alive) setStatus("ready");
      } catch (err) {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
      pdfDoc?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, src, kind]);

  // largura útil da área das páginas
  useEffect(() => {
    if (!open) return undefined;
    const measure = () => {
      const el = stageRef.current;
      if (el) setStageWidth(el.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    const timer = setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(timer);
    };
  }, [open, status]);

  const fitWidth = useCallback(
    page => {
      const available = Math.max(200, stageWidth - (isPhone ? 16 : 48));
      const cap = page && page.aspect < 1 ? 1100 : 860; // paisagem pode ser mais larga
      return Math.round(Math.min(available, cap) * zoom);
    },
    [stageWidth, zoom, isPhone]
  );

  const registerPage = useCallback((index, el) => {
    pageEls.current[index] = el;
  }, []);

  // página atual (a mais visível)
  const onScroll = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const middle = stage.getBoundingClientRect().top + stage.clientHeight / 2;
    let best = 0;
    pageEls.current.forEach((el, i) => {
      if (el && el.getBoundingClientRect().top <= middle) best = i;
    });
    setCurrentPage(best);
  };

  const commit = next => {
    const previous = annRef.current;
    setPast(p => [...p.slice(-60), previous]);
    setFuture([]);
    annRef.current = next;
    setAnnotations(next);
  };

  const addTo = (pageIndex, annotation) => {
    const current = annRef.current;
    commit({
      ...current,
      [pageIndex]: [...(current[pageIndex] || []), annotation]
    });
  };

  const undo = () => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setFuture(f => [annRef.current, ...f]);
    annRef.current = previous;
    setAnnotations(previous);
    setPast(p => p.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setPast(p => [...p, annRef.current]);
    annRef.current = next;
    setAnnotations(next);
    setFuture(f => f.slice(1));
  };
  const clearPage = () => {
    if (!(annRef.current[currentPage] || []).length) return;
    commit({ ...annRef.current, [currentPage]: [] });
  };

  const total = Object.values(annotations).reduce(
    (n, list) => n + (list?.length || 0),
    0
  );

  const startTyping = next => {
    typingRef.current = next;
    setTyping(next);
  };

  // o blur do campo e o toque seguinte chegam juntos: só o primeiro grava
  const finishTyping = cancel => {
    const current = typingRef.current;
    if (!current) return;
    typingRef.current = null;
    const value = current.value.trim();
    if (cancel !== true && value) {
      addTo(current.page, {
        id: nextId(),
        type: "text",
        x: current.x,
        y: current.y,
        text: value,
        color: current.color
      });
    }
    setTyping(null);
  };

  const pointOf = (e, page) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) / rect.width) * BASE,
      ((e.clientY - rect.top) / rect.height) * BASE * page.aspect
    ];
  };

  const eraseAt = (e, pageIndex) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const id = el?.getAttribute?.("data-ann");
    if (!id) return;
    const list = annRef.current[pageIndex] || [];
    if (!list.some(item => item.id === id)) return;
    commit({
      ...annRef.current,
      [pageIndex]: list.filter(item => item.id !== id)
    });
  };

  const onPointer = (phase, e, pageIndex, page) => {
    if (tool === "pan") return;
    const [x, y] = pointOf(e, page);

    if (tool === "eraser") {
      if (phase === "down") {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        drawing.current = { eraser: true };
      }
      if (phase === "up") drawing.current = null;
      if (phase === "down" || (phase === "move" && drawing.current?.eraser))
        eraseAt(e, pageIndex);
      return;
    }

    if (tool === "text") {
      if (phase === "down") {
        e.preventDefault();
        finishTyping();
        startTyping({
          page: pageIndex,
          x,
          y: Math.max(0, y - TEXT_SIZE / 2),
          value: "",
          color: colors.text
        });
      }
      return;
    }

    if (phase === "down") {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      const color = colors[tool];
      let shape;
      if (tool === "pen")
        shape = { type: "pen", color, size: SIZES[size], points: [[x, y]] };
      if (tool === "highlight")
        shape = { type: "highlight", color, x0: x, y0: y, x1: x, y1: y };
      if (tool === "underline" || tool === "strike")
        shape = { type: tool, color, x0: x, y0: y, x1: x };
      shape.id = nextId();
      drawing.current = { pageIndex, shape };
      setDraft(shape);
      return;
    }

    const current = drawing.current;
    if (!current || current.pageIndex !== pageIndex || !current.shape) return;
    const shape = current.shape;

    if (phase === "move") {
      let next = shape;
      if (shape.type === "pen") {
        const last = shape.points[shape.points.length - 1];
        if (Math.hypot(x - last[0], y - last[1]) < 1.2) return;
        next = { ...shape, points: [...shape.points, [x, y]] };
      } else if (shape.type === "highlight") {
        next = { ...shape, x1: x, y1: y };
      } else {
        next = { ...shape, x1: x };
      }
      current.shape = next;
      setDraft(next);
      return;
    }

    // up: guarda se tiver tamanho
    drawing.current = null;
    setDraft(null);
    const keep =
      shape.type === "pen"
        ? shape.points.length > 0
        : shape.type === "highlight"
          ? normRect(shape).w > 4 && normRect(shape).h > 4
          : Math.abs(shape.x1 - shape.x0) > 4;
    if (keep) addTo(pageIndex, shape);
  };

  const build = async () => {
    const current = annRef.current;
    const count = Object.values(current).reduce(
      (n, list) => n + (list?.length || 0),
      0
    );
    if (!count) {
      // nada anotado: o próprio arquivo
      const blob = await fetch(src).then(r => r.blob());
      return new File(
        [blob],
        fileName || (kind === "pdf" ? "documento.pdf" : "imagem.png"),
        { type: blob.type }
      );
    }
    return kind === "pdf"
      ? exportPdf({ src, name: fileName, annotations: current, pages })
      : exportImage({ src, name: fileName, annotations: current });
  };

  const run = async action => {
    finishTyping();
    setBusy(true);
    try {
      const file = await build();
      await action(file);
    } catch (err) {
      toastError(err);
    }
    setBusy(false);
  };

  const download = () =>
    run(async file => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    });

  const sendToChat = () =>
    run(async file => {
      const form = new FormData();
      form.append("fromMe", true);
      form.append("medias", file, file.name);
      form.append("body", file.name);
      await api.post(`/messages/${ticketId}`, form);
      toast.success(i18n.t("annotator.sent"), { autoClose: 1800 });
      onClose();
    });

  const save = () =>
    run(async file => {
      onSave(file);
      onClose();
    });

  // atalhos no computador
  useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.target.tagName === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const zoomBy = step => {
    const i = ZOOMS.indexOf(zoom);
    const next =
      ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, (i === -1 ? 2 : i) + step))];
    setZoom(next);
  };

  const a = key => i18n.t(`annotator.${key}`);
  const colored = COLORED.includes(tool);

  const toolbar = (
    <div className={classes.toolbar} role="toolbar">
      {TOOL_ORDER.map(key => (
        <ButtonBase
          key={key}
          className={`${classes.tool}${tool === key ? ` ${classes.toolOn}` : ""}`}
          onClick={() => {
            finishTyping();
            setTool(key);
          }}
          aria-pressed={tool === key}
        >
          {TOOL_ICONS[key]}
          {a(`tools.${key}`)}
        </ButtonBase>
      ))}
      <span className={classes.sep} />
      <Tooltip title={a("undo")}>
        <span>
          <IconButton
            className={classes.iconBtn}
            onClick={undo}
            disabled={!past.length}
          >
            <UndoRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={a("redo")}>
        <span>
          <IconButton
            className={classes.iconBtn}
            onClick={redo}
            disabled={!future.length}
          >
            <RedoRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={a("clear")}>
        <span>
          <IconButton
            className={classes.iconBtn}
            onClick={clearPage}
            disabled={!(annotations[currentPage] || []).length}
          >
            <DeleteSweepOutlinedIcon />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );

  const options = colored && (
    <div className={classes.options}>
      {COLORS.map(color => (
        <ButtonBase
          key={color}
          className={`${classes.swatch}${colors[tool] === color ? ` ${classes.swatchOn}` : ""}`}
          style={{ backgroundColor: color }}
          onClick={() => setColors(c => ({ ...c, [tool]: color }))}
          aria-label={color}
        />
      ))}
      {tool === "pen" && (
        <>
          <span className={classes.sep} style={{ height: 22 }} />
          {Object.entries(SIZES).map(([key, value]) => (
            <ButtonBase
              key={key}
              className={`${classes.size}${size === key ? ` ${classes.sizeOn}` : ""}`}
              onClick={() => setSize(key)}
              aria-label={a(`sizes.${key}`)}
            >
              <span style={{ width: value + 3, height: value + 3 }} />
            </ButtonBase>
          ))}
        </>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      classes={{ paper: classes.paper }}
    >
      <div className={classes.top}>
        <IconButton
          className={classes.iconBtn}
          onClick={onClose}
          aria-label={i18n.t("common.close")}
        >
          <CloseRoundedIcon />
        </IconButton>
        <span className={classes.name}>{fileName || a("title")}</span>
        {pages.length > 1 && (
          <span className={classes.pageInfo}>
            {currentPage + 1} / {pages.length}
          </span>
        )}
        <div className={classes.zoom}>
          <IconButton
            className={classes.iconBtn}
            onClick={() => zoomBy(-1)}
            disabled={zoom <= ZOOMS[0]}
          >
            <ZoomOutRoundedIcon />
          </IconButton>
          <ButtonBase className={classes.zoomLabel} onClick={() => setZoom(1)}>
            {Math.round(zoom * 100)}%
          </ButtonBase>
          <IconButton
            className={classes.iconBtn}
            onClick={() => zoomBy(1)}
            disabled={zoom >= ZOOMS[ZOOMS.length - 1]}
          >
            <ZoomInRoundedIcon />
          </IconButton>
        </div>
        <Tooltip title={total ? a("downloadAnnotated") : a("download")}>
          <span>
            <IconButton
              className={classes.iconBtn}
              onClick={download}
              disabled={busy || status !== "ready"}
            >
              <GetAppRoundedIcon />
            </IconButton>
          </span>
        </Tooltip>
        {onSave ? (
          <Button
            variant="contained"
            color="primary"
            className={classes.primary}
            startIcon={
              busy ? (
                <BoxLoader size={18} color="currentColor" />
              ) : (
                <CheckRoundedIcon />
              )
            }
            onClick={save}
            disabled={busy || status !== "ready"}
          >
            <span className="label">{a("done")}</span>
          </Button>
        ) : (
          ticketId && (
            <Button
              variant="contained"
              color="primary"
              className={classes.primary}
              startIcon={
                busy ? (
                  <BoxLoader size={18} color="currentColor" />
                ) : (
                  <SendRoundedIcon />
                )
              }
              onClick={sendToChat}
              disabled={busy || status !== "ready" || !total}
            >
              <span className="label">{a("send")}</span>
            </Button>
          )
        )}
      </div>

      {toolbar}
      {options}

      <div ref={stageRef} className={classes.stage} onScroll={onScroll}>
        {status === "loading" && (
          <div className={classes.center}>
            <BoxLoader color="#FFFFFF" />
          </div>
        )}
        {status === "error" && (
          <div className={classes.center}>{a("error")}</div>
        )}
        {status === "ready" &&
          pages.map((page, index) => (
            <Page
              key={index}
              page={page}
              index={index}
              width={fitWidth(page)}
              tool={tool}
              annotations={annotations[index] || []}
              draft={
                draft && drawing.current?.pageIndex === index ? draft : null
              }
              typing={typing}
              onPointer={onPointer}
              onTypingChange={value => {
                if (!typingRef.current) return;
                startTyping({ ...typingRef.current, value });
              }}
              onTypingDone={finishTyping}
              registerPage={registerPage}
              classes={classes}
            />
          ))}
      </div>
    </Dialog>
  );
};

export default DocumentAnnotator;
