import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory, useLocation } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import UserAvatar from "../ui/UserAvatar";

const SIZE = 58;
const MARGIN = 14;

const useStyles = makeStyles(theme => ({
  head: {
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: theme.zIndex.snackbar - 1,
    width: SIZE,
    height: SIZE,
    borderRadius: "50%",
    touchAction: "none",
    userSelect: "none",
    cursor: "grab",
    "&:active": { cursor: "grabbing" }
  },
  settle: {
    transition: "transform .28s cubic-bezier(.3, 1.4, .5, 1)"
  },
  pop: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    boxShadow: "0 10px 28px rgba(0,0,0,0.35), 0 0 0 3px #fff",
    animation: "$sprout .45s cubic-bezier(.3, 1.6, .5, 1)"
  },
  avatar: { pointerEvents: "none" },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    padding: "0 5px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: "20px",
    textAlign: "center",
    color: "#fff",
    backgroundColor: "#ef4444",
    boxShadow: "0 0 0 2px #fff",
    pointerEvents: "none"
  },
  preview: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    maxWidth: 220,
    padding: "8px 12px",
    borderRadius: 16,
    fontSize: 13,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.tkv.surface,
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
    pointerEvents: "none",
    animation: "$fadeIn .25s ease",
    "& b": { fontWeight: 700 }
  },
  previewLeft: { right: SIZE + 10 },
  previewRight: { left: SIZE + 10 },
  trash: {
    position: "fixed",
    left: "50%",
    bottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
    zIndex: theme.zIndex.snackbar - 2,
    width: 56,
    height: 56,
    marginLeft: -28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    backgroundColor: "rgba(20,20,20,0.65)",
    border: "2px solid rgba(255,255,255,0.8)",
    transition: "transform .15s ease, background-color .15s ease",
    animation: "$fadeIn .2s ease",
    "& svg": { fontSize: 28 }
  },
  trashHot: { transform: "scale(1.25)", backgroundColor: "#ef4444" },
  "@keyframes sprout": {
    "0%": { transform: "scale(0)", opacity: 0 },
    "100%": { transform: "scale(1)", opacity: 1 }
  },
  "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } }
}));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const restingSpot = () => ({
  x: window.innerWidth - SIZE - MARGIN,
  // acima da barra de navegação do celular
  y: window.innerHeight - SIZE - (window.innerWidth < 600 ? 96 : 28)
});

/**
 * Balãozinho do chat interno: brota no canto inferior direito com a foto de
 * quem mandou mensagem. Dá para arrastar pela tela (gruda na borda mais
 * próxima), soltar no X para dispensar e tocar para abrir a conversa.
 */
const ChatHead = () => {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const socketManager = useContext(SocketContext);

  const [head, setHead] = useState(null);
  const [pos, setPos] = useState(restingSpot);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [bump, setBump] = useState(0);
  const drag = useRef(null);
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    const companyId = user?.companyId;
    if (!companyId || !user?.id) return undefined;
    const socket = socketManager.GetSocket(companyId);

    const onChat = data => {
      if (data?.action !== "new-message") return;
      const message = data.newMessage;
      const chat = data.chat;
      if (!message || !chat || message.senderId === user.id) return;
      // já está lendo essa conversa
      if (pathRef.current === `/chats/${chat.uuid}`) return;

      setHead(prev => ({
        uuid: chat.uuid,
        sender: message.sender || { name: chat.title },
        text: message.message || "",
        count: prev?.uuid === chat.uuid ? prev.count + 1 : 1
      }));
      setBump(b => b + 1);
      setShowPreview(true);
    };

    socket.on(`company-${companyId}-chat`, onChat);
    return () => socket.off(`company-${companyId}-chat`, onChat);
  }, [socketManager, user?.companyId, user?.id]);

  // a prévia do texto some sozinha
  useEffect(() => {
    if (!showPreview) return undefined;
    const timer = setTimeout(() => setShowPreview(false), 4500);
    return () => clearTimeout(timer);
  }, [showPreview, bump]);

  // entrou na conversa por outro caminho: o balão some
  useEffect(() => {
    if (head && location.pathname === `/chats/${head.uuid}`) setHead(null);
  }, [location.pathname, head]);

  useEffect(() => {
    const onResize = () =>
      setPos(p => ({
        x:
          p.x > window.innerWidth / 2
            ? window.innerWidth - SIZE - MARGIN
            : MARGIN,
        y: clamp(p.y, MARGIN, window.innerHeight - SIZE - MARGIN)
      }));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!head) return null;

  const trashCenter = () => ({
    x: window.innerWidth / 2,
    y: window.innerHeight - 56
  });

  const isOverTrash = (x, y) => {
    const t = trashCenter();
    return Math.hypot(x + SIZE / 2 - t.x, y + SIZE / 2 - t.y) < 70;
  };

  const onPointerDown = e => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false
    };
  };

  const onPointerMove = e => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      setShowPreview(false);
    }
    const x = clamp(d.originX + dx, 0, window.innerWidth - SIZE);
    const y = clamp(d.originY + dy, 0, window.innerHeight - SIZE);
    setPos({ x, y });
    setOverTrash(isOverTrash(x, y));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) {
      // toque: abre a conversa
      const { uuid } = head;
      setHead(null);
      history.push(`/chats/${uuid}`);
      return;
    }
    setDragging(false);
    if (overTrash) {
      setOverTrash(false);
      setHead(null);
      setPos(restingSpot());
      return;
    }
    // gruda na borda mais próxima
    setPos(p => ({
      x:
        p.x + SIZE / 2 > window.innerWidth / 2
          ? window.innerWidth - SIZE - MARGIN
          : MARGIN,
      y: clamp(p.y, MARGIN, window.innerHeight - SIZE - MARGIN)
    }));
  };

  const onRight = pos.x + SIZE / 2 > window.innerWidth / 2;

  return (
    <>
      {dragging && (
        <div
          className={`${classes.trash}${overTrash ? ` ${classes.trashHot}` : ""}`}
        >
          <CloseRoundedIcon />
        </div>
      )}
      <div
        className={`${classes.head}${dragging ? "" : ` ${classes.settle}`}`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="button"
        aria-label={head.sender?.name || ""}
      >
        {/* cada mensagem nova faz o balão "brotar" de novo */}
        <div key={bump} className={classes.pop}>
          <UserAvatar
            user={head.sender}
            size={SIZE}
            className={classes.avatar}
          />
        </div>
        {head.count > 0 && (
          <span className={classes.badge}>
            {head.count > 99 ? "99+" : head.count}
          </span>
        )}
        {showPreview && !dragging && head.text && (
          <div
            className={`${classes.preview} ${onRight ? classes.previewLeft : classes.previewRight}`}
          >
            <b>{head.sender?.name}</b>: {head.text}
          </div>
        )}
      </div>
    </>
  );
};

export default ChatHead;
