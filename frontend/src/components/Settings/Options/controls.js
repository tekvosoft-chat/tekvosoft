import React, { createContext, useContext } from "react";
import clsx from "clsx";
import {
  Button,
  InputAdornment,
  makeStyles,
  MenuItem,
  Switch,
  TextField
} from "@material-ui/core";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import VpnKeyRoundedIcon from "@material-ui/icons/VpnKeyRounded";

import { i18n } from "../../../translate/i18n";
import { monoStack } from "../../../theme/tokens";

/**
 * Peças da aba Opções. Cada opção é uma linha: título e explicação à
 * esquerda, o controle à direita (no celular, embaixo). Título, explicação e
 * nomes das escolhas vêm de settings.options.fields.<chave da opção>, então
 * a linha só precisa saber qual opção mostra.
 */

// valores, edição local e gravação, entregues pela aba a todas as linhas
export const OptionsContext = createContext(null);

// variáveis que as mensagens automáticas aceitam (helpers/Mustache.ts)
export const MESSAGE_VARIABLES = [
  "firstname",
  "name",
  "greeting",
  "user",
  "queue",
  "protocol"
];

// o i18next trocaria {{firstname}} por vazio: passa a própria variável como
// valor para ela aparecer escrita no texto de exemplo
const LITERAL_VARIABLES = Object.fromEntries(
  MESSAGE_VARIABLES.map(v => [v, `{{${v}}}`])
);

export const fieldText = (key, part, values) =>
  i18n.t(`settings.options.fields.${key}.${part}`, values);

const labelId = key => `option-${key}`;

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    header: {
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(1.5),
      marginBottom: theme.spacing(3),
      [theme.breakpoints.down("xs")]: { marginBottom: theme.spacing(2) }
    },
    headerIcon: {
      flex: "none",
      display: "grid",
      placeItems: "center",
      width: 40,
      height: 40,
      borderRadius: tkv.radius.md,
      color: tkv.brand.text,
      backgroundColor: tkv.brand.textSoft,
      "& svg": { fontSize: 22 }
    },
    headerTitle: {
      margin: 0,
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: theme.palette.text.primary
    },
    headerText: {
      margin: "2px 0 0",
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },

    group: {
      "& + &": { marginTop: theme.spacing(3) }
    },
    groupTitle: {
      margin: theme.spacing(0, 0, 1),
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary
    },
    groupText: {
      margin: theme.spacing(-0.5, 0, 1.25),
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    // as opções de um grupo num cartão só, separadas por linhas finas
    panel: {
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface
    },

    row: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(2),
      padding: theme.spacing(2, 2.5),
      "& + &": { borderTop: `1px solid ${tkv.border}` },
      [theme.breakpoints.down("xs")]: {
        gap: theme.spacing(1.5),
        padding: theme.spacing(1.75, 2)
      }
    },
    // campo largo (lista, número, chave): no celular desce para baixo do texto
    rowWrap: {
      [theme.breakpoints.down("xs")]: { flexWrap: "wrap" }
    },
    // texto longo (mensagens, chaves): o campo ocupa a linha de baixo inteira
    rowStacked: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: theme.spacing(1.25)
    },
    rowDisabled: {
      "& $rowTitle, & $rowDescription": { opacity: 0.55 }
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      lineHeight: 1.35,
      color: theme.palette.text.primary
    },
    rowDescription: {
      marginTop: 3,
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    rowNote: {
      marginTop: 6,
      fontSize: "0.75rem",
      fontWeight: 600,
      lineHeight: 1.45,
      color: tkv.brand.text
    },
    rowControl: {
      flex: "0 0 260px",
      minWidth: 0,
      [theme.breakpoints.down("xs")]: { flexBasis: "100%" }
    },
    // o interruptor é pequeno: fica à direita até no celular
    rowSwitch: { flex: "none", marginRight: -10 },

    field: {
      width: "100%",
      "& .MuiInputBase-root": {
        borderRadius: 10,
        backgroundColor: tkv.surfaceSunken,
        border: `1px solid ${tkv.border}`,
        transition: "border-color .15s ease, box-shadow .15s ease",
        "&:hover": { borderColor: tkv.borderStrong },
        "&.Mui-focused": {
          borderColor: tkv.brand.main,
          backgroundColor: tkv.surface,
          boxShadow: `0 0 0 3px ${tkv.brand.soft}`
        },
        "&.Mui-disabled": { opacity: 0.6 }
      },
      "& .MuiInput-underline:before, & .MuiInput-underline:after": {
        display: "none"
      },
      "& .MuiSelect-select, & .MuiInputBase-input": {
        padding: "9px 12px",
        fontSize: "0.9063rem",
        fontWeight: 600,
        color: theme.palette.text.primary,
        borderRadius: 10
      },
      "& .MuiSelect-select": { paddingRight: 32 },
      "& .MuiSelect-select:focus": { backgroundColor: "transparent" },
      "& .MuiSelect-icon": { right: 6, color: theme.palette.text.secondary },
      "& .MuiInputAdornment-positionEnd": {
        marginRight: 12,
        "& p": { fontSize: "0.8125rem", fontWeight: 600 }
      },
      "& .MuiInputBase-multiline": { padding: 0 },
      "& .MuiInputBase-inputMultiline": {
        padding: "10px 12px",
        fontWeight: 500,
        lineHeight: 1.5
      }
    },
    monospace: {
      "& .MuiInputBase-input": {
        fontFamily: monoStack,
        fontWeight: 500,
        fontSize: "0.8438rem"
      }
    },

    // tempo + ação lado a lado; no celular, um embaixo do outro
    pair: {
      display: "grid",
      gridTemplateColumns: "150px minmax(0, 1fr)",
      gap: theme.spacing(1.5),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    caption: {
      display: "block",
      marginBottom: 4,
      fontSize: "0.75rem",
      fontWeight: 600,
      color: theme.palette.text.secondary
    },

    tokenLine: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: theme.spacing(1),
      "& > .MuiFormControl-root": { flex: "1 1 260px" },
      "& > .MuiButton-root": { flex: "none" }
    },

    variables: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "baseline",
      gap: theme.spacing(0.75, 1.5),
      fontSize: "0.75rem",
      lineHeight: 1.5,
      color: theme.palette.text.secondary
    },
    variable: {
      whiteSpace: "nowrap",
      "& code": {
        marginRight: 4,
        padding: "1px 5px",
        borderRadius: 5,
        fontSize: "0.75rem",
        fontWeight: 600,
        color: tkv.brand.text,
        backgroundColor: tkv.brand.textSoft
      }
    }
  };
});

