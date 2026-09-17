import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputBase from "@material-ui/core/InputBase";
import Avatar from "@material-ui/core/Avatar";
import ButtonBase from "@material-ui/core/ButtonBase";
import Collapse from "@material-ui/core/Collapse";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";

import api from "../../services/api";

/**
 * Escolher um contato pesquisando, no jeito da busca de conversas: digita
 * nome ou número e a lista desce logo abaixo (sem modal por cima). Depois
 * de escolhido vira uma "pílula" com foto e nome, com o X para trocar.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    search: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 44,
      padding: "0 14px",
      borderRadius: 999,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary,
      border: `1.5px solid transparent`,
      transition: "border-color .15s ease, background-color .15s ease",
      "&:focus-within": {
        borderColor: t.brand.main,
        backgroundColor: t.surface
      }
    },
    searchError: { borderColor: t.semantic.danger },
    input: { flex: 1, fontSize: 15, color: theme.palette.text.primary },
    list: {
      marginTop: 6,
      maxHeight: 240,
      overflowY: "auto",
      borderRadius: 14,
      backgroundColor: t.surfaceSunken
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 12,
      width: "100%",
      padding: "8px 14px",
      textAlign: "left",
      animation: "$in .2s ease both",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    "@keyframes in": {
      from: { opacity: 0, transform: "translateY(-4px)" },
      to: { opacity: 1, transform: "none" }
    },
    avatar: {
      width: 36,
      height: 36,
      fontSize: 14,
      fontWeight: 700,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft
    },
    name: {
      fontSize: 14.5,
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    number: { fontSize: 12.5, color: theme.palette.text.secondary },
    hint: {
      padding: "10px 14px",
      fontSize: 13,
      color: theme.palette.text.secondary
    },
    chosen: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "6px 6px 6px 8px",
      borderRadius: 999,
      backgroundColor: t.brand.textSoft,
      animation: "$in .2s ease both"
    },
    chosenText: { flex: 1, minWidth: 0 },
    clear: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      color: t.brand.text,
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    error: {
      marginTop: 4,
      marginLeft: 14,
      fontSize: 12,
      color: t.semantic.danger
    }
  };
});

const initial = name => (name || "?").trim().charAt(0).toUpperCase();

const ContactPicker = ({ value, onChange, error, autoFocus }) => {
  const classes = useStyles();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setLoaded(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/contacts", {
          params: { searchParam: term, pageNumber: 1 }
        });
        setResults((data?.contacts || []).filter(c => !c.isGroup).slice(0, 10));
      } catch (err) {
        setResults([]);
      }
      setLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (value?.id) {
    return (
      <div className={classes.chosen}>
        <Avatar
          src={value.profilePicUrl || undefined}
          className={classes.avatar}
        >
          {initial(value.name)}
        </Avatar>
        <div className={classes.chosenText}>
          <div className={classes.name}>{value.name}</div>
          {value.number && <div className={classes.number}>{value.number}</div>}
        </div>
        <ButtonBase
          className={classes.clear}
          onClick={() => onChange(null)}
          aria-label="Trocar contato"
        >
          <CloseRoundedIcon fontSize="small" />
        </ButtonBase>
      </div>
    );
  }

  const typed = query.trim().length >= 2;
  return (
    <div>
      <label
        className={`${classes.search}${error ? ` ${classes.searchError}` : ""}`}
      >
        <SearchRoundedIcon fontSize="small" />
        <InputBase
          className={classes.input}
          placeholder="Buscar contato por nome ou número"
          value={query}
          autoFocus={autoFocus}
          onChange={e => setQuery(e.target.value)}
        />
      </label>
      <Collapse in={typed} timeout={220}>
        <div className={classes.list}>
          {results.length === 0 ? (
            <div className={classes.hint}>
              {loaded ? "Nenhum contato encontrado" : "Buscando…"}
            </div>
          ) : (
            results.map((contact, index) => (
              <ButtonBase
                key={contact.id}
                className={classes.row}
                style={{ animationDelay: `${index * 25}ms` }}
                onClick={() => {
                  onChange(contact);
                  setQuery("");
                }}
              >
                <Avatar
                  src={contact.profilePicUrl || undefined}
                  className={classes.avatar}
                >
                  {initial(contact.name)}
                </Avatar>
                <span style={{ minWidth: 0 }}>
                  <div className={classes.name}>{contact.name}</div>
                  <div className={classes.number}>{contact.number}</div>
                </span>
              </ButtonBase>
            ))
          )}
        </div>
      </Collapse>
      {error && <div className={classes.error}>{error}</div>}
    </div>
  );
};

export default ContactPicker;
