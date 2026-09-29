import React, { useContext, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Button, ButtonBase, makeStyles } from "@material-ui/core";
import HeadsetMicRoundedIcon from "@material-ui/icons/HeadsetMicRounded";
import AccountTreeRoundedIcon from "@material-ui/icons/AccountTreeRounded";
import ScheduleRoundedIcon from "@material-ui/icons/ScheduleRounded";
import ForumRoundedIcon from "@material-ui/icons/ForumRounded";
import EmojiObjectsRoundedIcon from "@material-ui/icons/EmojiObjectsRounded";
import ExtensionRoundedIcon from "@material-ui/icons/ExtensionRounded";
import FolderRoundedIcon from "@material-ui/icons/FolderRounded";
import DnsRoundedIcon from "@material-ui/icons/DnsRounded";
import DeveloperBoardRoundedIcon from "@material-ui/icons/DeveloperBoardRounded";
import BuildRoundedIcon from "@material-ui/icons/BuildRounded";
import GetAppRoundedIcon from "@material-ui/icons/GetAppRounded";
import ReplayRoundedIcon from "@material-ui/icons/ReplayRounded";

import useSettings from "../../../hooks/useSettings";
import useAuth from "../../../hooks/useAuth.js";
import useQueues from "../../../hooks/useQueues";
import { i18nToast } from "../../../helpers/i18nToast";
import toastError from "../../../errors/toastError";
import { generateSecureToken } from "../../../helpers/generateSecureToken";
import { copyToClipboard } from "../../../helpers/copyToClipboard";
import { i18n } from "../../../translate/i18n";
import { messages } from "../../../translate/languages";
import { SocketContext } from "../../../context/Socket/SocketContext";
import api from "../../../services/api";
import { getBackendURL } from "../../../services/config";
import {
  OptionsContext,
  SectionHeader,
  Group,
  Row,
  SwitchRow,
  SelectRow,
  NumberRow,
  TextRow,
  MessageRow,
  MessageVariables,
  TimeoutRow,
  TokenRow
} from "./controls";

/**
 * Configurações > Opções, dividida em seções.
 *
 * Antes era uma página só com ~40 opções em sequência. Agora cada seção
 * junta o que mexe na mesma parte do sistema; no computador elas ficam numa
 * coluna à esquerda e, no celular, em pílulas que rolam para o lado.
 */

// valor de cada opção enquanto a empresa não gravou nada (o mesmo que o
// servidor assume quando a chave não existe)
const DEFAULTS = {
  ticketAcceptedMessage: "",
  transferMessage: "",
  keepUserAndQueue: "enabled",
  autoReopenTimeout: "0",
  userRating: "disabled",
  ratingsTimeout: "5",
  tagsMode: "ticket",

  chatbotAutoExit: "disabled",
  showNumericIcons: "disabled",
  chatbotTicketTimeout: "0",
  chatbotTicketTimeoutAction: "0",
  noQueueTimeout: "0",
  noQueueTimeoutAction: "0",
  openTicketTimeout: "0",
  openTicketTimeoutAction: "pending",

  scheduleType: "disabled",
  outOfHoursAction: "pending",

  messageVisibility: "message",
  quickMessages: "individual",
  call: "enabled",
  CheckMsgIsGroup: "enabled",
  groupsTab: "disabled",
  soundGroupNotifications: "disabled",

  audioTranscriptions: "disabled",
  aiProvider: "openai",
  openAiKey: "",
  aiAgentProvider: "openai",
  aiAgentApiKey: "",
  aiAgentModel: "",

  apiToken: "",
  klipyApiKey: "",

  uploadLimit: "",
  downloadLimit: "",

  defaultLanguage: "",
  allowSignup: "disabled",
  gracePeriod: "0",
  useMultiThreadedWbot: "disabled",
  extensionDownloadUrl: "",

  // pipeline de IA (só o super; chaves com "_" ficam na empresa 1)
  _devAiProvider: "anthropic",
  _devAnthropicKey: "",
  _devAnthropicModel: "claude-opus-5",
  _devOpenAiKey: "",
  _devOpenAiModel: "",
  _devGithubRepo: "",
  _devGithubToken: "",
  _devGithubBranch: "",
  _devAutoApprove: "disabled",
  _devAutoTriage: "disabled",
  _devReviewRounds: "",
  _devTokenLimit: "",
  _devAutoLearn: "enabled",
  _devUsdBrl: ""
};

