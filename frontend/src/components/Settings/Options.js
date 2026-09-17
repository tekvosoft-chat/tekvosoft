import React, { useEffect, useState, useRef, useContext } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import useSettings from "../../hooks/useSettings";
import { i18nToast } from "../../helpers/i18nToast";
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { Delete } from "@material-ui/icons";
import { IconButton, TextField, Button, Typography } from "@material-ui/core";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faGears } from "@fortawesome/free-solid-svg-icons";

import { generateSecureToken } from "../../helpers/generateSecureToken";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import useQueues from "../../hooks/useQueues";
import { i18n } from "../../translate/i18n.js";
import { SelectLanguage } from "../SelectLanguage";
import { SocketContext } from "../../context/Socket/SocketContext";
import api from "../../services/api";
import { getBackendURL } from "../../services/config";

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4)
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240
  },
  tab: {
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: "#128c7e"
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%"
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7)
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700]
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px"
  },
  alignRight: {
    textAlign: "right"
  },
  fullWidth: {
    width: "100%"
  },
  selectContainer: {
    width: "100%",
    textAlign: "left"
  },
  colorAdorment: {
    width: 20,
    height: 20
  },

  // cabeçalho de cada grupo de opções
  groupTitle: {
    margin: theme.spacing(2, 0, 0.25),
    fontSize: "1.0625rem",
    fontWeight: 700,
    color: theme.palette.text.primary
  },
  groupHint: {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary
  },
  /**
   * Cada opção é um cartão: título em cima, explicação embaixo e o controle
   * como uma "caixinha" própria.
   *
   * Antes o nome da opção era um rótulo flutuante do Material-UI: ao clicar,
   * ele subia e ficava em cima da linha do campo, difícil de ler. Agora o
   * título é texto fixo e o campo tem fundo e borda próprios — dá para ver
   * o que está escolhido de relance.
   */
  fieldCard: {
    height: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75),
    padding: theme.spacing(1.75, 2, 2),
    borderRadius: theme.palette.tkv.radius.lg,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    transition: "border-color .15s ease, box-shadow .15s ease",
    "&:hover": { borderColor: theme.palette.tkv.borderStrong },
    "&:focus-within": {
      borderColor: theme.palette.tkv.brand.main,
      boxShadow: `0 0 0 3px ${theme.palette.tkv.brand.soft}`
    },

    // título fixo no lugar do rótulo flutuante
    "& .MuiFormControl-root": { width: "100%", margin: 0 },
    "& .MuiInputLabel-root": {
      position: "static",
      transform: "none",
      maxWidth: "100%",
      whiteSpace: "normal",
      marginBottom: 8,
      fontSize: "0.9375rem",
      fontWeight: 700,
      lineHeight: 1.3,
      color: theme.palette.text.primary,
      "&.Mui-focused": { color: theme.palette.text.primary }
    },

    // o campo vira uma caixa, sem a linha embaixo
    "& .MuiInputBase-root": {
      marginTop: 0,
      borderRadius: 10,
      backgroundColor: theme.palette.tkv.surfaceSunken,
      border: `1px solid ${theme.palette.tkv.border}`,
      transition: "border-color .15s ease, background-color .15s ease",
      "&:hover": { borderColor: theme.palette.tkv.borderStrong },
      "&.Mui-focused": {
        borderColor: theme.palette.tkv.brand.main,
        backgroundColor: theme.palette.tkv.surface
      }
    },
    "& .MuiInput-underline:before, & .MuiInput-underline:after": {
      display: "none"
    },
    "& .MuiSelect-select, & .MuiInputBase-input": {
      padding: "11px 14px",
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary,
      borderRadius: 10
    },
    "& .MuiSelect-select:focus": { backgroundColor: "transparent" },
    "& .MuiSelect-icon": { right: 8, color: theme.palette.text.secondary },
    "& .MuiInputAdornment-root": { marginRight: 8 },
    "& textarea": { fontWeight: 500 },
    "& .MuiFormHelperText-root": { marginLeft: 2 }
  },
  hint: {
    fontSize: "0.8125rem",
    lineHeight: 1.45,
    color: theme.palette.text.secondary
  },

  uploadInput: {
    display: "none"
  }
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [outOfHoursAction, setOutOfHoursAction] = useState("pending");
  const [callType, setCallType] = useState("enabled");
  const [quickMessages, setQuickMessages] = useState("");
  const [defaultLanguage, setDefaultLanguage] = useState("");
  const [allowSignup, setAllowSignup] = useState("disabled");
  const [chatbotAutoExit, setChatbotAutoExit] = useState("disabled");
  const [showNumericIcons, setShowNumericIcons] = useState("disabled");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");
  const [soundGroupNotifications, setSoundGroupNotifications] =
    useState("disabled");
  const [groupsTab, setGroupsTab] = useState("disabled");
  const [apiToken, setApiToken] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [klipyApiKey, setKlipyApiKey] = useState("");
  // assistente de IA das filas (separado da chave de transcrição)
  const [aiAgentProvider, setAiAgentProvider] = useState("openai");
  const [aiAgentApiKey, setAiAgentApiKey] = useState("");
  const [aiAgentModel, setAiAgentModel] = useState("");
  const [aiProvider, setAiProvider] = useState("openai");
  const [audioTranscriptions, setAudioTranscriptions] = useState("disabled");
  const [useMultiThreadedWbot, setUseMultiThreadedWbot] = useState("disabled");
  const [uploadLimit, setUploadLimit] = useState("15");
  const [downloadLimit, setDownloadLimit] = useState("15");

  const [messageVisibility, setMessageVisibility] = useState("message");

  const [noQueueTimeout, setNoQueueTimeout] = useState("0");
  const [noQueueTimeoutAction, setNoQueueTimeoutAction] = useState("0");
  const [openTicketTimeout, setOpenTicketTimeout] = useState("0");
  const [openTicketTimeoutAction, setOpenTicketTimeoutAction] =
    useState("pending");
  const [chatbotTicketTimeout, setChatbotTicketTimeout] = useState("0");
  const [chatbotTicketTimeoutAction, setChatbotTicketTimeoutAction] =
    useState(0);

  const [queues, setQueues] = useState([]);
  const { findAll: findAllQueues } = useQueues();

  const [keepUserAndQueue, setKeepUserAndQueue] = useState("enabled");
  const [ratingsTimeout, setRatingsTimeout] = useState(false);
  const [autoReopenTimeout, setAutoReopenTimeout] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(0);
  const [tagsMode, setTagsMode] = useState("ticket");
  const [ticketAcceptedMessage, setTicketAcceptedMessage] = useState("");
  const [transferMessage, setTransferMessage] = useState("");

  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});

  const downloadLimitInput = useRef(null);

  const { update } = useSettings();

  const [extensionUrl, setExtensionUrl] = useState("");
  const [buildingExtension, setBuildingExtension] = useState(false);

  const socketManager = useContext(SocketContext);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) return;

    const socket = socketManager.GetSocket(companyId);

    const onExtensionBuild = data => {
      setBuildingExtension(false);
      if (data?.status === "success" && data?.url) {
        setExtensionUrl(data.url);
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

  useEffect(() => {
    getCurrentUserInfo().then(u => {
      setCurrentUser(u);
    });

    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find(s => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const scheduleType = settings.find(s => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      }

      const outOfHoursAction = settings.find(s => s.key === "outOfHoursAction");
      setOutOfHoursAction(outOfHoursAction?.value || "pending");

      const callType = settings.find(s => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find(s => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }

      const soundGroupNotifications = settings.find(
        s => s.key === "soundGroupNotifications"
      );
      setSoundGroupNotifications(soundGroupNotifications?.value || "disabled");

      const groupsTab = settings.find(s => s.key === "groupsTab");
      setGroupsTab(groupsTab?.value || "disabled");

      const chatbotAutoExit = settings.find(s => s.key === "chatbotAutoExit");
      if (chatbotAutoExit) {
        setChatbotAutoExit(chatbotAutoExit.value);
      }

      const showNumericIcons = settings.find(s => s.key === "showNumericIcons");
      setShowNumericIcons(showNumericIcons?.value || "disabled");

      const defaultLanguage = settings.find(s => s.key === "defaultLanguage");
      setDefaultLanguage(defaultLanguage?.value);

      const allowSignup = settings.find(s => s.key === "allowSignup");
      if (allowSignup) {
        setAllowSignup(allowSignup.value);
      }
      const quickMessages = settings.find(s => s.key === "quickMessages");
      setQuickMessages(quickMessages?.value || "individual");

      const keepUserAndQueue = settings.find(s => s.key === "keepUserAndQueue");
      setKeepUserAndQueue(keepUserAndQueue?.value || "enabled");

      const apiToken = settings.find(s => s.key === "apiToken");
      setApiToken(apiToken?.value || "");

      const openAiKey = settings.find(s => s.key === "openAiKey");
      setOpenAiKey(openAiKey?.value || "");

      setAiAgentProvider(
        settings.find(s => s.key === "aiAgentProvider")?.value || "openai"
      );
      setAiAgentApiKey(
        settings.find(s => s.key === "aiAgentApiKey")?.value || ""
      );
      setAiAgentModel(
        settings.find(s => s.key === "aiAgentModel")?.value || ""
      );
      const klipyApiKey = settings.find(s => s.key === "klipyApiKey");
      setKlipyApiKey(klipyApiKey?.value || "");

      const aiProvider = settings.find(s => s.key === "aiProvider");
      setAiProvider(aiProvider?.value || "openai");

      const audioTranscriptions = settings.find(
        s => s.key === "audioTranscriptions"
      );
      setAudioTranscriptions(audioTranscriptions?.value || "disabled");

      const useMultiThreadedWbot = settings.find(
        s => s.key === "useMultiThreadedWbot"
      );
      setUseMultiThreadedWbot(useMultiThreadedWbot?.value || "disabled");

      const uploadLimit = settings.find(s => s.key === "uploadLimit");
      setUploadLimit(uploadLimit?.value || "");

      const downloadLimit = settings.find(s => s.key === "downloadLimit");
      setDownloadLimit(downloadLimit?.value || "");

      const messageVisibility = settings.find(
        s => s.key === "messageVisibility"
      );
      setMessageVisibility(messageVisibility?.value || "message");

      const ratingsTimeout = settings.find(s => s.key === "ratingsTimeout");
      setRatingsTimeout(ratingsTimeout?.value || "5");

      const autoReopenTimeout = settings.find(
        s => s.key === "autoReopenTimeout"
      );
      setAutoReopenTimeout(autoReopenTimeout?.value || "0");

      const noQueueTimeout = settings.find(s => s.key === "noQueueTimeout");
      setNoQueueTimeout(noQueueTimeout?.value || "0");

      const noQueueTimeoutAction = settings.find(
        s => s.key === "noQueueTimeoutAction"
      );
      setNoQueueTimeoutAction(noQueueTimeoutAction?.value || "0");

      const openTicketTimeout = settings.find(
        s => s.key === "openTicketTimeout"
      );
      setOpenTicketTimeout(openTicketTimeout?.value || "0");

      const openTicketTimeoutAction = settings.find(
        s => s.key === "openTicketTimeoutAction"
      );
      setOpenTicketTimeoutAction(openTicketTimeoutAction?.value || "pending");

      const chatbotTicketTimeout = settings.find(
        s => s.key === "chatbotTicketTimeout"
      );
      setChatbotTicketTimeout(chatbotTicketTimeout?.value || "0");

      const chatbotTicketTimeoutAction = settings.find(
        s => s.key === "chatbotTicketTimeoutAction"
      );
      setChatbotTicketTimeoutAction(chatbotTicketTimeoutAction?.value || "0");

      const gracePeriod = settings.find(s => s.key === "gracePeriod");
      setGracePeriod(gracePeriod?.value || 0);

      const tagsMode = settings.find(s => s.key === "tagsMode");
      setTagsMode(tagsMode?.value || "ticket");

      const ticketAcceptedMessage = settings.find(
        s => s.key === "ticketAcceptedMessage"
      );
      setTicketAcceptedMessage(ticketAcceptedMessage?.value || "");

      const transferMessage = settings.find(s => s.key === "transferMessage");
      setTransferMessage(transferMessage?.value || "");

      const extensionDownloadUrl = settings.find(
        s => s.key === "extensionDownloadUrl"
      );
      setExtensionUrl(extensionDownloadUrl?.value || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    if (isMounted.current) {
      const loadQueues = async () => {
        const list = await findAllQueues();
        setQueues(list);
      };
      loadQueues();
    }
  }, []);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    await update({
      key: "userRating",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    await update({
      key: "scheduleType",
      value
    });
    i18nToast.success("settings.success");
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    await update({
      key: "call",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleChatbotAutoExit(value) {
    setChatbotAutoExit(value);
    await update({
      key: "chatbotAutoExit",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleQuickMessages(value) {
    setQuickMessages(value);
    await update({
      key: "quickMessages",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleAllowSignup(value) {
    setAllowSignup(value);
    await update({
      key: "allowSignup",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleDownloadLimit(value) {
    setDownloadLimit(value);
    await update({
      key: "downloadLimit",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleRatingsTimeout(value) {
    setRatingsTimeout(value);
    await update({
      key: "ratingsTimeout",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleAutoReopenTimeout(value) {
    setAutoReopenTimeout(value);
    await update({
      key: "autoReopenTimeout",
      value
    });
    i18nToast.success("settings.success");
  }

  async function handleSetting(key, value, setter = null) {
    if (setter) {
      setter(value);
    }
    await update({
      key,
      value
    });
    i18nToast.success("settings.success");
  }

  const [restartingBackend, setRestartingBackend] = useState(false);

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
      // Redirect to the transitional page; it will count down 30s then
      // redirect back to /settings.
      window.location.href = "/?restart=1";
    } catch (error) {
      setRestartingBackend(false);
      i18nToast.error("settings.restartBackend.error");
    }
  };

  async function generateApiToken() {
    const newToken = generateSecureToken(33);
    setApiToken(newToken);
    await update({
      key: "apiToken",
      value: newToken
    });
    i18nToast.success("settings.success");
  }

  async function deleteApiToken() {
    setApiToken("");
    await update({
      key: "apiToken",
      value: ""
    });
    i18nToast.success("settings.success");
  }

  async function copyApiToken() {
    copyToClipboard(apiToken);
    i18nToast.success("settings.copiedToClipboard");
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    await update({
      key: "CheckMsgIsGroup",
      value
    });
    i18nToast.success("settings.success");
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }

  return (
    <>
      <Grid spacing={3} container>
        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.general")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.general")}
          </Typography>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="ratings-label">
                {i18n.t("settings.validations.title")}
              </InputLabel>
              <Select
                labelId="ratings-label"
                value={userRating}
                onChange={async e => {
                  handleChangeUserRating(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.validations.options.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.validations.options.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.ratings")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="call-type-label">
                {i18n.t("settings.VoiceAndVideoCalls.title")}
              </InputLabel>
              <Select
                labelId="call-type-label"
                value={callType}
                onChange={async e => {
                  handleCallType(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.VoiceAndVideoCalls.options.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.VoiceAndVideoCalls.options.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.calls")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="group-type-label">
                {i18n.t("settings.AutomaticChatbotOutput.title")}
              </InputLabel>
              <Select
                labelId="chatbot-autoexit"
                value={chatbotAutoExit}
                onChange={async e => {
                  handleChatbotAutoExit(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.AutomaticChatbotOutput.options.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.AutomaticChatbotOutput.options.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.chatbotAutoExit")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="quickmessages-label">
                {i18n.t("settings.QuickMessages.title")}
              </InputLabel>
              <Select
                labelId="quickmessages-label"
                value={quickMessages}
                onChange={async e => {
                  handleQuickMessages(e.target.value);
                }}
              >
                <MenuItem value={"company"}>
                  {i18n.t("settings.QuickMessages.options.enabled")}
                </MenuItem>
                <MenuItem value={"individual"}>
                  {i18n.t("settings.QuickMessages.options.disabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.quickMessages")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="tags-mode-label">
                {i18n.t("settings.TagsMode.title")}
              </InputLabel>
              <Select
                labelId="tags-mode-label"
                value={tagsMode}
                onChange={async e => {
                  handleSetting("tagsMode", e.target.value, setTagsMode);
                }}
              >
                <MenuItem value={"ticket"}>
                  {i18n.t("settings.TagsMode.options.ticket")}
                </MenuItem>
                <MenuItem value={"contact"}>
                  {i18n.t("settings.TagsMode.options.contact")}
                </MenuItem>
                <MenuItem value={"both"}>
                  {i18n.t("settings.TagsMode.options.both")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.tagsMode")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="shownumericicons-label">
                {i18n.t("settings.ShowNumericEmoticons.title")}
              </InputLabel>
              <Select
                labelId="shownumericicons-label"
                value={showNumericIcons}
                onChange={async e => {
                  handleSetting(
                    "showNumericIcons",
                    e.target.value,
                    setShowNumericIcons
                  );
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("common.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("common.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.numericIcons")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={12} md={6} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="ticket-accepted-message-field"
                label={i18n.t("settings.ticketAcceptedMessage.title")}
                placeholder={i18n.t(
                  "settings.ticketAcceptedMessage.placeholder"
                )}
                variant="standard"
                multiline
                rows={4}
                value={ticketAcceptedMessage}
                onChange={e => {
                  setTicketAcceptedMessage(e.target.value);
                }}
                onBlur={e => {
                  handleSetting("ticketAcceptedMessage", ticketAcceptedMessage);
                }}
              />
              <span>
                {i18n.t("settings.mustacheVariables.title")}{" "}
                {"{{firstname}} {{name}} {{user}} {{queue}}"}
              </span>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.ticketAccepted")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={12} md={6} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="transfer-message-field"
                label={i18n.t("settings.transferMessage.title")}
                placeholder={i18n.t("settings.transferMessage.placeholder")}
                variant="standard"
                multiline
                rows={4}
                value={transferMessage}
                onChange={e => {
                  setTransferMessage(e.target.value);
                }}
                onBlur={e => {
                  handleSetting("transferMessage", transferMessage);
                }}
              />
              <span>
                {i18n.t("settings.mustacheVariables.title")}{" "}
                {"{{firstname}} {{name}} {{user}} {{queue}}"}
              </span>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.transfer")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.timeouts")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.timeouts")}
          </Typography>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="ratings-timeout-field"
                label="Timeout para avaliação (minutos)"
                variant="standard"
                name="ratingsTimeout"
                type="number"
                value={ratingsTimeout}
                onChange={e => {
                  setRatingsTimeout(e.target.value);
                }}
                onBlur={async _ => {
                  await handleRatingsTimeout(ratingsTimeout);
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.ratingsTimeout")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="autoreopen-timeout-field"
                label="Timeout para reabertura automática (minutos)"
                variant="standard"
                name="autoReopenTimeout"
                type="number"
                value={autoReopenTimeout}
                onChange={e => {
                  setAutoReopenTimeout(e.target.value);
                }}
                onBlur={async _ => {
                  await handleAutoReopenTimeout(autoReopenTimeout);
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.autoReopen")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="noqueue-timeout-field"
                label="Timeout para ticket sem fila (minutos)"
                variant="standard"
                name="noQueueTimeout"
                type="number"
                value={noQueueTimeout}
                onChange={e => {
                  setNoQueueTimeout(e.target.value);
                }}
                onBlur={async _ => {
                  await handleSetting("noQueueTimeout", noQueueTimeout);
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.noQueueTimeout")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="noqueue-timeout-action-label">
                Ação para timeout de ticket sem fila
              </InputLabel>
              <Select
                labelId="open-timeout-action-label"
                value={noQueueTimeoutAction}
                onChange={async e => {
                  handleSetting(
                    "noQueueTimeoutAction",
                    e.target.value,
                    setNoQueueTimeoutAction
                  );
                }}
              >
                <MenuItem value={"0"}>Fechar</MenuItem>
                {queues.map(queue => (
                  <MenuItem key={queue.id} value={queue.id}>
                    Transferir para {queue.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.noQueueTimeoutAction")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="openticket-timeout-field"
                label="Timeout para ticket em atendimento (minutos)"
                variant="standard"
                name="openTicketTimeout"
                type="number"
                value={openTicketTimeout}
                onChange={e => {
                  setOpenTicketTimeout(e.target.value);
                }}
                onBlur={async _ => {
                  await handleSetting("openTicketTimeout", openTicketTimeout);
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.openTicketTimeout")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="opentimeout-action-label">
                Ação para timeout de ticket aberto
              </InputLabel>
              <Select
                labelId="open-timeout-action-label"
                value={openTicketTimeoutAction}
                onChange={async e => {
                  handleSetting(
                    "openTicketTimeoutAction",
                    e.target.value,
                    setOpenTicketTimeoutAction
                  );
                }}
              >
                <MenuItem value={"pending"}>Retornar para a fila</MenuItem>
                <MenuItem value={"closed"}>Fechar atendimento</MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.openTicketTimeoutAction")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="chatbot-timeout-field"
                label={i18n.t("settings.chatbotTicketTimeout")}
                variant="standard"
                name="chatbotTicketTimeout"
                type="number"
                value={chatbotTicketTimeout}
                onChange={e => {
                  setChatbotTicketTimeout(e.target.value);
                }}
                onBlur={async _ => {
                  await handleSetting(
                    "chatbotTicketTimeout",
                    chatbotTicketTimeout
                  );
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.chatbotTimeout")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="chatbot-ticket-timeout-action-label">
                {i18n.t("settings.chatbotTicketTimeoutAction")}
              </InputLabel>
              <Select
                labelId="chatbot-ticket-timeout-action-label"
                value={chatbotTicketTimeoutAction}
                onChange={async e => {
                  handleSetting(
                    "chatbotTicketTimeoutAction",
                    e.target.value,
                    setChatbotTicketTimeoutAction
                  );
                }}
              >
                <MenuItem value={"0"}>{i18n.t("common.close")}</MenuItem>
                {queues.map(queue => (
                  <MenuItem key={queue.id} value={queue.id}>
                    {i18n.t("common.transferTo")} {queue.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.chatbotTimeoutAction")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.officeHours")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.officeHours")}
          </Typography>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="schedule-type-label">
                {i18n.t("settings.OfficeManagement.title")}
              </InputLabel>
              <Select
                labelId="schedule-type-label"
                value={scheduleType}
                onChange={async e => {
                  handleScheduleType(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.OfficeManagement.options.disabled")}
                </MenuItem>
                <MenuItem value={"queue"}>
                  {i18n.t(
                    "settings.OfficeManagement.options.ManagementByDepartment"
                  )}
                </MenuItem>
                <MenuItem value={"company"}>
                  {i18n.t(
                    "settings.OfficeManagement.options.ManagementByCompany"
                  )}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.officeHours")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="out-of-hours-action-label">
                {i18n.t("settings.outOfHoursAction.title")}
              </InputLabel>
              <Select
                labelId="out-of-hours-action-label"
                value={outOfHoursAction}
                onChange={async e => {
                  await handleSetting(
                    "outOfHoursAction",
                    e.target.value,
                    setOutOfHoursAction
                  );
                }}
              >
                <MenuItem value={"pending"}>
                  {i18n.t("settings.outOfHoursAction.options.pending")}
                </MenuItem>
                <MenuItem value={"closed"}>
                  {i18n.t("settings.outOfHoursAction.options.closed")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.outOfHours")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.groups")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.groups")}
          </Typography>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="group-type-label">
                {i18n.t("settings.IgnoreGroupMessages.title")}
              </InputLabel>
              <Select
                labelId="group-type-label"
                value={CheckMsgIsGroup}
                onChange={async e => {
                  handleGroupType(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.IgnoreGroupMessages.options.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.IgnoreGroupMessages.options.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.ignoreGroups")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="sound-group-notifications-label">
                {i18n.t("settings.soundGroupNotifications.title")}
              </InputLabel>
              <Select
                labelId="sound-group-notifications-label"
                value={soundGroupNotifications}
                onChange={async e => {
                  await handleSetting(
                    "soundGroupNotifications",
                    e.target.value,
                    setSoundGroupNotifications
                  );
                }}
              >
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.soundGroupNotifications.options.disabled")}
                </MenuItem>
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.soundGroupNotifications.options.enabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.soundGroups")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="groups-tab-label">
                {i18n.t("settings.groupsTab.title")}
              </InputLabel>
              <Select
                labelId="groups-tab-label"
                value={groupsTab}
                disabled={CheckMsgIsGroup === "enabled"}
                onChange={async e => {
                  await handleSetting(
                    "groupsTab",
                    e.target.value,
                    setGroupsTab
                  );
                }}
              >
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.groupsTab.options.enabled")}
                </MenuItem>
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.groupsTab.options.disabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.groupsTab")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.confidenciality")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.confidenciality")}
          </Typography>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="message-visibility-label">
                {i18n.t("settings.messageVisibility.title")}
              </InputLabel>
              <Select
                labelId="message-visibility-label"
                value={messageVisibility}
                onChange={async e => {
                  await handleSetting(
                    "messageVisibility",
                    e.target.value,
                    setMessageVisibility
                  );
                }}
              >
                <MenuItem value={"message"}>
                  {i18n.t(
                    "settings.messageVisibility.options.respectMessageQueue"
                  )}
                </MenuItem>
                <MenuItem value={"ticket"}>
                  {i18n.t(
                    "settings.messageVisibility.options.respectTicketQueue"
                  )}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.messageVisibility")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="keep-queue-and-user-label">
                {i18n.t("settings.keepQueueAndUser.title")}
              </InputLabel>
              <Select
                labelId="keep-queue-and-user-label"
                value={keepUserAndQueue}
                onChange={async e => {
                  await handleSetting(
                    "keepUserAndQueue",
                    e.target.value,
                    setKeepUserAndQueue
                  );
                }}
              >
                <MenuItem value={"enabled"}>
                  {i18n.t("settings.keepQueueAndUser.options.enabled")}
                </MenuItem>
                <MenuItem value={"disabled"}>
                  {i18n.t("settings.keepQueueAndUser.options.disabled")}
                </MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.keepQueueAndUser")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>{i18n.t("settings.group.api")}</h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.api")}
          </Typography>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="primary-color-light-field"
                label="API Token"
                variant="standard"
                value={apiToken}
                InputProps={{
                  endAdornment: (
                    <>
                      {apiToken && (
                        <>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => {
                              copyApiToken();
                            }}
                          >
                            <FontAwesomeIcon icon={faCopy} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="default"
                            onClick={() => {
                              deleteApiToken();
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </>
                      )}
                      {!apiToken && (
                        <IconButton
                          size="small"
                          color="default"
                          onClick={() => {
                            generateApiToken();
                          }}
                        >
                          <FontAwesomeIcon icon={faGears} />
                        </IconButton>
                      )}
                    </>
                  )
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.apiToken")}
            </Typography>
          </div>
        </Grid>

        <Grid item xs={12}>
          <h2 className={classes.groupTitle}>
            {i18n.t("settings.group.externalServices")}
          </h2>
          <Typography className={classes.groupHint}>
            {i18n.t("settings.hints.groups.externalServices")}
          </Typography>
        </Grid>

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="ai-provider-label">
                {i18n.t("settings.AIProvider.title")}
              </InputLabel>
              <Select
                labelId="ai-provider-label"
                value={aiProvider}
                onChange={async e => {
                  handleSetting("aiProvider", e.target.value, setAiProvider);
                }}
              >
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="groq">Groq</MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.aiProvider")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={12} md={8} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <TextField
                id="openai-key-field"
                label="AI Key"
                variant="standard"
                value={openAiKey}
                onChange={e => {
                  setOpenAiKey(e.target.value);
                }}
                onBlur={async _ => {
                  await handleSetting("openAiKey", openAiKey);
                }}
              />
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.aiKey")}
            </Typography>
          </div>
        </Grid>

        <Grid xs={12} sm={12} md={8} item>
          <div className={classes.fieldCard}>
            <Typography style={{ fontWeight: 700, marginBottom: 4 }}>
              Assistente de IA das filas
            </Typography>
            <Typography className={classes.hint} style={{ marginBottom: 12 }}>
              Chave usada pelas filas com o Assistente de IA ligado (Filas &
              Chatbot › editar fila › Assistente de IA). É diferente da chave de
              transcrição de áudio.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  label="Provedor"
                  variant="standard"
                  value={aiAgentProvider}
                  onChange={e =>
                    handleSetting(
                      "aiAgentProvider",
                      e.target.value,
                      setAiAgentProvider
                    )
                  }
                >
                  <MenuItem value="openai">OpenAI</MenuItem>
                  <MenuItem value="gemini">Google Gemini</MenuItem>
                  <MenuItem value="groq">Groq</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="API key da IA"
                  variant="standard"
                  value={aiAgentApiKey}
                  onChange={e => setAiAgentApiKey(e.target.value)}
                  onBlur={() =>
                    handleSetting("aiAgentApiKey", aiAgentApiKey.trim())
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Modelo (opcional)"
                  placeholder={
                    aiAgentProvider === "gemini"
                      ? "gemini-2.0-flash"
                      : aiAgentProvider === "groq"
                        ? "llama-3.3-70b-versatile"
                        : "gpt-4o-mini"
                  }
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  value={aiAgentModel}
                  onChange={e => setAiAgentModel(e.target.value)}
                  onBlur={() =>
                    handleSetting("aiAgentModel", aiAgentModel.trim())
                  }
                />
              </Grid>
            </Grid>
          </div>
        </Grid>

        {/* GIFs e figurinhas: uma chave só, do dono do sistema, vale para todas
            as empresas (o servidor usa a da empresa principal) */}
        {currentUser?.super && (
          <Grid xs={12} sm={12} md={8} item>
            <div className={classes.fieldCard}>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="klipy-key-field"
                  label={i18n.t("settings.klipyApiKey.title")}
                  variant="standard"
                  value={klipyApiKey}
                  onChange={e => setKlipyApiKey(e.target.value)}
                  onBlur={() =>
                    handleSetting("klipyApiKey", klipyApiKey.trim())
                  }
                />
              </FormControl>
              <Typography className={classes.hint}>
                {i18n.t("settings.hints.klipyKey")}
              </Typography>
            </div>
          </Grid>
        )}

        <Grid xs={12} sm={6} md={4} item>
          <div className={classes.fieldCard}>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="audio-transcriptions-label">
                {i18n.t("settings.AudioTranscriptions.title")}
              </InputLabel>
              <Select
                labelId="audio-transcriptions-label"
                value={audioTranscriptions}
                onChange={async e => {
                  handleSetting(
                    "audioTranscriptions",
                    e.target.value,
                    setAudioTranscriptions
                  );
                }}
              >
                <MenuItem value="disabled">
                  {i18n.t("common.disabled")}
                </MenuItem>
                <MenuItem value="enabled">{i18n.t("common.enabled")}</MenuItem>
              </Select>
            </FormControl>
            <Typography className={classes.hint}>
              {i18n.t("settings.hints.audioTranscriptions")}
            </Typography>
          </div>
        </Grid>

        <OnlyForSuperUser
          user={currentUser}
          yes={() => (
            <>
              <Grid item xs={12}>
                <h2 className={classes.groupTitle}>
                  {i18n.t("settings.group.serveradmin")}
                </h2>
                <Typography className={classes.groupHint}>
                  {i18n.t("settings.hints.groups.serveradmin")}
                </Typography>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <SelectLanguage
                  className={classes.selectContainer}
                  fullWidth
                  value={defaultLanguage}
                  onChange={async e => {
                    handleSetting(
                      "defaultLanguage",
                      e.target.value,
                      setDefaultLanguage
                    );
                  }}
                />
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.fieldCard}>
                  <FormControl className={classes.selectContainer}>
                    <InputLabel id="group-type-label">
                      {i18n.t("settings.AllowRegistration.title")}
                    </InputLabel>
                    <Select
                      labelId="allow-signup"
                      value={allowSignup}
                      onChange={async e => {
                        handleAllowSignup(e.target.value);
                      }}
                    >
                      <MenuItem value={"disabled"}>
                        {i18n.t("settings.AllowRegistration.options.disabled")}
                      </MenuItem>
                      <MenuItem value={"enabled"}>
                        {i18n.t("settings.AllowRegistration.options.enabled")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography className={classes.hint}>
                    {i18n.t("settings.hints.allowSignup")}
                  </Typography>
                </div>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.fieldCard}>
                  <FormControl className={classes.selectContainer}>
                    <InputLabel id="multithread-label">
                      {i18n.t("settings.MultiThreadedWbot.title")}
                    </InputLabel>
                    <Select
                      labelId="multithread-select"
                      value={useMultiThreadedWbot}
                      onChange={async e => {
                        handleSetting(
                          "useMultiThreadedWbot",
                          e.target.value,
                          setUseMultiThreadedWbot
                        );
                      }}
                    >
                      <MenuItem value={"disabled"}>
                        {i18n.t("settings.MultiThreadedWbot.options.disabled")}
                      </MenuItem>
                      <MenuItem value={"enabled"}>
                        {i18n.t("settings.MultiThreadedWbot.options.enabled")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Typography className={classes.hint}>
                    {i18n.t("settings.hints.multithread")}
                  </Typography>
                </div>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.fieldCard}>
                  <FormControl className={classes.selectContainer}>
                    <TextField
                      id="upload-limit-field"
                      label={i18n.t("settings.FileUploadLimit.title")}
                      variant="standard"
                      name="uploadLimit"
                      value={uploadLimit}
                      onChange={e => {
                        setUploadLimit(e.target.value);
                      }}
                      onBlur={async _ => {
                        await handleSetting("uploadLimit", uploadLimit);
                      }}
                    />
                  </FormControl>
                  <Typography className={classes.hint}>
                    {i18n.t("settings.hints.uploadLimit")}
                  </Typography>
                </div>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.fieldCard}>
                  <FormControl className={classes.selectContainer}>
                    <TextField
                      id="appname-field"
                      label={i18n.t("settings.FileDownloadLimit.title")}
                      variant="standard"
                      name="appName"
                      value={downloadLimit}
                      inputRef={downloadLimitInput}
                      onChange={e => {
                        setDownloadLimit(e.target.value);
                      }}
                      onBlur={async _ => {
                        await handleDownloadLimit(downloadLimit);
                      }}
                    />
                  </FormControl>
                  <Typography className={classes.hint}>
                    {i18n.t("settings.hints.downloadLimit")}
                  </Typography>
                </div>
              </Grid>

              <Grid xs={12} sm={6} md={4} item>
                <div className={classes.fieldCard}>
                  <FormControl className={classes.selectContainer}>
                    <TextField
                      id="grace-period-field"
                      label={i18n.t("settings.GracePeriod.title")}
                      variant="standard"
                      name="gracePeriod"
                      type="number"
                      value={gracePeriod}
                      onChange={e => {
                        setGracePeriod(e.target.value);
                      }}
                      onBlur={async _ => {
                        await handleSetting("gracePeriod", gracePeriod);
                      }}
                    />
                  </FormControl>
                  <Typography className={classes.hint}>
                    {i18n.t("settings.hints.gracePeriod")}
                  </Typography>
                </div>
              </Grid>

              <Grid xs={12} item>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap"
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={buildingExtension}
                    onClick={handleBuildExtension}
                  >
                    {buildingExtension
                      ? i18n.t("whitelabel.buildingExtension")
                      : i18n.t("whitelabel.buildExtension")}
                  </Button>
                  {extensionUrl && (
                    <Button
                      variant="outlined"
                      color="primary"
                      href={`${getBackendURL()}/public/${extensionUrl}?_=${Date.now()}`}
                      target="_blank"
                      rel="noopener"
                    >
                      {i18n.t("whitelabel.downloadExtension")}
                    </Button>
                  )}
                </div>
                <Typography className={classes.helperText}>
                  {i18n.t("whitelabel.extensionHint")}
                </Typography>
              </Grid>

              <Grid xs={12} item>
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={restartingBackend}
                  onClick={handleRestartBackend}
                >
                  {restartingBackend
                    ? i18n.t("settings.restartBackend.restarting")
                    : i18n.t("settings.restartBackend.button")}
                </Button>
              </Grid>
            </>
          )}
        />
      </Grid>
    </>
  );
}
