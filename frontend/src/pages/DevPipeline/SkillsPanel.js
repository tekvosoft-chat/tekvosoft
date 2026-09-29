import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import clsx from "clsx";
import moment from "moment";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import CircularProgress from "@material-ui/core/CircularProgress";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import InputBase from "@material-ui/core/InputBase";
import TextField from "@material-ui/core/TextField";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import SchoolRoundedIcon from "@material-ui/icons/SchoolRounded";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import BoxLoader from "../../components/ui/BoxLoader";
import EmptyState from "../../components/ui/EmptyState";
import ConfirmationModal from "../../components/ConfirmationModal";
import { SocketContext } from "../../context/Socket/SocketContext";
import { Markdown, brl, t, toneStyle } from "./shared";
import { agentName } from "./team";

/**
 * Skills do pipeline (só o super): o que os agentes sabem do projeto.
 * Ele ensina com texto livre (a IA organiza numa skill), escreve à mão,
 * aprova o que o Sabichão aprendeu com as correções e arquiva o que não
 * serve mais. Os agentes consomem só as skills em uso, e só as que a
 * triagem escolheu para cada tarefa.
 */
const FILTERS = ["active", "proposed", "archived"];

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    head: {
      display: "flex",
      alignItems: "flex-start",
      flexWrap: "wrap",
      gap: theme.spacing(1),
      marginBottom: theme.spacing(1.5)
    },
    intro: {
      flex: "1 1 320px",
      margin: 0,
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    actions: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      [theme.breakpoints.down("xs")]: { width: "100%" }
    },
    button: {
      borderRadius: tkv.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      boxShadow: "none",
      [theme.breakpoints.down("xs")]: { flex: "1 1 auto" }
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing(1),
      flexWrap: "wrap",
      marginBottom: theme.spacing(1.5)
    },
    pills: { display: "flex", gap: 6, flexWrap: "wrap" },
    pill: {
      height: 34,
      padding: "0 14px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      fontSize: "0.8125rem",
      fontWeight: 600,
      color: theme.palette.text.secondary,
      backgroundColor: tkv.surface,
      gap: 6
    },
    pillOn: {
      color: tkv.brand.text,
      borderColor: tkv.brand.main,
      backgroundColor: tkv.brand.textSoft
    },
    search: {
      flex: 1,
      minWidth: 200,
      maxWidth: 360,
      display: "flex",
      alignItems: "center",
      gap: 8,
      height: 38,
      padding: "0 14px",
      borderRadius: tkv.radius.pill,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      color: theme.palette.text.secondary,
      [theme.breakpoints.down("xs")]: { maxWidth: "none", flexBasis: "100%" }
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: theme.spacing(1.5),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down("xs")]: { gridTemplateColumns: "1fr" }
    },
    card: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      padding: theme.spacing(1.5),
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      backgroundColor: tkv.surface,
      minWidth: 0
    },
    cardProposed: { borderColor: tkv.semantic.warning },
    cardTop: { display: "flex", alignItems: "flex-start", gap: 8 },
    name: {
      flex: 1,
      minWidth: 0,
      fontSize: "0.9688rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      overflowWrap: "anywhere"
    },
    chip: {
      display: "inline-flex",
      alignItems: "center",
      height: 22,
      padding: "0 8px",
      borderRadius: tkv.radius.pill,
      fontSize: "0.6875rem",
      fontWeight: 700,
      whiteSpace: "nowrap"
    },
    description: { fontSize: "0.8438rem", color: theme.palette.text.secondary },
    content: {
      position: "relative",
      maxHeight: 150,
      overflow: "hidden",
      padding: theme.spacing(1, 1.25),
      borderRadius: tkv.radius.md,
      backgroundColor: tkv.surfaceSunken,
      fontSize: "0.8125rem",
      lineHeight: 1.5,
      overflowWrap: "anywhere",
      color: theme.palette.text.primary,
      "& p": { margin: "0 0 4px" },
      "& ul": { margin: 0, paddingLeft: 18 },
      "& code": { fontSize: "0.75rem" }
    },
    contentOpen: { maxHeight: "none" },
    fade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 36,
      background: `linear-gradient(transparent, ${tkv.surfaceSunken})`
    },
    reason: {
      padding: theme.spacing(0.75, 1),
      borderRadius: tkv.radius.md,
      fontSize: "0.8125rem",
      backgroundColor: tkv.semantic.warningSoft,
      color: theme.palette.text.primary
    },
    meta: { fontSize: "0.72rem", color: theme.palette.text.secondary },
    cardActions: { display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 },
    small: {
      borderRadius: tkv.radius.pill,
      textTransform: "none",
      fontWeight: 700,
      minWidth: 0
    },
    danger: { color: tkv.semantic.danger },
    paper: { borderRadius: tkv.radius.xl },
    mono: {
      "& textarea": {
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: "0.8125rem"
      }
    },
    field: { marginTop: theme.spacing(1.5) },
    dialogHint: {
      margin: 0,
      fontSize: "0.8125rem",
      fontWeight: 400,
      color: theme.palette.text.secondary
    }
  };
});