// "Arquivos", "Sistema" e "Pipeline de IA" valem para a instalação
// inteira: só o super vê
const SECTIONS = [
  { id: "service", icon: HeadsetMicRoundedIcon },
  { id: "automation", icon: AccountTreeRoundedIcon },
  { id: "hours", icon: ScheduleRoundedIcon },
  { id: "chat", icon: ForumRoundedIcon },
  { id: "ai", icon: EmojiObjectsRoundedIcon },
  { id: "integrations", icon: ExtensionRoundedIcon },
  { id: "files", icon: FolderRoundedIcon, superOnly: true },
  { id: "system", icon: DnsRoundedIcon, superOnly: true },
  { id: "devPipeline", icon: DeveloperBoardRoundedIcon, superOnly: true }
];

// modelos do Claude oferecidos no pipeline: o Opus é o padrão; os outros
// trocam qualidade por preço (Haiku) ou preço por qualidade (Fable)
const CLAUDE_MODELS = [
  "claude-opus-5",
  "claude-sonnet-5",
  "claude-haiku-4-5",
  "claude-fable-5-1"
];

// modelo usado quando o campo "Modelo" fica em branco (AiServices)
const AI_MODEL_HINTS = {
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile"
};

const LANGUAGES = Object.keys(messages).map(key => ({
  value: key,
  label: messages[key].translations.mainDrawer.appBar.i18n.language
}));

// a seção aberta sobrevive à troca de aba e ao recarregar; ?section=ai
// abre direto numa delas (para os avisos do sistema apontarem o lugar)
const SECTION_KEY = "tkv:settingsSection";

const initialSection = () => {
  const fromUrl = new URLSearchParams(window.location.search).get("section");
  if (fromUrl) return fromUrl;
  try {
    return localStorage.getItem(SECTION_KEY) || SECTIONS[0].id;
  } catch {
    return SECTIONS[0].id;
  }
};

const t = (key, values) => i18n.t(`settings.options.${key}`, values);

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    layout: {
      display: "flex",
      alignItems: "flex-start",
      gap: theme.spacing(4),
      padding: theme.spacing(1, 0, 3),
      [theme.breakpoints.down("sm")]: {
        flexDirection: "column",
        alignItems: "stretch",
        gap: theme.spacing(2),
        paddingTop: 0
      }
    },

    // computador: coluna de seções à esquerda
    nav: {
      flex: "none",
      width: 236,
      display: "flex",
      flexDirection: "column",
      gap: 2,
      // celular e tablet: pílulas numa faixa que rola para o lado, de
      // borda a borda (a página tem 16px de respiro de cada lado)
      [theme.breakpoints.down("sm")]: {
        width: "auto",
        flexDirection: "row",
        gap: theme.spacing(1),
        overflowX: "auto",
        margin: theme.spacing(0, -2),
        padding: theme.spacing(0.5, 2, 1),
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" }
      }
    },
    navItem: {
      justifyContent: "flex-start",
      gap: 10,
      width: "100%",
      padding: "9px 12px",
      borderRadius: 10,
      fontSize: "0.9063rem",
      fontWeight: 600,
      lineHeight: 1.3,
      textAlign: "left",
      color: theme.palette.text.secondary,
      transition: "background-color .15s ease, color .15s ease",
      "& svg": { flex: "none", fontSize: 20 },
      "&:hover": {
        color: theme.palette.text.primary,
        backgroundColor: tkv.surfaceHover
      },
      "&.Mui-focusVisible": { boxShadow: `0 0 0 3px ${tkv.brand.focusRing}` },
      [theme.breakpoints.down("sm")]: {
        flex: "none",
        width: "auto",
        padding: "7px 14px",
        borderRadius: 999,
        border: `1px solid ${tkv.border}`,
        backgroundColor: tkv.surface,
        fontSize: "0.875rem",
        whiteSpace: "nowrap",
        "& svg": { fontSize: 18 }
      }
    },
    navItemActive: {
      color: tkv.brand.text,
      backgroundColor: tkv.brand.textSoft,
      "&:hover": { color: tkv.brand.text, backgroundColor: tkv.brand.textSoft },
      [theme.breakpoints.down("sm")]: { borderColor: tkv.brand.textBorder }
    },

    content: { flex: 1, minWidth: 0, maxWidth: 820 },

    buttons: {
      display: "flex",
      flexWrap: "wrap",
      gap: theme.spacing(1),
      [theme.breakpoints.down("xs")]: {
        "& > *": { flex: "1 1 auto" }
      }
    },
    dangerButton: {
      color: tkv.semantic.danger,
      borderColor: tkv.semantic.danger,
      "&:hover": {
        borderColor: tkv.semantic.danger,
        backgroundColor: tkv.semantic.dangerSoft
      }
    }
  };
});

