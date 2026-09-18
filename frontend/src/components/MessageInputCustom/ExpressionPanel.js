import React, { useContext, useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import InputBase from "@material-ui/core/InputBase";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import { Picker } from "emoji-mart";
import { emojiMartI18n } from "../../helpers/emojiMartI18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../ui/BoxLoader";
import { i18n } from "../../translate/i18n";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";

/**
 * Painel de expressões, como o do WhatsApp: emoji, figurinhas e GIFs.
 *
 * Figurinhas: as que já apareceram nas conversas da empresa. GIFs: busca no
 * GIPHY (a chave fica em Configurações > Serviços externos). Tocar em uma
 * figurinha ou GIF envia na hora para o atendimento aberto.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    // no celular o painel ocupa o lugar do teclado (não cobre a conversa)
    compact: {
      height: 320,
      backgroundColor: `${t.chat.bar} !important`,
      borderTop: `1px solid ${t.border}`,
      "& $search": { margin: "4px 10px 8px" },
      "& $body": { padding: "0 8px 10px" },
      // figurinhas em 4 colunas e GIFs em 3, sempre quadradinhos
      "& $grid": { gridTemplateColumns: "repeat(4, 1fr)", gap: 4 },
      "& $gifGrid": { gridTemplateColumns: "repeat(3, 1fr)", gap: 4 },
      "& $item": { borderRadius: 8 },
      "& $tabs": { justifyContent: "flex-start", padding: "8px 10px 4px" }
    },
    root: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      height: 400,
      backgroundColor: t.surface,
      [theme.breakpoints.down("xs")]: {
        height: "calc(var(--vh, 100vh) * 0.6)",
        backgroundColor: "transparent"
      }
    },
    tabs: {
      flex: "none",
      display: "flex",
      justifyContent: "center",
      gap: 4,
      padding: "8px 8px 4px"
    },
    tab: {
      padding: "6px 16px",
      borderRadius: t.radius.pill,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.chat.icon
    },
    tabOn: { backgroundColor: t.brand.textSoft, color: t.brand.text },
    body: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: "4px 10px 10px",
      ...theme.scrollbarStyles,
      "& .emoji-mart": {
        width: "100% !important",
        border: "none",
        background: "transparent"
      }
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: "4px 0 10px",
      padding: "4px 12px",
      borderRadius: t.radius.pill,
      backgroundColor: t.chat.input,
      color: t.chat.icon
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
      gap: 6
    },
    gifGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
      gap: 6
    },
    item: {
      position: "relative",
      width: "100%",
      paddingTop: "100%",
      borderRadius: 10,
      overflow: "hidden",
      "&:hover": { backgroundColor: t.surfaceHover },
      "& img": {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain"
      }
    },
    gif: { "& img": { objectFit: "cover" } },
    busy: { opacity: 0.4, pointerEvents: "none" },
    empty: {
      padding: theme.spacing(4, 2),
      textAlign: "center",
      fontSize: "0.875rem",
      color: t.chat.meta
    },
    center: { display: "flex", justifyContent: "center", padding: 24 },
    powered: {
      marginTop: 8,
      textAlign: "right",
      fontSize: "0.6875rem",
      color: t.chat.meta
    }
  };
});

const ExpressionPanel = ({
  ticketId,
  showEmoji,
  onEmoji,
  disabled,
  compact
}) => {
  const classes = useStyles();
  const [tab, setTab] = useState(showEmoji ? "emoji" : "stickers");
  const [stickers, setStickers] = useState(null);
  const [remote, setRemote] = useState({ stickers: null, gifs: null });
  const [configured, setConfigured] = useState({ stickers: true, gifs: true });
  const [provider, setProvider] = useState("");
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(null);
  const { replyingMessage, setReplyingMessage } =
    useContext(ReplyMessageContext);
  const timer = useRef(null);
  const t = key => i18n.t(`expressions.${key}`);

  // figurinhas que já apareceram nas conversas da empresa
  useEffect(() => {
    if (tab !== "stickers" || stickers) return;
    api
      .get("/messages/stickers")
      .then(({ data }) => setStickers(data.stickers || []))
      .catch(() => setStickers([]));
  }, [tab, stickers]);

  // acervo do KLIPY (ou GIPHY, nos GIFs, quando não há chave do KLIPY)
  useEffect(() => {
    if (tab === "emoji") return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        setRemote(prev => ({ ...prev, [tab]: null }));
        api
          .get("/expressions/search", { params: { kind: tab, q: query } })
          .then(({ data }) => {
            setConfigured(prev => ({
              ...prev,
              [tab]: data.configured !== false
            }));
            setProvider(data.provider || "");
            setRemote(prev => ({ ...prev, [tab]: data.items || [] }));
          })
          .catch(() => setRemote(prev => ({ ...prev, [tab]: [] })));
      },
      query ? 400 : 0
    );
    return () => clearTimeout(timer.current);
  }, [tab, query]);

  const send = async payload => {
    if (disabled || sending) return;
    setSending(payload.stickerMessageId || payload.gifId);
    try {
      // vai junto a mensagem que está sendo respondida (antes a figurinha
      // e o GIF saíam soltos, sem a citação)
      await api.post(`/messages/${ticketId}/expression`, {
        ...payload,
        quotedMsgId: replyingMessage?.id
      });
      if (replyingMessage) setReplyingMessage(null);
    } catch (err) {
      toastError(err);
    }
    setSending(null);
  };

  const tabs = [
    ...(showEmoji ? [["emoji", t("emoji")]] : []),
    ["stickers", t("stickers")],
    ["gifs", t("gifs")]
  ];

  const onlineItems = remote[tab];
  const ownStickers = tab === "stickers" ? stickers || [] : [];
  const loading = tab !== "emoji" && onlineItems === null;
  const empty =
    !loading && (onlineItems || []).length === 0 && ownStickers.length === 0;

  return (
    <div className={`${classes.root}${compact ? ` ${classes.compact}` : ""}`}>
      <div className={classes.tabs} role="tablist">
        {tabs.map(([key, label]) => (
          <ButtonBase
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`${classes.tab}${tab === key ? ` ${classes.tabOn}` : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
          </ButtonBase>
        ))}
      </div>

      {tab !== "emoji" && (
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={tab === "gifs" ? t("searchGifs") : t("searchStickers")}
          />
        </label>
      )}

      <div className={classes.body}>
        {tab === "emoji" && (
          <Picker
            i18n={emojiMartI18n()}
            perLine={10}
            showPreview={false}
            showSkinTones={false}
            onSelect={emoji => onEmoji(emoji)}
          />
        )}

        {tab !== "emoji" && (
          <>
            {loading ? (
              <div className={classes.center}>
                <BoxLoader size={48} />
              </div>
            ) : empty ? (
              <div className={classes.empty}>
                {tab === "gifs"
                  ? configured.gifs
                    ? t("noGifs")
                    : t("gifsNotConfigured")
                  : t("noStickers")}
              </div>
            ) : (
              <>
                <div
                  className={tab === "gifs" ? classes.gifGrid : classes.grid}
                >
                  {ownStickers.map(item => (
                    <ButtonBase
                      key={item.id}
                      className={`${classes.item}${sending ? ` ${classes.busy}` : ""}`}
                      onClick={() => send({ stickerMessageId: item.id })}
                      aria-label={t("sendSticker")}
                    >
                      <img src={item.mediaUrl} alt="" loading="lazy" />
                    </ButtonBase>
                  ))}
                  {(onlineItems || []).map(item => (
                    <ButtonBase
                      key={item.id}
                      className={`${classes.item}${tab === "gifs" ? ` ${classes.gif}` : ""}${sending ? ` ${classes.busy}` : ""}`}
                      onClick={() => send({ gifId: item.id })}
                      aria-label={item.title || t("sendGif")}
                    >
                      <img src={item.preview} alt={item.title} loading="lazy" />
                    </ButtonBase>
                  ))}
                </div>
                {provider && (
                  <div className={classes.powered}>
                    {provider === "klipy" ? "KLIPY" : "GIPHY"}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpressionPanel;
