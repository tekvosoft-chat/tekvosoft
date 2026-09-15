import React, { useEffect, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import InputBase from "@material-ui/core/InputBase";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import { Picker } from "emoji-mart";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../ui/BoxLoader";
import { i18n } from "../../translate/i18n";

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
    root: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      height: 340,
      backgroundColor: t.chat.bar,
      borderTop: `1px solid ${t.border}`,
      [theme.breakpoints.down("xs")]: { height: 300 }
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

const ExpressionPanel = ({ ticketId, showEmoji, onEmoji, disabled }) => {
  const classes = useStyles();
  const [tab, setTab] = useState(showEmoji ? "emoji" : "stickers");
  const [stickers, setStickers] = useState(null);
  const [gifs, setGifs] = useState(null);
  const [configured, setConfigured] = useState(true);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(null);
  const timer = useRef(null);
  const t = key => i18n.t(`expressions.${key}`);

  useEffect(() => {
    if (tab !== "stickers" || stickers) return;
    api
      .get("/messages/stickers")
      .then(({ data }) => setStickers(data.stickers || []))
      .catch(() => setStickers([]));
  }, [tab, stickers]);

  useEffect(() => {
    if (tab !== "gifs") return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => {
        setGifs(null);
        api
          .get("/gifs/search", { params: { q: query } })
          .then(({ data }) => {
            setConfigured(data.configured !== false);
            setGifs(data.gifs || []);
          })
          .catch(() => setGifs([]));
      },
      query ? 400 : 0
    );
    return () => clearTimeout(timer.current);
  }, [tab, query]);

  const send = async payload => {
    if (disabled || sending) return;
    setSending(payload.stickerMessageId || payload.gifId);
    try {
      await api.post(`/messages/${ticketId}/expression`, payload);
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

  return (
    <div className={classes.root}>
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

      <div className={classes.body}>
        {tab === "emoji" && (
          <Picker
            perLine={10}
            showPreview={false}
            showSkinTones={false}
            onSelect={emoji => onEmoji(emoji)}
          />
        )}

        {tab === "stickers" &&
          (stickers === null ? (
            <div className={classes.center}>
              <BoxLoader size={48} />
            </div>
          ) : stickers.length === 0 ? (
            <div className={classes.empty}>{t("noStickers")}</div>
          ) : (
            <div className={classes.grid}>
              {stickers.map(s => (
                <ButtonBase
                  key={s.id}
                  className={`${classes.item}${sending ? ` ${classes.busy}` : ""}`}
                  onClick={() => send({ stickerMessageId: s.id })}
                  aria-label={t("sendSticker")}
                >
                  <img src={s.mediaUrl} alt="" loading="lazy" />
                </ButtonBase>
              ))}
            </div>
          ))}

        {tab === "gifs" && (
          <>
            {configured && (
              <label className={classes.search}>
                <SearchRoundedIcon fontSize="small" />
                <InputBase
                  fullWidth
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t("searchGifs")}
                />
              </label>
            )}
            {!configured ? (
              <div className={classes.empty}>{t("gifsNotConfigured")}</div>
            ) : gifs === null ? (
              <div className={classes.center}>
                <BoxLoader size={48} />
              </div>
            ) : gifs.length === 0 ? (
              <div className={classes.empty}>{t("noGifs")}</div>
            ) : (
              <>
                <div className={classes.gifGrid}>
                  {gifs.map(g => (
                    <ButtonBase
                      key={g.id}
                      className={`${classes.item} ${classes.gif}${sending ? ` ${classes.busy}` : ""}`}
                      onClick={() => send({ gifId: g.id })}
                      aria-label={g.title || t("sendGif")}
                    >
                      <img src={g.preview} alt={g.title} loading="lazy" />
                    </ButtonBase>
                  ))}
                </div>
                <div className={classes.powered}>GIPHY</div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExpressionPanel;