export default function Options({ settings, scheduleTypeChanged }) {
  const classes = useStyles();
  const { update } = useSettings();
  const { getCurrentUserInfo } = useAuth();
  const { findAll: findAllQueues } = useQueues();
  const socketManager = useContext(SocketContext);

  const [values, setValues] = useState(DEFAULTS);
  // o que já está gravado: sair de um campo sem mudar nada não grava de novo
  const saved = useRef(DEFAULTS);
  const [currentUser, setCurrentUser] = useState({});
  const [queues, setQueues] = useState([]);
  const [section, setSection] = useState(initialSection);
  const [buildingExtension, setBuildingExtension] = useState(false);
  const [restartingBackend, setRestartingBackend] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    let alive = true;
    getCurrentUserInfo().then(user => alive && setCurrentUser(user || {}));
    findAllQueues()
      .then(list => alive && setQueues(list || []))
      .catch(() => {});
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!Array.isArray(settings) || !settings.length) return;
    const loaded = { ...DEFAULTS };
    settings.forEach(({ key, value }) => {
      if (key in DEFAULTS && value !== null && value !== undefined) {
        if (String(value) !== "") loaded[key] = String(value);
      }
    });
    saved.current = loaded;
    setValues(loaded);
  }, [settings]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return;

    const socket = socketManager.GetSocket(companyId);

    const onExtensionBuild = data => {
      setBuildingExtension(false);
      if (data?.status === "success" && data?.url) {
        setValues(v => ({ ...v, extensionDownloadUrl: data.url }));
        i18nToast.success("whitelabel.extensionBuilt");
      } else {
        i18nToast.error(
          data?.message || i18n.t("whitelabel.extensionBuildUnknownError")
        );
      }
    };

    socket.on(`company-${companyId}-extensionBuild`, onExtensionBuild);

    return () => {
      socket.disconnect();
    };
  }, [socketManager]);

  const edit = (key, value) => setValues(v => ({ ...v, [key]: value }));

  // grava na hora, como sempre foi; devolve se deu certo
  const save = async (key, value) => {
    edit(key, value);
    if (saved.current[key] === value) return true;
    try {
      await update({ key, value });
      saved.current = { ...saved.current, [key]: value };
      i18nToast.success("settings.success");
      return true;
    } catch (err) {
      toastError(err);
      return false;
    }
  };

  const isSuper = !!currentUser?.super;
  const visible = SECTIONS.filter(s => !s.superOnly || isSuper);
  const active = visible.find(s => s.id === section) || visible[0];

  const choose = id => {
    setSection(id);
    try {
      localStorage.setItem(SECTION_KEY, id);
    } catch {
      // sem armazenamento, a seção só não é lembrada
    }
  };

  // no celular, a pílula escolhida entra na faixa visível
  useEffect(() => {
    const current = navRef.current?.querySelector("[aria-current='true']");
    if (current?.scrollIntoView) {
      current.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [active.id]);

  const handleBuildExtension = async () => {
    setBuildingExtension(true);
    try {
      await api.post("/build-capture-extension");
      i18nToast.success("whitelabel.extensionBuildStarted");
    } catch (error) {
      setBuildingExtension(false);
      i18nToast.error("whitelabel.extensionBuildFailed");
    }
  };

  const handleRestartBackend = async () => {
    setRestartingBackend(true);
    try {
      await api.post("/restart");
      // a página de transição conta 30s e volta para /settings
      window.location.href = "/?restart=1";
    } catch (error) {
      setRestartingBackend(false);
      i18nToast.error("settings.restartBackend.error");
    }
  };

  // encerrar, ou mandar para uma das filas da empresa
  const queueActions = [
    { value: "0", label: t("timeout.close") },
    ...queues.map(queue => ({
      value: String(queue.id),
      label: t("timeout.transferTo", { queue: queue.name })
    }))
  ];

  const ignoringGroups = values.CheckMsgIsGroup === "enabled";
  const scheduleNote = {
    company: t("notes.scheduleCompany"),
    queue: t("notes.scheduleQueue")
  }[values.scheduleType];

  const renderSection = id => {
    switch (id) {
      case "service":
        return (
          <>
            <Group
              title={t("groups.autoMessages")}
              description={<MessageVariables />}
            >
              <MessageRow id="ticketAcceptedMessage" />
              <MessageRow id="transferMessage" />
            </Group>
            <Group title={t("groups.closing")}>
              <SwitchRow id="keepUserAndQueue" />
              <NumberRow
                id="autoReopenTimeout"
                unit={t("units.minutes")}
                placeholder="0"
              />
            </Group>
            <Group title={t("groups.rating")}>
              <SwitchRow id="userRating" />
              <NumberRow
                id="ratingsTimeout"
                unit={t("units.minutes")}
                placeholder="5"
                min={1}
                disabled={values.userRating !== "enabled"}
                note={values.userRating !== "enabled" && t("notes.needsRating")}
              />
            </Group>
            <Group title={t("groups.tags")}>
              <SelectRow
                id="tagsMode"
                options={["ticket", "contact", "both"]}
              />
            </Group>
          </>
        );
      case "automation":
        return (
          <>
            <Group title={t("groups.chatbot")}>
              <SwitchRow id="chatbotAutoExit" />
              <SwitchRow id="showNumericIcons" />
            </Group>
            <Group title={t("groups.idle")} description={t("groups.idleHint")}>
              <TimeoutRow
                id="chatbotTicketTimeout"
                actionId="chatbotTicketTimeoutAction"
                actions={queueActions}
              />
              <TimeoutRow
                id="noQueueTimeout"
                actionId="noQueueTimeoutAction"
                actions={queueActions}
              />
              <TimeoutRow
                id="openTicketTimeout"
                actionId="openTicketTimeoutAction"
                actions={["pending", "closed"]}
              />
            </Group>
          </>
        );
      case "hours":
        return (
          <Group>
            <SelectRow
              id="scheduleType"
              options={["disabled", "company", "queue"]}
              note={scheduleNote}
              onSaved={value =>
                typeof scheduleTypeChanged === "function" &&
                scheduleTypeChanged(value)
              }
            />
            <SelectRow
              id="outOfHoursAction"
              options={["pending", "closed"]}
              disabled={values.scheduleType === "disabled"}
              note={
                values.scheduleType === "disabled" && t("notes.needsSchedule")
              }
            />
          </Group>
        );
      case "chat":
        return (
          <>
            <Group title={t("groups.chatScreen")}>
              <SelectRow
                id="messageVisibility"
                options={["message", "ticket"]}
              />
              <SelectRow
                id="quickMessages"
                options={["individual", "company"]}
              />
            </Group>
            <Group title={t("groups.calls")}>
              <SelectRow id="call" options={["enabled", "disabled"]} />
            </Group>
            <Group title={t("groups.groups")}>
              <SwitchRow id="CheckMsgIsGroup" />
              <SwitchRow
                id="groupsTab"
                disabled={ignoringGroups}
                note={ignoringGroups && t("notes.groupsIgnored")}
              />
              <SwitchRow
                id="soundGroupNotifications"
                disabled={ignoringGroups}
                note={ignoringGroups && t("notes.groupsIgnored")}
              />
            </Group>
          </>
        );
      case "ai":
        return (
          <>
            <Group title={t("groups.transcription")}>
              <SwitchRow id="audioTranscriptions" />
              <SelectRow id="aiProvider" options={["openai", "groq"]} />
              <TextRow id="openAiKey" monospace />
            </Group>
            <Group
              title={t("groups.agent")}
              description={t("groups.agentHint")}
            >
              <SelectRow
                id="aiAgentProvider"
                options={["openai", "gemini", "groq"]}
              />
              <TextRow id="aiAgentApiKey" monospace />
              <TextRow
                id="aiAgentModel"
                stacked={false}
                placeholder={AI_MODEL_HINTS[values.aiAgentProvider]}
              />
            </Group>
          </>
        );
      case "integrations":
        return (
          <>
            <Group title={t("groups.api")}>
              <TokenRow
                id="apiToken"
                onGenerate={() => save("apiToken", generateSecureToken(33))}
                onCopy={() => {
                  copyToClipboard(values.apiToken);
                  i18nToast.success("settings.copiedToClipboard");
                }}
                onRemove={() => save("apiToken", "")}
              />
            </Group>
            {/* GIFs e figurinhas: uma chave só, do dono do sistema, vale
                para todas as empresas (o servidor usa a da empresa 1) */}
            {isSuper && (
              <Group title={t("groups.media")}>
                <TextRow id="klipyApiKey" monospace />
              </Group>
            )}
          </>
        );
      case "files":
        return (
          <Group title={t("groups.limits")}>
            <NumberRow
              id="uploadLimit"
              unit={t("units.megabytes")}
              placeholder="15"
              min={1}
            />
            <NumberRow
              id="downloadLimit"
              unit={t("units.megabytes")}
              placeholder="15"
              min={1}
            />
          </Group>
        );
      case "system":
        return (
          <>
            <Group title={t("groups.access")}>
              <SelectRow id="defaultLanguage" options={LANGUAGES} />
              <SwitchRow id="allowSignup" />
              <NumberRow
                id="gracePeriod"
                unit={t("units.days")}
                placeholder="0"
              />
            </Group>
            <Group title={t("groups.server")}>
              <SwitchRow id="useMultiThreadedWbot" />
              <Row
                id="extension"
                variant="stacked"
                control={
                  <div className={classes.buttons}>
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<BuildRoundedIcon />}
                      disabled={buildingExtension}
                      onClick={handleBuildExtension}
                    >
                      {buildingExtension
                        ? i18n.t("whitelabel.buildingExtension")
                        : i18n.t("whitelabel.buildExtension")}
                    </Button>
                    {values.extensionDownloadUrl && (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<GetAppRoundedIcon />}
                        href={`${getBackendURL()}/public/${
                          values.extensionDownloadUrl
                        }?_=${Date.now()}`}
                        target="_blank"
                        rel="noopener"
                      >
                        {i18n.t("whitelabel.downloadExtension")}
                      </Button>
                    )}
                  </div>
                }
              />
              <Row
                id="restart"
                variant="stacked"
                control={
                  <div className={classes.buttons}>
                    <Button
                      variant="outlined"
                      className={classes.dangerButton}
                      startIcon={<ReplayRoundedIcon />}
                      disabled={restartingBackend}
                      onClick={handleRestartBackend}
                    >
                      {restartingBackend
                        ? i18n.t("settings.restartBackend.restarting")
                        : i18n.t("settings.restartBackend.button")}
                    </Button>
                  </div>
                }
              />
            </Group>
          </>
        );
      case "devPipeline":
        return (
          <>
            <Group
              title={t("groups.devAi")}
              description={t("groups.devAiHint")}
            >
              <SelectRow
                id="_devAiProvider"
                options={["anthropic", "openai"]}
              />
              {values._devAiProvider === "openai" ? (
                <>
                  <TextRow id="_devOpenAiKey" monospace placeholder="sk-..." />
                  <TextRow
                    id="_devOpenAiModel"
                    stacked={false}
                    placeholder="gpt-5"
                  />
                </>
              ) : (
                <>
                  <TextRow
                    id="_devAnthropicKey"
                    monospace
                    placeholder="sk-ant-..."
                  />
                  <SelectRow id="_devAnthropicModel" options={CLAUDE_MODELS} />
                </>
              )}
            </Group>
            <Group
              title={t("groups.devRepo")}
              description={t("groups.devRepoHint")}
            >
              <TextRow
                id="_devGithubRepo"
                stacked={false}
                placeholder="tekvosoft-chat/tekvosoft"
              />
              <TextRow
                id="_devGithubToken"
                monospace
                placeholder="github_pat_..."
              />
              <TextRow
                id="_devGithubBranch"
                stacked={false}
                placeholder="main"
              />
            </Group>
            <Group title={t("groups.devRules")}>
              <SwitchRow id="_devAutoApprove" />
              <SwitchRow id="_devAutoTriage" />
              <NumberRow id="_devReviewRounds" placeholder="2" min={0} />
              <NumberRow
                id="_devTokenLimit"
                unit={t("units.tokens")}
                placeholder="400000"
                min={20000}
              />
              <SwitchRow id="_devAutoLearn" />
              <TextRow id="_devUsdBrl" stacked={false} placeholder="5,40" />
            </Group>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <OptionsContext.Provider value={{ values, edit, save }}>
      <div className={classes.layout}>
        <nav className={classes.nav} ref={navRef} aria-label={t("nav")}>
          {visible.map(({ id, icon: Icon }) => (
            <ButtonBase
              key={id}
              className={clsx(classes.navItem, {
                [classes.navItemActive]: id === active.id
              })}
              aria-current={id === active.id}
              onClick={() => choose(id)}
            >
              <Icon />
              {t(`sections.${id}.title`)}
            </ButtonBase>
          ))}
        </nav>
        <div className={classes.content}>
          <SectionHeader
            icon={active.icon}
            title={t(`sections.${active.id}.title`)}
            description={t(`sections.${active.id}.description`)}
          />
          {renderSection(active.id)}
        </div>
      </div>
    </OptionsContext.Provider>
  );
}
