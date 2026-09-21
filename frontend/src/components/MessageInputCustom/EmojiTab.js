import React, { useEffect, useMemo, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import ButtonBase from "@material-ui/core/ButtonBase";
import Tooltip from "@material-ui/core/Tooltip";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import StarBorderRoundedIcon from "@material-ui/icons/StarBorderRounded";
import EmojiEmotionsOutlinedIcon from "@material-ui/icons/EmojiEmotionsOutlined";
import EmojiNatureOutlinedIcon from "@material-ui/icons/EmojiNatureOutlined";
import EmojiFoodBeverageOutlinedIcon from "@material-ui/icons/EmojiFoodBeverageOutlined";
import EmojiEventsOutlinedIcon from "@material-ui/icons/EmojiEventsOutlined";
import EmojiTransportationOutlinedIcon from "@material-ui/icons/EmojiTransportationOutlined";
import EmojiObjectsOutlinedIcon from "@material-ui/icons/EmojiObjectsOutlined";
import EmojiSymbolsOutlinedIcon from "@material-ui/icons/EmojiSymbolsOutlined";
import EmojiFlagsOutlinedIcon from "@material-ui/icons/EmojiFlagsOutlined";
import data from "emoji-mart/data/all.json";

import { i18n } from "../../translate/i18n";
import EMOJI_KEYWORDS_PT from "./emojiKeywordsPt";

/**
 * Aba de emojis do painel de expressões (computador). Recentes e mais
 * usados no topo, categorias com atalho na barra e busca em português ou
 * inglês. Clicar num emoji só coloca no texto; o painel continua aberto
 * para escolher mais de um.
 */

const USAGE_KEY = "emojiUsage";
const ROW = 18; // quantos aparecem em "Recentes" e em "Mais usados"
// para quem ainda não usou nenhum: os que mais aparecem nas conversas
const POPULAR = "😂 ❤️ 👍 🙏 😍 😊 🥰 😘 😅 🔥 👏 😁 🤣 ✅ 🎉 💪 😉 😢".split(
  " "
);

const CATEGORY_ICONS = {
  recent: ScheduleRoundedIcon,
  frequent: StarBorderRoundedIcon,
  people: EmojiEmotionsOutlinedIcon,
  nature: EmojiNatureOutlinedIcon,
  foods: EmojiFoodBeverageOutlinedIcon,
  activity: EmojiEventsOutlinedIcon,
  places: EmojiTransportationOutlinedIcon,
  objects: EmojiObjectsOutlinedIcon,
  symbols: EmojiSymbolsOutlinedIcon,
  flags: EmojiFlagsOutlinedIcon
};

const toNative = unified =>
  String.fromCodePoint(...unified.split("-").map(hex => parseInt(hex, 16)));

const normalize = text =>
  String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// lista única, montada uma vez: { native, name, words } por emoji.
// O emoji-mart descompacta este mesmo JSON quando carrega (os campos b, a,
// j, l viram unified, name, keywords, emoticons) e isso pode acontecer antes
// ou depois daqui — por isso lê os dois formatos.
const EMOJIS = {};
Object.entries(data.emojis).forEach(([id, e]) => {
  const unified = e.b || e.unified;
  if (!unified) return;
  const name = e.a || e.name || "";
  EMOJIS[id] = {
    native: toNative(unified),
    name: name ? name.charAt(0) + name.slice(1).toLowerCase() : id,
    words: [
      id,
      name,
      ...(e.j || e.keywords || []),
      ...(e.l || e.emoticons || [])
    ].map(normalize)
  };
});
const BY_NATIVE = {};
Object.values(EMOJIS).forEach(e => {
  BY_NATIVE[e.native] = e;
});
const CATEGORIES = data.categories.map(c => ({
  id: c.id,
  emojis: c.emojis.map(id => EMOJIS[id]).filter(Boolean)
}));

const readUsage = () => {
  try {
    const value = JSON.parse(localStorage.getItem(USAGE_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

const saveUsage = usage => {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    // sem espaço ou modo privado: só não lembra
  }
};

const search = query => {
  const q = normalize(query);
  if (!q) return [];
  const found = [];
  const seen = new Set();
  const add = native => {
    if (seen.has(native)) return;
    seen.add(native);
    found.push(BY_NATIVE[native] || { native, name: "" });
  };
  EMOJI_KEYWORDS_PT.forEach(([words, emojis]) => {
    if (words.some(w => w.startsWith(q))) emojis.forEach(add);
  });
  Object.values(EMOJIS).forEach(e => {
    if (e.words.some(w => w.startsWith(q) || (q.length > 2 && w.includes(q))))
      add(e.native);
  });
  return found.slice(0, 160);
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    nav: {
      flex: "none",
      display: "flex",
      justifyContent: "space-between",
      gap: 2,
      padding: "0 8px 6px",
      borderBottom: `1px solid ${t.border}`
    },
    navItem: {
      flex: 1,
      height: 32,
      borderRadius: 10,
      color: t.chat.meta,
      transition: "color .15s ease, background-color .15s ease",
      "& svg": { fontSize: 19 },
      "&:hover": { color: t.chat.icon, backgroundColor: t.surfaceHover }
    },
    navOn: {
      color: `${t.brand.text} !important`,
      backgroundColor: `${t.brand.textSoft} !important`
    },
    scroll: {
      flex: 1,
      minHeight: 0,
      position: "relative",
      overflowY: "auto",
      padding: "0 8px 8px",
      ...theme.scrollbarStyles
    },
    label: {
      position: "sticky",
      top: 0,
      zIndex: 1,
      padding: "10px 6px 6px",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: 0.2,
      color: t.chat.meta,
      backgroundColor: t.surface
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(38px, 1fr))",
      // categoria fora da tela não é desenhada até chegar perto
      contentVisibility: "auto",
      containIntrinsicSize: "auto 300px"
    },
    emoji: {
      height: 38,
      borderRadius: 10,
      fontSize: 25,
      lineHeight: 1,
      fontFamily:
        '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif',
      transition: "background-color .12s ease",
      "& span": { transition: "transform .15s cubic-bezier(.34, 1.4, .64, 1)" },
      "&:hover": { backgroundColor: t.surfaceHover },
      "&:hover span": { transform: "scale(1.2)" },
      "&:active span": { transform: "scale(0.9)" }
    },
    empty: {
      padding: theme.spacing(5, 2),
      textAlign: "center",
      fontSize: "0.875rem",
      color: t.chat.meta,
      "& span": { display: "block", fontSize: 34, marginBottom: 8 }
    }
  };
});

const EmojiTab = ({ query, onPick }) => {
  const classes = useStyles();
  const t = key => i18n.t(`expressions.${key}`);
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});
  const [usage, setUsage] = useState(readUsage);
  const [active, setActive] = useState(null);

  const recent = useMemo(
    () =>
      Object.entries(usage)
        .sort((a, b) => b[1].t - a[1].t)
        .slice(0, ROW)
        .map(([native]) => BY_NATIVE[native] || { native, name: "" }),
    [usage]
  );
  const frequent = useMemo(() => {
    const used = Object.entries(usage)
      .sort((a, b) => b[1].c - a[1].c || b[1].t - a[1].t)
      .map(([native]) => native);
    const list = [...used, ...POPULAR.filter(n => !used.includes(n))];
    return list.slice(0, ROW).map(n => BY_NATIVE[n] || { native: n, name: "" });
  }, [usage]);

  const sections = [
    ...(recent.length
      ? [{ id: "recent", label: t("recent"), emojis: recent }]
      : []),
    { id: "frequent", label: t("frequent"), emojis: frequent },
    ...CATEGORIES.map(c => ({ ...c, label: t(`emojiCategories.${c.id}`) }))
  ];
  const results = useMemo(() => search(query), [query]);
  const searching = !!normalize(query);

  const pick = emoji => {
    onPick({ native: emoji.native });
    setUsage(prev => {
      const next = {
        ...prev,
        [emoji.native]: {
          c: (prev[emoji.native]?.c || 0) + 1,
          t: Date.now()
        }
      };
      // guarda só os 60 mais recentes
      const trimmed = Object.fromEntries(
        Object.entries(next)
          .sort((a, b) => b[1].t - a[1].t)
          .slice(0, 60)
      );
      saveUsage(trimmed);
      return trimmed;
    });
  };

  // categoria da vez na barra, conforme rola
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    let current = sections[0]?.id;
    sections.forEach(s => {
      const node = sectionRefs.current[s.id];
      if (node && node.offsetTop <= el.scrollTop + 12) current = s.id;
    });
    setActive(current);
  };

  const jump = id => {
    const node = sectionRefs.current[id];
    if (node && scrollRef.current) {
      scrollRef.current.scrollTo({ top: node.offsetTop, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [searching]);

  const renderGrid = list => (
    <div className={classes.grid}>
      {list.map(emoji => (
        <ButtonBase
          key={emoji.native}
          className={classes.emoji}
          title={emoji.name}
          aria-label={emoji.name || emoji.native}
          onClick={() => pick(emoji)}
        >
          <span>{emoji.native}</span>
        </ButtonBase>
      ))}
    </div>
  );

  return (
    <>
      {!searching && (
        <div className={classes.nav} role="tablist">
          {sections.map(s => {
            const Icon = CATEGORY_ICONS[s.id] || EmojiSymbolsOutlinedIcon;
            return (
              <Tooltip key={s.id} title={s.label} enterDelay={400}>
                <ButtonBase
                  className={`${classes.navItem}${
                    (active || sections[0].id) === s.id
                      ? ` ${classes.navOn}`
                      : ""
                  }`}
                  onClick={() => jump(s.id)}
                  aria-label={s.label}
                >
                  <Icon />
                </ButtonBase>
              </Tooltip>
            );
          })}
        </div>
      )}
      <div className={classes.scroll} ref={scrollRef} onScroll={onScroll}>
        {searching ? (
          results.length ? (
            <>
              <div className={classes.label}>{t("emojiResults")}</div>
              {renderGrid(results)}
            </>
          ) : (
            <div className={classes.empty}>
              <span>🔍</span>
              {t("noEmoji")}
            </div>
          )
        ) : (
          sections.map(s => (
            <section
              key={s.id}
              ref={node => {
                sectionRefs.current[s.id] = node;
              }}
            >
              <div className={classes.label}>{s.label}</div>
              {renderGrid(s.emojis)}
            </section>
          ))
        )}
      </div>
    </>
  );
};

export default EmojiTab;