const sourceLabel = skill => {
  if (skill.source === "seed") return t("skills.source.seed");
  if (skill.source === "agent") {
    return skill.fromTask
      ? t("skills.source.agentFrom", {
          name: agentName("learner"),
          id: skill.fromTask.id
        })
      : agentName("learner");
  }
  return t("skills.source.human");
};

const SkillCard = ({ skill, onEdit, onAction }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const proposed = skill.status === "proposed";
  const long = (skill.content || "").length > 240;

  return (
    <article
      className={clsx(classes.card, { [classes.cardProposed]: proposed })}
    >
      <div className={classes.cardTop}>
        <span className={classes.name}>{skill.name}</span>
        <span
          className={classes.chip}
          style={toneStyle(
            theme,
            { seed: "neutral", agent: "danger", human: "brand" }[
              skill.source
            ] || "neutral"
          )}
        >
          {sourceLabel(skill)}
        </span>
      </div>
      <div className={classes.description}>{skill.description}</div>
      {proposed && (skill.reason || skill.replaces) && (
        <div className={classes.reason}>
          {skill.replaces
            ? t("skills.replaces", { name: skill.replaces.name })
            : t("skills.newProposal")}
          {skill.reason ? ` · ${skill.reason}` : ""}
        </div>
      )}
      <div className={clsx(classes.content, { [classes.contentOpen]: open })}>
        <Markdown text={showOld ? skill.replaces?.content : skill.content} />
        {long && !open && <span className={classes.fade} />}
      </div>
      <div className={classes.meta}>
        {t("skills.uses", { count: skill.uses || 0 })}
        {skill.lastUsedAt &&
          ` · ${t("skills.lastUsed", {
            date: moment(skill.lastUsedAt).format("DD/MM")
          })}`}
        {skill.costUsd > 0 && ` · ${brl(skill.costUsd)}`}
      </div>
      <div className={classes.cardActions}>
        {long && (
          <Button
            size="small"
            className={classes.small}
            onClick={() => setOpen(v => !v)}
          >
            {open ? t("skills.less") : t("skills.more")}
          </Button>
        )}
        {proposed && skill.replaces && (
          <Button
            size="small"
            className={classes.small}
            onClick={() => setShowOld(v => !v)}
          >
            {showOld ? t("skills.showNew") : t("skills.showOld")}
          </Button>
        )}
        {proposed ? (
          <>
            <Button
              size="small"
              variant="contained"
              color="primary"
              className={classes.small}
              onClick={() => onAction(skill, "approve")}
            >
              {t("skills.approve")}
            </Button>
            <Button
              size="small"
              className={clsx(classes.small, classes.danger)}
              onClick={() => onAction(skill, "discard")}
            >
              {t("skills.discard")}
            </Button>
          </>
        ) : (
          <>
            <Button
              size="small"
              className={classes.small}
              onClick={() => onEdit(skill)}
            >
              {t("actions.edit")}
            </Button>
            <Button
              size="small"
              className={classes.small}
              onClick={() =>
                onAction(
                  skill,
                  skill.status === "archived" ? "restore" : "archive"
                )
              }
            >
              {skill.status === "archived"
                ? t("skills.restore")
                : t("skills.archive")}
            </Button>
            {skill.source !== "seed" && (
              <Button
                size="small"
                className={clsx(classes.small, classes.danger)}
                onClick={() => onAction(skill, "delete")}
              >
                {t("actions.delete")}
              </Button>
            )}
          </>
        )}
      </div>
    </article>
  );
};

