import React, { useEffect, useState } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import DirectionsRoundedIcon from "@material-ui/icons/DirectionsRounded";
import OpenInNewRoundedIcon from "@material-ui/icons/OpenInNewRounded";
import RoomRoundedIcon from "@material-ui/icons/RoomRounded";

/**
 * Localização no jeito do WhatsApp: um cartão com o mapa de verdade e o
 * pino no lugar, e ao tocar abre o mapa grande. Localização em tempo real
 * ganha o selo "ao vivo" e o mapa acompanha a posição mais recente enviada
 * pela pessoa enquanto ela estiver compartilhando.
 */
const ZOOM = 16;

const tileFor = (lat, lon, zoom = ZOOM) => {
  const n = 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const rad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n;
  return {
    x: Math.floor(x),
    y: Math.floor(y),
    // posição do ponto dentro do quadradinho do mapa (0..1)
    fx: x - Math.floor(x),
    fy: y - Math.floor(y)
  };
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    card: {
      display: "block",
      width: 280,
      maxWidth: "100%",
      margin: "-2px -2px 18px",
      borderRadius: 12,
      overflow: "hidden",
      cursor: "pointer",
      backgroundColor: t.surfaceSunken,
      transition: "transform .15s ease",
      "&:active": { transform: "scale(0.98)" }
    },
    map: {
      position: "relative",
      height: 150,
      overflow: "hidden",
      backgroundColor: "#dfe7e1"
    },
    tiles: {
      position: "absolute",
      display: "grid",
      gridTemplateColumns: "256px 256px 256px",
      "& img": { width: 256, height: 256, display: "block" }
    },
    pin: {
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -100%)",
      color: "#ea4335",
      filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
      animation: "$drop .45s cubic-bezier(.3, 1.6, .5, 1)",
      "& svg": { fontSize: 38, display: "block" }
    },
    livePulse: {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: 18,
      height: 18,
      margin: "-9px 0 0 -9px",
      borderRadius: "50%",
      backgroundColor: "rgba(37, 211, 102, 0.9)",
      boxShadow: "0 0 0 3px #fff",
      "&::after": {
        content: '""',
        position: "absolute",
        inset: -3,
        borderRadius: "50%",
        border: "3px solid rgba(37, 211, 102, 0.8)",
        animation: "$pulse 1.8s ease-out infinite"
      }
    },
    info: { padding: "8px 10px", fontSize: 13, lineHeight: 1.35 },
    title: { fontWeight: 600 },
    sub: { color: theme.palette.text.secondary, fontSize: 12 },
    live: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 700,
      color: "#16a34a",
      "&::before": {
        content: '""',
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "#22c55e",
        animation: "$blink 1.2s ease-in-out infinite"
      }
    },
    dialogPaper: {
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.up("sm")]: {
        width: "min(860px, calc(100vw - 64px))",
        height: "min(640px, calc(var(--vh, 100vh) - 64px))",
        maxWidth: "none",
        borderRadius: 20
      }
    },
    dialogHead: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(1, 1, 1, 2),
      paddingTop: `calc(${theme.spacing(1)}px + var(--safe-top, 0px))`,
      [theme.breakpoints.up("sm")]: { paddingTop: theme.spacing(1) },
      borderBottom: `1px solid ${t.border}`
    },
    dialogTitle: { flex: 1, minWidth: 0 },
    frame: { flex: 1, border: 0, width: "100%", minHeight: 0 },
    dialogActions: {
      display: "flex",
      gap: 8,
      padding: theme.spacing(1.5, 2),
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`,
      "& .MuiButton-root": { flex: 1, borderRadius: 999, textTransform: "none" }
    },
    "@keyframes drop": {
      from: { transform: "translate(-50%, -160%)", opacity: 0 },
      to: { transform: "translate(-50%, -100%)", opacity: 1 }
    },
    "@keyframes pulse": {
      from: { transform: "scale(1)", opacity: 1 },
      to: { transform: "scale(2.6)", opacity: 0 }
    },
    "@keyframes blink": {
      "0%, 100%": { opacity: 1 },
      "50%": { opacity: 0.3 }
    }
  };
});

const SlideUp = React.forwardRef((props, ref) => (
  <Slide direction="up" ref={ref} {...props} />
));

export const readLocation = data => {
  const live = data?.message?.liveLocationMessage;
  const loc = live || data?.message?.locationMessage;
  if (!loc) return null;
  const lat = Number(loc.degreesLatitude);
  const lon = Number(loc.degreesLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon,
    live: !!live,
    name: loc.name || "",
    address: loc.address || "",
    caption: loc.caption || ""
  };
};

const MapTiles = ({ lat, lon, width = 280, height = 150 }) => {
  const classes = useStyles();
  const { x, y, fx, fy } = tileFor(lat, lon);
  // 3x3 quadradinhos centralizados no ponto exato
  const left = width / 2 - (256 + fx * 256);
  const top = height / 2 - (256 + fy * 256);
  const tiles = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      tiles.push(
        <img
          key={`${dx}:${dy}`}
          alt=""
          loading="lazy"
          src={`https://tile.openstreetmap.org/${ZOOM}/${x + dx}/${y + dy}.png`}
        />
      );
    }
  }
  return (
    <div className={classes.tiles} style={{ left, top }}>
      {tiles}
    </div>
  );
};