export const SectionHeader = ({ icon: Icon, title, description }) => {
  const classes = useStyles();
  return (
    <div className={classes.header}>
      <span className={classes.headerIcon} aria-hidden="true">
        <Icon />
      </span>
      <div>
        <h2 className={classes.headerTitle}>{title}</h2>
        <p className={classes.headerText}>{description}</p>
      </div>
    </div>
  );
};

export const Group = ({ title, description, children }) => {
  const classes = useStyles();
  return (
    <section className={classes.group}>
      {title && <h3 className={classes.groupTitle}>{title}</h3>}
      {description && <div className={classes.groupText}>{description}</div>}
      <div className={classes.panel}>{children}</div>
    </section>
  );
};

/**
 * Linha genérica. `id` é a chave da opção: dá o título e a explicação, a não
 * ser que venham prontos em `title` e `description`.
 */
export const Row = ({
  id,
  title,
  description,
  note,
  control,
  variant = "wide",
  disabled = false
}) => {
  const classes = useStyles();
  return (
    <div
      className={clsx(classes.row, {
        [classes.rowWrap]: variant === "wide",
        [classes.rowStacked]: variant === "stacked",
        [classes.rowDisabled]: disabled
      })}
    >
      <div className={classes.rowText}>
        <div className={classes.rowTitle} id={labelId(id)}>
          {title ?? fieldText(id, "title")}
        </div>
        <div className={classes.rowDescription}>
          {description ?? fieldText(id, "description")}
        </div>
        {note && <div className={classes.rowNote}>{note}</div>}
      </div>
      <div
        className={clsx({
          [classes.rowControl]: variant === "wide",
          [classes.rowSwitch]: variant === "switch"
        })}
      >
        {control}
      </div>
    </div>
  );
};

const useOption = key => {
  const { values, edit, save } = useContext(OptionsContext);
  return {
    value: values[key] ?? "",
    edit: value => edit(key, value),
    save: value => save(key, value)
  };
};

// opção de liga/desliga ("enabled" / "disabled")
export const SwitchRow = ({ id, disabled, note }) => {
  const { value, save } = useOption(id);
  return (
    <Row
      id={id}
      note={note}
      disabled={disabled}
      variant="switch"
      control={
        <Switch
          color="primary"
          checked={value === "enabled"}
          disabled={disabled}
          onChange={e => save(e.target.checked ? "enabled" : "disabled")}
          inputProps={{ "aria-labelledby": labelId(id) }}
        />
      }
    />
  );
};

/**
 * Lista de escolhas. `options` são os valores gravados; o nome de cada um
 * vem de fields.<id>.options.<valor>. Escolhas montadas na hora (filas)
 * chegam prontas como { value, label }.
 */