const SkillsPanel = ({ onCounts }) => {
  const classes = useStyles();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down("xs"));
  const socketManager = useContext(SocketContext);
  const [skills, setSkills] = useState(null);
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [teaching, setTeaching] = useState(false);
  const [lesson, setLesson] = useState("");
  const [working, setWorking] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/dev-skills");
      setSkills(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
      setSkills([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // o Sabichão aprende em segundo plano: a lista acompanha
  useEffect(() => {
    const socket = socketManager.GetSocket(localStorage.getItem("companyId"));
    const handler = () => load();
    socket.on("dev-skill", handler);
    return () => {
      socket.off?.("dev-skill", handler);
      socket.disconnect();
    };
  }, [socketManager, load]);

  const counts = useMemo(() => {
    const by = { active: 0, proposed: 0, archived: 0 };
    (skills || []).forEach(skill => {
      by[skill.status] = (by[skill.status] || 0) + 1;
    });
    return by;
  }, [skills]);

  useEffect(() => {
    if (skills) onCounts?.(counts);
  }, [counts, skills, onCounts]);

  // proposta nova merece atenção: abre na aba dela
  useEffect(() => {
    if (skills && counts.proposed && filter === "active" && !query) {
      setFilter("proposed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills === null]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (skills || [])
      .filter(skill => skill.status === filter)
      .filter(
        skill =>
          !q ||
          `${skill.name} ${skill.description} ${skill.content}`
            .toLowerCase()
            .includes(q)
      );
  }, [skills, filter, query]);

  const action = async (skill, kind) => {
    if (kind === "delete" || kind === "discard") {
      setConfirm({ skill, kind });
      return;
    }
    try {
      if (kind === "approve") await api.post(`/dev-skills/${skill.id}/approve`);
      if (kind === "archive") {
        await api.put(`/dev-skills/${skill.id}`, { status: "archived" });
      }
      if (kind === "restore") {
        await api.put(`/dev-skills/${skill.id}`, { status: "active" });
      }
      toast.success(t(`skills.toasts.${kind}`));
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/dev-skills/${confirm.skill.id}`);
      toast.success(t(`skills.toasts.${confirm.kind}`));
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const save = async () => {
    setWorking(true);
    try {
      const body = {
        name: editing.name,
        description: editing.description,
        content: editing.content
      };
      if (editing.id) await api.put(`/dev-skills/${editing.id}`, body);
      else await api.post("/dev-skills", body);
      setEditing(null);
      toast.success(t("skills.toasts.saved"));
      load();
    } catch (err) {
      toastError(err);
    }
    setWorking(false);
  };

  const teach = async () => {
    setWorking(true);
    try {
      const { data } = await api.post("/dev-skills/teach", { text: lesson });
      setTeaching(false);
      setLesson("");
      setFilter("active");
      toast.success(t("skills.toasts.taught", { name: data.name }));
      load();
    } catch (err) {
      toastError(err);
    }
    setWorking(false);
  };

  if (!skills) {
    return (
      <div style={{ padding: 48, display: "grid", placeItems: "center" }}>
        <BoxLoader size={48} />
      </div>
    );
  }

  return (
    <>
      <div className={classes.head}>
        <p className={classes.intro}>{t("skills.intro")}</p>
        <div className={classes.actions}>
          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            startIcon={<SchoolRoundedIcon />}
            onClick={() => setTeaching(true)}
          >
            {t("skills.teach")}
          </Button>
          <Button
            variant="outlined"
            className={classes.button}
            startIcon={<AddRoundedIcon />}
            onClick={() =>
              setEditing({ name: "", description: "", content: "" })
            }
          >
            {t("skills.new")}
          </Button>
        </div>
      </div>

      <div className={classes.toolbar}>
        <div className={classes.pills} role="tablist">
          {FILTERS.map(key => (
            <ButtonBase
              key={key}
              role="tab"
              aria-selected={filter === key}
              className={clsx(classes.pill, {
                [classes.pillOn]: filter === key
              })}
              onClick={() => setFilter(key)}
            >
              {t(`skills.filters.${key}`)} · {counts[key] || 0}
            </ButtonBase>
          ))}
        </div>
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            placeholder={t("skills.search")}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </label>
      </div>

      {shown.length ? (
        <div className={classes.grid}>
          {shown.map(skill => (
            <SkillCard
              key={skill.id}
              skill={skill}
              onEdit={item =>
                setEditing({
                  id: item.id,
                  name: item.name,
                  description: item.description,
                  content: item.content
                })
              }
              onAction={action}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SchoolRoundedIcon />}
          title={t(`skills.empty.${filter}`)}
          description={t("skills.emptyHint")}
        />
      )}

      <Dialog
        open={teaching}
        onClose={() => !working && setTeaching(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={phone}
        classes={{ paper: phone ? undefined : classes.paper }}
      >
        <DialogTitle>
          {t("skills.teachTitle")}
          <p className={classes.dialogHint}>{t("skills.teachHint")}</p>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={8}
            maxRows={18}
            variant="outlined"
            placeholder={t("skills.teachPlaceholder")}
            value={lesson}
            inputProps={{ maxLength: 8000 }}
            onChange={e => setLesson(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setTeaching(false)}>
            {t("actions.close")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!lesson.trim() || working}
            onClick={teach}
            startIcon={
              working && <CircularProgress size={14} color="inherit" />
            }
          >
            {working ? t("skills.teaching") : t("skills.teachSend")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editing}
        onClose={() => !working && setEditing(null)}
        fullWidth
        maxWidth="md"
        fullScreen={phone}
        classes={{ paper: phone ? undefined : classes.paper }}
      >
        <DialogTitle>
          {editing?.id ? t("skills.editTitle") : t("skills.newTitle")}
        </DialogTitle>
        {editing && (
          <DialogContent>
            <TextField
              fullWidth
              variant="outlined"
              label={t("skills.fields.name")}
              value={editing.name}
              inputProps={{ maxLength: 80 }}
              onChange={e => setEditing(v => ({ ...v, name: e.target.value }))}
            />
            <TextField
              fullWidth
              variant="outlined"
              label={t("skills.fields.description")}
              helperText={t("skills.fields.descriptionHint")}
              value={editing.description}
              inputProps={{ maxLength: 300 }}
              onChange={e =>
                setEditing(v => ({ ...v, description: e.target.value }))
              }
              className={classes.field}
            />
            <TextField
              fullWidth
              multiline
              minRows={10}
              maxRows={24}
              variant="outlined"
              label={t("skills.fields.content")}
              helperText={t("skills.fields.contentHint")}
              value={editing.content}
              inputProps={{ maxLength: 6000 }}
              onChange={e =>
                setEditing(v => ({ ...v, content: e.target.value }))
              }
              className={clsx(classes.field, classes.mono)}
            />
          </DialogContent>
        )}
        <DialogActions>
          <Button disabled={working} onClick={() => setEditing(null)}>
            {t("actions.close")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={
              working || !editing?.name?.trim() || !editing?.content?.trim()
            }
            onClick={save}
          >
            {t("actions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        title={
          confirm?.kind === "discard"
            ? t("skills.confirmDiscard")
            : t("skills.confirmDelete")
        }
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
      >
        {confirm?.skill?.name}
      </ConfirmationModal>
    </>
  );
};

export default SkillsPanel;