export const LocationDialog = ({ open, onClose, location, title }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  if (!location) return null;
  const { lat, lon } = location;
  const d = 0.004;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d}%2C${lat - d}%2C${lon + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lon}`;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      TransitionComponent={SlideUp}
      classes={{ paper: classes.dialogPaper }}
    >
      <div className={classes.dialogHead}>
        <div className={classes.dialogTitle}>
          <div className={classes.title}>
            {title || location.name || "Localização"}
          </div>
          {location.live ? (
            <span className={classes.live}>Ao vivo</span>
          ) : (
            <div className={classes.sub}>
              {location.address || `${lat.toFixed(5)}, ${lon.toFixed(5)}`}
            </div>
          )}
        </div>
        <IconButton onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>
      {/* a posição muda (ao vivo): o mapa recarrega no ponto novo */}
      <iframe
        key={`${lat},${lon}`}
        title="mapa"
        className={classes.frame}
        src={src}
      />
      <div className={classes.dialogActions}>
        <Button
          variant="outlined"
          startIcon={<OpenInNewRoundedIcon />}
          href={`https://www.google.com/maps?q=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
        >
          Google Maps
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DirectionsRoundedIcon />}
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`}
          target="_blank"
          rel="noreferrer"
        >
          Como chegar
        </Button>
      </div>
    </Dialog>
  );
};

/**
 * Cartão da mensagem. `latest` (opcional) é a posição mais nova da mesma
 * pessoa na conversa — assim o mapa aberto acompanha a localização ao vivo.
 */
const LocationMessage = ({ data, latest, contactName }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const own = readLocation(data);
  const [current, setCurrent] = useState(own);

  useEffect(() => {
    if (own?.live && latest) setCurrent(latest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.lat, latest?.lon]);

  if (!own) return null;
  const shown = own.live && current ? current : own;

  return (
    <>
      <div className={classes.card} role="button" onClick={() => setOpen(true)}>
        <div className={classes.map}>
          <MapTiles lat={shown.lat} lon={shown.lon} />
          {shown.live ? (
            <span className={classes.livePulse} />
          ) : (
            <span className={classes.pin}>
              <RoomRoundedIcon />
            </span>
          )}
        </div>
        <div className={classes.info}>
          {shown.live ? (
            <span className={classes.live}>Localização em tempo real</span>
          ) : (
            <>
              {own.name && <div className={classes.title}>{own.name}</div>}
              <div className={classes.sub}>
                {own.address || "Toque para ver no mapa"}
              </div>
            </>
          )}
        </div>
      </div>
      <LocationDialog
        open={open}
        onClose={() => setOpen(false)}
        location={shown}
        title={contactName}
      />
    </>
  );
};

export default LocationMessage;

const useSendStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      [theme.breakpoints.up("sm")]: {
        width: "min(720px, calc(100vw - 64px))",
        height: "min(640px, calc(var(--vh, 100vh) - 64px))",
        maxWidth: "none",
        borderRadius: 20
      }
    },
    head: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: theme.spacing(1, 1, 1, 2),
      paddingTop: `calc(${theme.spacing(1)}px + var(--safe-top, 0px))`,
      [theme.breakpoints.up("sm")]: { paddingTop: theme.spacing(1) },
      borderBottom: `1px solid ${t.border}`,
      fontWeight: 700
    },
    search: {
      display: "flex",
      gap: 8,
      padding: theme.spacing(1.5, 2, 1)
    },
    input: {
      flex: 1,
      minWidth: 0,
      height: 40,
      padding: "0 14px",
      borderRadius: 999,
      border: `1px solid ${t.border}`,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.primary,
      fontSize: 15,
      outline: "none",
      "&:focus": { borderColor: t.brand.main }
    },
    results: {
      maxHeight: 180,
      overflowY: "auto",
      padding: theme.spacing(0, 1)
    },
    result: {
      display: "flex",
      gap: 10,
      width: "100%",
      padding: "8px 10px",
      borderRadius: 10,
      border: "none",
      textAlign: "left",
      cursor: "pointer",
      fontSize: 13,
      color: theme.palette.text.primary,
      backgroundColor: "transparent",
      "&:hover": { backgroundColor: t.surfaceHover },
      "& svg": { color: t.brand.text, flex: "none" }
    },
    map: { flex: 1, minHeight: 220, border: 0, width: "100%" },
    placeholder: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing(3),
      textAlign: "center",
      fontSize: 14,
      color: theme.palette.text.secondary
    },
    foot: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: theme.spacing(1.5, 2),
      paddingBottom: `calc(${theme.spacing(1.5)}px + var(--safe-bottom, 0px))`,
      borderTop: `1px solid ${t.border}`
    },
    address: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  };
});

/**
 * Enviar localização: usa a posição atual do aparelho ou um endereço
 * buscado, mostra no mapa e envia como pino (localização do WhatsApp).
 */
export const SendLocationDialog = ({ open, onClose, onSend }) => {
  const classes = useSendStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [point, setPoint] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) {
      setStatus("Este navegador não permite pegar a localização.");
      return;
    }
    setStatus("Buscando sua localização…");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setPoint({ lat, lon, name: "Minha localização", address: "" });
        setStatus("");
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=pt-BR`
          );
          const j = await r.json();
          if (j?.display_name) {
            setPoint(p => (p ? { ...p, address: j.display_name } : p));
          }
        } catch (e) {
          // sem endereço: vai só o pino
        }
      },
      () =>
        setStatus(
          "Não foi possível pegar sua localização. Permita o acesso ou busque um endereço."
        ),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!open) return;
    setPoint(null);
    setResults([]);
    setQuery("");
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 3) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&accept-language=pt-BR&q=${encodeURIComponent(term)}`
        );
        const list = await r.json();
        setResults(Array.isArray(list) ? list : []);
      } catch (e) {
        setResults([]);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const send = async () => {
    if (!point) return;
    setSending(true);
    try {
      await onSend(point);
      onClose();
    } finally {
      setSending(false);
    }
  };

  const d = 0.004;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      TransitionComponent={SlideUp}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.head}>
        <span style={{ flex: 1 }}>Enviar localização</span>
        <IconButton onClick={onClose} aria-label="Fechar">
          <CloseRoundedIcon />
        </IconButton>
      </div>
      <div className={classes.search}>
        <input
          className={classes.input}
          placeholder="Buscar endereço ou lugar…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Button
          variant="outlined"
          color="primary"
          onClick={locate}
          style={{ borderRadius: 999, textTransform: "none" }}
        >
          📍 Atual
        </Button>
      </div>
      {results.length > 0 && (
        <div className={classes.results}>
          {results.map(item => (
            <button
              type="button"
              key={item.place_id}
              className={classes.result}
              onClick={() => {
                setPoint({
                  lat: Number(item.lat),
                  lon: Number(item.lon),
                  name: String(item.display_name || "").split(",")[0],
                  address: item.display_name
                });
                setResults([]);
                setQuery("");
              }}
            >
              <RoomRoundedIcon fontSize="small" />
              {item.display_name}
            </button>
          ))}
        </div>
      )}
      {point ? (
        <iframe
          key={`${point.lat},${point.lon}`}
          title="mapa"
          className={classes.map}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${point.lon - d}%2C${point.lat - d}%2C${point.lon + d}%2C${point.lat + d}&layer=mapnik&marker=${point.lat}%2C${point.lon}`}
        />
      ) : (
        <div className={classes.placeholder}>
          {status || "Busque um endereço ou use a localização atual."}
        </div>
      )}
      <div className={classes.foot}>
        <span className={classes.address}>
          {point?.address ||
            (point ? `${point.lat.toFixed(5)}, ${point.lon.toFixed(5)}` : "")}
        </span>
        <Button
          variant="contained"
          color="primary"
          disabled={!point || sending}
          onClick={send}
          style={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
        >
          Enviar
        </Button>
      </div>
    </Dialog>
  );
};