export const OptionSelect = ({ id, options, value, onChange, disabled }) => {
  const classes = useStyles();
  return (
    <TextField
      select
      className={classes.field}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      SelectProps={{ labelId: labelId(id) }}
    >
      {options.map(option => {
        const item =
          typeof option === "object"
            ? option
            : { value: option, label: fieldText(id, `options.${option}`) };
        return (
          <MenuItem key={item.value} value={item.value}>
            {item.label}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export const SelectRow = ({ id, options, disabled, note, onSaved }) => {
  const { value, save } = useOption(id);
  return (
    <Row
      id={id}
      note={note}
      disabled={disabled}
      control={
        <OptionSelect
          id={id}
          options={options}
          value={value}
          disabled={disabled}
          onChange={async next => {
            if ((await save(next)) && onSaved) onSaved(next);
          }}
        />
      }
    />
  );
};

// número inteiro; vazio continua vazio (o servidor usa o padrão dele)
const cleanNumber = (value, min) => {
  if (String(value).trim() === "") return "";
  return String(Math.max(min, parseInt(value, 10) || 0));
};

export const NumberField = ({ id, unit, placeholder, disabled, min = 0 }) => {
  const classes = useStyles();
  const { value, edit, save } = useOption(id);
  return (
    <TextField
      type="number"
      className={classes.field}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={e => edit(e.target.value)}
      onBlur={() => save(cleanNumber(value, min))}
      inputProps={{ min, inputMode: "numeric", "aria-labelledby": labelId(id) }}
      InputProps={{
        endAdornment: unit && (
          <InputAdornment position="end">{unit}</InputAdornment>
        )
      }}
    />
  );
};

export const NumberRow = ({ id, unit, placeholder, disabled, min, note }) => (
  <Row
    id={id}
    note={note}
    disabled={disabled}
    control={
      <NumberField
        id={id}
        unit={unit}
        placeholder={placeholder}
        disabled={disabled}
        min={min}
      />
    }
  />
);

// texto de uma linha (chaves de API, modelo): grava ao sair do campo
export const TextRow = ({ id, placeholder, monospace, stacked = true }) => {
  const classes = useStyles();
  const { value, edit, save } = useOption(id);
  return (
    <Row
      id={id}
      variant={stacked ? "stacked" : "wide"}
      control={
        <TextField
          className={clsx(classes.field, { [classes.monospace]: monospace })}
          value={value}
          placeholder={placeholder}
          onChange={e => edit(e.target.value)}
          onBlur={() => save(value.trim())}
          inputProps={{
            "aria-labelledby": labelId(id),
            spellCheck: false,
            autoComplete: "off"
          }}
        />
      }
    />
  );
};

// o que dá para escrever nas mensagens automáticas; vai uma vez no grupo,
// e não repetido embaixo de cada caixa
export const MessageVariables = () => {
  const classes = useStyles();
  return (
    <div className={classes.variables}>
      <span>{i18n.t("settings.options.variables.title")}</span>
      {MESSAGE_VARIABLES.map(variable => (
        <span key={variable} className={classes.variable}>
          <code>{`{{${variable}}}`}</code>
          {i18n.t(`settings.options.variables.${variable}`)}
        </span>
      ))}
    </div>
  );
};

// mensagem automática: caixa grande, grava ao sair dela
export const MessageRow = ({ id }) => {
  const classes = useStyles();
  const { value, edit, save } = useOption(id);
  return (
    <Row
      id={id}
      variant="stacked"
      control={
        <TextField
          multiline
          minRows={3}
          className={classes.field}
          value={value}
          placeholder={fieldText(id, "placeholder", LITERAL_VARIABLES)}
          onChange={e => edit(e.target.value)}
          onBlur={() => save(value)}
          inputProps={{ "aria-labelledby": labelId(id) }}
        />
      }
    />
  );
};

// token da API: só leitura, com gerar, copiar e apagar
export const TokenRow = ({ id, onGenerate, onCopy, onRemove }) => {
  const classes = useStyles();
  const { value } = useOption(id);
  return (
    <Row
      id={id}
      variant="stacked"
      control={
        <div className={classes.tokenLine}>
          <TextField
            className={clsx(classes.field, classes.monospace)}
            value={value}
            placeholder={i18n.t("settings.options.apiToken.empty")}
            InputProps={{ readOnly: true }}
            inputProps={{ "aria-labelledby": labelId(id) }}
          />
          {value ? (
            <>
              <Button
                variant="outlined"
                startIcon={<FileCopyOutlinedIcon />}
                onClick={onCopy}
              >
                {i18n.t("settings.options.apiToken.copy")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon />}
                onClick={onRemove}
              >
                {i18n.t("settings.options.apiToken.remove")}
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<VpnKeyRoundedIcon />}
              onClick={onGenerate}
            >
              {i18n.t("settings.options.apiToken.generate")}
            </Button>
          )}
        </div>
      }
    />
  );
};

/**
 * Conversa parada: quanto tempo esperar e o que fazer depois. Antes eram dois
 * cartões soltos ("Timeout…" e "Ação para timeout…"); juntos, dá para ler a
 * regra inteira de uma vez.
 */
export const TimeoutRow = ({ id, actionId, actions }) => {
  const classes = useStyles();
  const { value: action, save: saveAction } = useOption(actionId);
  return (
    <Row
      id={id}
      variant="stacked"
      control={
        <div className={classes.pair}>
          <label>
            <span className={classes.caption}>
              {i18n.t("settings.options.timeout.after")}
            </span>
            <NumberField
              id={id}
              unit={i18n.t("settings.options.units.minutes")}
            />
          </label>
          <div>
            <span className={classes.caption} id={labelId(actionId)}>
              {i18n.t("settings.options.timeout.then")}
            </span>
            <OptionSelect
              id={actionId}
              options={actions}
              value={action}
              onChange={saveAction}
            />
          </div>
        </div>
      }
    />
  );
};
