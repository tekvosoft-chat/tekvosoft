import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import PhotoLibraryOutlinedIcon from "@material-ui/icons/PhotoLibraryOutlined";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import ArrowBackRoundedIcon from "@material-ui/icons/ArrowBackRounded";
import PlayCircleFilledWhiteRoundedIcon from "@material-ui/icons/PlayCircleFilledWhiteRounded";
import InsertDriveFileOutlinedIcon from "@material-ui/icons/InsertDriveFileOutlined";
import LinkRoundedIcon from "@material-ui/icons/LinkRounded";
import { Lightbox } from "react-modal-image";
import moment from "moment";

import api from "../../services/api";
import BoxLoader from "../ui/BoxLoader";
import { i18n } from "../../translate/i18n";

/**
 * "Mídia, links e docs" dos dados do contato, como no WhatsApp.
 *
 * Na tela do contato aparece a prévia (as últimas fotos e vídeos); tocando,
 * abre a galeria completa com três abas. Tudo vem de todos os atendimentos
 * do contato, mais recentes primeiro.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    head: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 14,
      minHeight: 50,
      padding: "0 12px 0 16px",
      textAlign: "left"
    },
    headIcon: {
      display: "flex",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 24 }
    },
    headLabel: { flex: 1, fontSize: "1rem", color: theme.palette.text.primary },
    headCount: { fontSize: "0.9375rem", color: theme.palette.text.secondary },
    chevron: { color: theme.palette.text.secondary, opacity: 0.6 },
    strip: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 6,
      padding: "0 12px 12px"
    },
    thumb: {
      position: "relative",
      width: "100%",
      paddingTop: "100%",
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: t.surfaceSunken,
      "& img, & video": {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    },
    play: {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      color: "rgba(255, 255, 255, 0.92)",
      fontSize: 30,
      filter: "drop-shadow(0 1px 3px rgba(0,0,0,.4))"
    },
    gallery: {
      position: "absolute",
      inset: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      backgroundColor: theme.palette.background.default,
      animation: "$in .22s ease-out"
    },
    "@keyframes in": {
      from: { transform: "translateX(24px)", opacity: 0 },
      to: { transform: "translateX(0)", opacity: 1 }
    },
    galleryTop: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 8,
      minHeight: 56,
      padding: "0 8px",
      borderBottom: `1px solid ${t.border}`
    },
    tabs: {
      flex: "none",
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      borderBottom: `1px solid ${t.border}`
    },
    tab: {
      height: 44,
      fontSize: "0.875rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      borderBottom: "3px solid transparent"
    },
    tabOn: { color: t.brand.text, borderBottomColor: t.brand.text },
    galleryBody: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: 8,
      ...theme.scrollbarStyles
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
      gap: 4
    },
    row: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 8px",
      borderRadius: 8,
      textAlign: "left",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    rowIcon: {
      flex: "none",
      width: 40,
      height: 40,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    rowMeta: { fontSize: "0.75rem", color: theme.palette.text.secondary },
    empty: {
      padding: theme.spacing(5, 2),
      textAlign: "center",
      color: theme.palette.text.secondary,
      fontSize: "0.875rem"
    },
    more: {
      display: "block",
      margin: "12px auto",
      padding: "6px 16px",
      borderRadius: 16,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: t.brand.text
    }
  };
});

const fileName = url =>
  decodeURIComponent(
    String(url || "")
      .split("/")
      .pop() || "arquivo"
  );
const firstLink = text =>
  (String(text || "").match(/https?:\/\/\S+/) || [""])[0];

const useContactMedia = (contactId, kind, enabled = true) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems([]);
    setPage(1);
  }, [contactId, kind]);

  useEffect(() => {
    if (!contactId || !enabled) return undefined;
    let alive = true;
    setLoading(true);
    api
      .get(`/contacts/${contactId}/media`, {
        params: { kind, pageNumber: page }
      })
      .then(({ data }) => {
        if (!alive) return;
        setItems(prev =>
          page === 1 ? data.messages : [...prev, ...data.messages]
        );
        setHasMore(!!data.hasMore);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [contactId, kind, page, enabled]);

  return { items, hasMore, loading, loadMore: () => setPage(p => p + 1) };
};

const Thumb = ({ item, onOpen }) => {
  const classes = useStyles();
  return (
    <ButtonBase className={classes.thumb} onClick={() => onOpen(item)}>
      {item.mediaType === "video" ? (
        <>
          <video src={item.mediaUrl} preload="metadata" muted />
          <PlayCircleFilledWhiteRoundedIcon className={classes.play} />
        </>
      ) : (
        <img src={item.mediaUrl} alt="" loading="lazy" />
      )}
    </ButtonBase>
  );
};

const Gallery = ({ contactId, onClose, onOpen }) => {
  const classes = useStyles();
  const [kind, setKind] = useState("media");
  const { items, hasMore, loading, loadMore } = useContactMedia(
    contactId,
    kind
  );
  const t = key => i18n.t(`contactDrawer.media.${key}`);

  return (
    <div className={classes.gallery}>
      <div className={classes.galleryTop}>
        <IconButton onClick={onClose} aria-label={i18n.t("common.back")}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <Typography style={{ fontWeight: 600 }}>{t("title")}</Typography>
      </div>
      <div className={classes.tabs} role="tablist">
        {["media", "docs", "links"].map(k => (
          <ButtonBase
            key={k}
            role="tab"
            aria-selected={kind === k}
            className={`${classes.tab}${kind === k ? ` ${classes.tabOn}` : ""}`}
            onClick={() => setKind(k)}
          >
            {t(k)}
          </ButtonBase>
        ))}
      </div>
      <div className={classes.galleryBody}>
        {kind === "media" && (
          <div className={classes.grid}>
            {items.map(item => (
              <Thumb key={item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        )}
        {kind === "docs" &&
          items.map(item => (
            <ButtonBase
              key={item.id}
              component="a"
              href={item.mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.row}
            >
              <span className={classes.rowIcon}>
                <InsertDriveFileOutlinedIcon />
              </span>
              <span className={classes.rowText}>
                <span className={classes.rowTitle} style={{ display: "block" }}>
                  {fileName(item.mediaUrl)}
                </span>
                <span className={classes.rowMeta}>
                  {moment(item.createdAt).format("DD/MM/YYYY HH:mm")}
                </span>
              </span>
            </ButtonBase>
          ))}
        {kind === "links" &&
          items.map(item => (
            <ButtonBase
              key={item.id}
              component="a"
              href={firstLink(item.body)}
              target="_blank"
              rel="noopener noreferrer"
              className={classes.row}
            >
              <span className={classes.rowIcon}>
                <LinkRoundedIcon />
              </span>
              <span className={classes.rowText}>
                <span className={classes.rowTitle} style={{ display: "block" }}>
                  {firstLink(item.body)}
                </span>
                <span className={classes.rowMeta}>
                  {moment(item.createdAt).format("DD/MM/YYYY HH:mm")}
                </span>
              </span>
            </ButtonBase>
          ))}
        {loading && (
          <div
            style={{ display: "flex", justifyContent: "center", padding: 24 }}
          >
            <BoxLoader size={48} />
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className={classes.empty}>{t(`empty_${kind}`)}</div>
        )}
        {!loading && hasMore && (
          <ButtonBase className={classes.more} onClick={loadMore}>
            {t("loadMore")}
          </ButtonBase>
        )}
      </div>
    </div>
  );
};

/** Prévia na tela do contato + galeria completa. */
const ContactMedia = ({ contactId, galleryHost }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [viewer, setViewer] = useState(null);
  const { items } = useContactMedia(contactId, "media");

  const openItem = item => {
    if (item.mediaType === "video") {
      window.open(item.mediaUrl, "_blank", "noopener");
    } else {
      setViewer(item.mediaUrl);
    }
  };

  return (
    <>
      <ButtonBase className={classes.head} onClick={() => setOpen(true)}>
        <span className={classes.headIcon}>
          <PhotoLibraryOutlinedIcon />
        </span>
        <span className={classes.headLabel}>
          {i18n.t("contactDrawer.media.title")}
        </span>
        {items.length > 0 && (
          <span className={classes.headCount}>
            {items.length >= 40 ? "40+" : items.length}
          </span>
        )}
        <ChevronRightRoundedIcon className={classes.chevron} />
      </ButtonBase>
      {items.length > 0 && (
        <div className={classes.strip}>
          {items.slice(0, 4).map(item => (
            <Thumb key={item.id} item={item} onOpen={openItem} />
          ))}
        </div>
      )}
      {open &&
        galleryHost(
          <Gallery
            contactId={contactId}
            onClose={() => setOpen(false)}
            onOpen={openItem}
          />
        )}
      {viewer && (
        <Lightbox
          medium={viewer}
          large={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </>
  );
};

export default ContactMedia;
