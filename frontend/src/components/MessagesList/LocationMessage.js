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
import RefreshRoundedIcon from "@material-ui/icons/RefreshRounded";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import NearMeRoundedIcon from "@material-ui/icons/NearMeRounded";
import PinDropOutlinedIcon from "@material-ui/icons/PinDropOutlined";
import ShareLocationIcon from "@material-ui/icons/WifiTetheringRounded";

/**
 * Localização no jeito do WhatsApp: um cartão com o mapa de verdade e o
 * pino no lugar, e ao tocar abre o mapa grande. Localização em tempo real
 * ganha o selo "ao vivo" e o mapa acompanha a posição mais recente enviada
 * pela pessoa enquanto ela estiver compartilhando.
 */
const ZOOM = 16;

export const googleEmbed = (lat, lon, zoom = 16) =>
  `https://maps.google.com/maps?q=${lat},${lon}&z=${zoom}&hl=pt-BR&output=embed`;

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
  // mapa do Google (incorporação gratuita, sem chave)
  const src = googleEmbed(lat, lon);
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
  const dark = theme.palette.type === "dark" || theme.mode === "dark";
  const sheet = dark ? "#1c1c1e" : "#f2f2f7";
  const group = dark ? "#2c2c2e" : "#ffffff";
  return {
    paper: {
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      backgroundColor: sheet,
      [theme.breakpoints.up("sm")]: {
        width: "min(520px, calc(100vw - 48px))",
        height: "min(820px, calc(var(--vh, 100vh) - 48px))",
        maxWidth: "none",
        borderRadius: 18
      }
    },
    top: {
      flex: "none",
      display: "grid",
      gridTemplateColumns: "88px 1fr 88px",
      alignItems: "center",
      padding: theme.spacing(1, 1.5, 0),
      paddingTop: `calc(${theme.spacing(1.5)}px + var(--safe-top, 0px))`,
      [theme.breakpoints.up("sm")]: { paddingTop: theme.spacing(1.5) }
    },
    cancel: {
      justifySelf: "start",
      padding: "6px 4px",
      border: "none",
      background: "none",
      fontSize: 16,
      color: theme.palette.text.primary,
      textDecoration: "underline",
      cursor: "pointer"
    },
    title: {
      textAlign: "center",
      fontSize: 16,
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    refresh: { justifySelf: "end", color: theme.palette.text.primary },
    searchWrap: { flex: "none", padding: theme.spacing(1.25, 1.5, 1.5) },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 38,
      padding: "0 12px",
      borderRadius: 10,
      backgroundColor: dark ? "#2c2c2e" : "#e3e3e8",
      color: theme.palette.text.secondary,
      "& input": {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: 16,
        color: theme.palette.text.primary
      }
    },
    mapBox: {
      position: "relative",
      flex: "1 1 50%",
      minHeight: 200,
      backgroundColor: dark ? "#2a3345" : "#e5e3df"
    },
    frame: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      border: 0
    },
    mapTools: {
      position: "absolute",
      top: 12,
      right: 12,
      display: "flex",
      flexDirection: "column",
      borderRadius: 10,
      overflow: "hidden",
      backgroundColor: dark ? "rgba(44,44,46,0.92)" : "rgba(255,255,255,0.95)",
      boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
      "& button": {
        width: 44,
        height: 44,
        border: "none",
        background: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: theme.palette.text.primary,
        cursor: "pointer"
      },
      "& button + button": {
        borderTop: `1px solid ${dark ? "#3a3a3c" : "#e5e5ea"}`
      }
    },
    sheet: {
      position: "relative",
      flex: "1 1 50%",
      minHeight: 0,
      marginTop: -14,
      display: "flex",
      flexDirection: "column",
      borderRadius: "14px 14px 0 0",
      backgroundColor: sheet,
      boxShadow: "0 -6px 18px rgba(0,0,0,0.18)"
    },
    grabber: {
      flex: "none",
      width: 38,
      height: 5,
      margin: "8px auto 6px",
      borderRadius: 3,
      backgroundColor: dark ? "#48484a" : "#c7c7cc"
    },
    scroll: {
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      padding: theme.spacing(0.5, 1.5),
      paddingBottom: `calc(${theme.spacing(2)}px + var(--safe-bottom, 0px))`
    },
    group: {
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: group
    },
    row: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      minHeight: 56,
      padding: "8px 14px",
      border: "none",
      background: "none",
      textAlign: "left",
      cursor: "pointer",
      color: theme.palette.text.primary,
      transition: "background-color .12s ease",
      "&:active, &:hover": { backgroundColor: dark ? "#3a3a3c" : "#ececf0" },
      "&:disabled": { cursor: "default", opacity: 0.55 }
    },
    rowDivider: {
      "& + $rowDivider": {
        borderTop: `1px solid ${dark ? "#3a3a3c" : "#e5e5ea"}`
      }
    },
    rowIcon: {
      flex: "none",
      width: 36,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.palette.text.primary,
      "& svg": { fontSize: 26 }
    },
    ringIcon: {
      width: 30,
      height: 30,
      borderRadius: "50%",
      border: `2.5px solid ${theme.palette.text.primary}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "&::after": {
        content: '""',
        width: 14,
        height: 14,
        borderRadius: "50%",
        backgroundColor: theme.palette.text.primary
      }
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: 16,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    rowSub: {
      fontSize: 13,
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    sectionLabel: {
      padding: theme.spacing(2.25, 1.5, 0.75),
      fontSize: 15,
      fontWeight: 600,
      color: theme.palette.text.secondary
    },
    note: {
      padding: theme.spacing(2),
      textAlign: "center",
      fontSize: 13,
      color: theme.palette.text.secondary
    },
    sending: { opacity: 0.6, pointerEvents: "none" }
  };
});

const haversine = (a, b) => {
  const R = 6371000;
  const toRad = v => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const addressOf = tags =>
  [
    [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(", "),
    tags["addr:suburb"],
    tags["addr:city"]
  ]
    .filter(Boolean)
    .join(" - ");

// lugares por perto (lojas, restaurantes, serviços) pelo OpenStreetMap
const fetchNearby = async ({ lat, lon }) => {
  const query = `[out:json][timeout:10];(node(around:350,${lat},${lon})[name][~"^(amenity|shop|office|tourism|leisure|healthcare)$"~"."];);out 25;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`
  });
  const json = await response.json();
  return (json?.elements || [])
    .map(el => ({
      lat: el.lat,
      lon: el.lon,
      name: el.tags?.name,
      address: addressOf(el.tags || {}),
      distance: haversine({ lat, lon }, { lat: el.lat, lon: el.lon })
    }))
    .filter(p => p.name)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 15);
};

/**
 * Enviar localização, no desenho do WhatsApp: mapa em cima, busca no topo e
 * a lista embaixo com a localização atual e os lugares próximos. Tocar num
 * item já envia.
 */
export const SendLocationDialog = ({ open, onClose, onSend }) => {
  const classes = useSendStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [here, setHere] = useState(null);
  const [focus, setFocus] = useState(null);
  const [nearby, setNearby] = useState([]);
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
      pos => {
        const point = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy || 0)
        };
        setHere(point);
        setFocus(point);
        setStatus("");
        fetchNearby(point)
          .then(setNearby)
          .catch(() => setNearby([]));
      },
      () =>
        setStatus(
          "Não foi possível pegar sua localização. Permita o acesso ou pesquise um endereço."
        ),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!open) return;
    setHere(null);
    setFocus(null);
    setNearby([]);
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
        const near = here
          ? `&viewbox=${here.lon - 0.3},${here.lat + 0.3},${here.lon + 0.3},${here.lat - 0.3}`
          : "";
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&accept-language=pt-BR&q=${encodeURIComponent(term)}${near}`
        );
        const list = await r.json();
        setResults(
          (Array.isArray(list) ? list : []).map(item => ({
            lat: Number(item.lat),
            lon: Number(item.lon),
            name: String(item.display_name || "").split(",")[0],
            address: String(item.display_name || "")
              .split(",")
              .slice(1, 4)
              .join(",")
              .trim()
          }))
        );
      } catch (e) {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, here]);

  const send = async point => {
    if (!point || sending) return;
    setFocus(point);
    setSending(true);
    try {
      await onSend(point);
      onClose();
    } catch (e) {
      // o erro já aparece no aviso
    } finally {
      setSending(false);
    }
  };

  const list = query.trim().length >= 3 ? results : nearby;
  const center = focus || here;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isPhone}
      TransitionComponent={SlideUp}
      classes={{ paper: classes.paper }}
    >
      <div className={classes.top}>
        <button type="button" className={classes.cancel} onClick={onClose}>
          Cancelar
        </button>
        <div className={classes.title}>Enviar localização</div>
        <IconButton
          className={classes.refresh}
          onClick={locate}
          aria-label="Atualizar"
        >
          <RefreshRoundedIcon />
        </IconButton>
      </div>

      <div className={classes.searchWrap}>
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <input
            placeholder="Pesquise ou insira um endereço"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
      </div>

      <div className={classes.mapBox}>
        {center && (
          <iframe
            key={`${center.lat},${center.lon}`}
            title="mapa"
            className={classes.frame}
            src={googleEmbed(center.lat, center.lon, 17)}
          />
        )}
        <div className={classes.mapTools}>
          <button
            type="button"
            aria-label="Abrir no Google Maps"
            onClick={() =>
              center &&
              window.open(
                `https://www.google.com/maps?q=${center.lat},${center.lon}`,
                "_blank"
              )
            }
          >
            <InfoOutlinedIcon />
          </button>
          <button
            type="button"
            aria-label="Minha localização"
            onClick={() => (here ? setFocus(here) : locate())}
          >
            <NearMeRoundedIcon />
          </button>
        </div>
      </div>

      <div
        className={`${classes.sheet}${sending ? ` ${classes.sending}` : ""}`}
      >
        <span className={classes.grabber} />
        <div className={classes.scroll}>
          <div className={classes.group}>
            <button type="button" className={classes.row} disabled>
              <span className={classes.rowIcon}>
                <ShareLocationIcon />
              </span>
              <span className={classes.rowText}>
                <span className={classes.rowTitle} style={{ display: "block" }}>
                  Compartilhar localização em tempo real
                </span>
                <span className={classes.rowSub} style={{ display: "block" }}>
                  Disponível só no app do WhatsApp
                </span>
              </span>
            </button>
          </div>

          <div className={classes.sectionLabel}>
            {query.trim().length >= 3 ? "Resultados" : "Locais próximos"}
          </div>
          <div className={classes.group}>
            {!query.trim() && (
              <button
                type="button"
                className={`${classes.row} ${classes.rowDivider}`}
                disabled={!here}
                onClick={() =>
                  send({ ...here, name: "Localização atual", address: "" })
                }
              >
                <span className={classes.rowIcon}>
                  <span className={classes.ringIcon} />
                </span>
                <span className={classes.rowText}>
                  <span
                    className={classes.rowTitle}
                    style={{ display: "block" }}
                  >
                    Localização atual
                  </span>
                  <span className={classes.rowSub} style={{ display: "block" }}>
                    {here
                      ? `Precisão de ${here.accuracy}m`
                      : status || "Buscando…"}
                  </span>
                </span>
              </button>
            )}
            {list.map(place => (
              <button
                type="button"
                key={`${place.lat},${place.lon},${place.name}`}
                className={`${classes.row} ${classes.rowDivider}`}
                onMouseEnter={() => !isPhone && setFocus(place)}
                onClick={() => send(place)}
              >
                <span className={classes.rowIcon}>
                  <PinDropOutlinedIcon />
                </span>
                <span className={classes.rowText}>
                  <span
                    className={classes.rowTitle}
                    style={{ display: "block" }}
                  >
                    {place.name}
                  </span>
                  <span className={classes.rowSub} style={{ display: "block" }}>
                    {place.address ||
                      (place.distance
                        ? `a ${Math.round(place.distance)} m`
                        : "")}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {query.trim().length >= 3 && results.length === 0 && (
            <div className={classes.note}>Nenhum lugar encontrado</div>
          )}
        </div>
      </div>
    </Dialog>
  );
};
