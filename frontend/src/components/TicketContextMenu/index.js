import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import clsx from "clsx";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Divider from "@material-ui/core/Divider";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import Popover from "@material-ui/core/Popover";
import Popper from "@material-ui/core/Popper";
import TextField from "@material-ui/core/TextField";
import VisibilityOutlinedIcon from "@material-ui/icons/VisibilityOutlined";
import MailOutlineRoundedIcon from "@material-ui/icons/MailOutlineRounded";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import HourglassEmptyRoundedIcon from "@material-ui/icons/HourglassEmptyRounded";
import SnoozeRoundedIcon from "@material-ui/icons/SnoozeRounded";
import ReportProblemOutlinedIcon from "@material-ui/icons/ReportProblemOutlined";
import LocalOfferOutlinedIcon from "@material-ui/icons/LocalOfferOutlined";
import AssignmentIndOutlinedIcon from "@material-ui/icons/AssignmentIndOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import OpenInNewRoundedIcon from "@material-ui/icons/OpenInNewRounded";
import FileCopyOutlinedIcon from "@material-ui/icons/FileCopyOutlined";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";
import ChevronRightRoundedIcon from "@material-ui/icons/ChevronRightRounded";
import ArrowBackRoundedIcon from "@material-ui/icons/ArrowBackRounded";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import useSettings from "../../hooks/useSettings";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import { formatWhatsappContactName } from "../../helpers/formatWhatsappDisplay";
import {
  formatSnooze,
  isSnoozed,
  snoozePresets,
  toLocalInput
} from "../../helpers/ticketSnooze";
import BottomSheet from "../ui/BottomSheet";
import UserAvatar from "../ui/UserAvatar";
import ConfirmationModal from "../ConfirmationModal";
import PriorityIcon, { PRIORITY_KEYS } from "../TicketPriority";

/**
 * Ações da conversa na lista: botão direito no computador, segurar o dedo
 * no celular.
 *
 * Os itens e os submenus são montados uma vez só e desenhados de dois
 * jeitos: no computador, um menu na posição do clique com submenus que
 * abrem ao lado; no celular, um painel que desce do topo, onde o submenu
 * troca o conteúdo do painel (com "voltar").
 */

const t = (key, values) => i18n.t(`ticketContextMenu.${key}`, values);

const useStyles = makeStyles(theme => {
  const tkv = theme.palette.tkv;
  return {
    paper: {
      minWidth: 236,
      maxWidth: 300,
      padding: "4px 0",
      borderRadius: tkv.radius.lg,
      border: `1px solid ${tkv.border}`,
      boxShadow: "0 16px 40px -12px rgba(12, 10, 20, 0.35)"
    },
    subPaper: {
      // nome + horário do "Adiar" na mesma linha
      maxWidth: 360,
      maxHeight: 340,
      overflowY: "auto",
      ...theme.scrollbarStyles
    },
    list: { padding: 0 },
    item: {
      gap: 10,
      minHeight: 34,
      margin: "0 4px",
      padding: "6px 10px",
      borderRadius: 8,
      fontSize: "0.875rem",
      color: theme.palette.text.primary,
      "&:hover, &.Mui-focusVisible": { backgroundColor: tkv.surfaceHover }
    },
    itemOpen: { backgroundColor: tkv.surfaceHover },
    icon: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      color: theme.palette.text.secondary,
      "& svg": { fontSize: 18 }
    },
    label: {
      flex: 1,
      minWidth: 0,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    secondary: {
      flex: "none",
      marginLeft: 12,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    chevron: {
      flex: "none",
      marginLeft: 8,
      fontSize: 18,
      color: theme.palette.text.secondary
    },
    check: { flex: "none", marginLeft: 8, fontSize: 18, color: tkv.brand.text },
    danger: {
      color: tkv.semantic.danger,
      "& $icon": { color: tkv.semantic.danger }
    },
    divider: { margin: "4px 0" },
    dot: { width: 10, height: 10, borderRadius: "50%" },
    note: {
      padding: "8px 14px",
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary
    },

    // celular: painel que desce do topo
    sheetSection: {
      display: "flex",
      flexDirection: "column",
      "& + &": {
        marginTop: 4,
        paddingTop: 4,
        borderTop: `1px solid ${tkv.border}`
      }
    },
    sheetItem: {
      justifyContent: "flex-start",
      gap: 14,
      width: "100%",
      minHeight: 46,
      padding: "0 10px",
      borderRadius: tkv.radius.md,
      fontSize: "0.9375rem",
      fontWeight: 500,
      textAlign: "left",
      color: theme.palette.text.primary,
      "&:active": { backgroundColor: tkv.surfaceHover },
      "& $icon": { width: 22 },
      "& $icon svg": { fontSize: 20 },
      // "Excluir" em vermelho também no painel (a cor acima venceria)
      "&$danger": { color: tkv.semantic.danger }
    },
    back: {
      justifyContent: "flex-start",
      gap: 10,
      width: "100%",
      minHeight: 42,
      marginBottom: 4,
      padding: "0 8px",
      borderRadius: tkv.radius.md,
      fontSize: "0.9375rem",
      fontWeight: 700,
      color: theme.palette.text.primary,
      "& svg": { fontSize: 20 }
    }
  };
});

const TicketContextMenu = ({
  ticket,
  open,
  position,
  sheet,
  showTabGroups,
  onClose,
  onPreview
}) => {
  const classes = useStyles();
  const history = useHistory();
  const { ticketId: routeTicketId } = useParams();
  const { user } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const { getSetting } = useSettings();

  // submenu aberto; no computador ele se prende ao item que o abriu
  const [view, setView] = useState(null);
  const [subAnchor, setSubAnchor] = useState(null);
  const [subFocus, setSubFocus] = useState(false);
  const hoverTimer = useRef(null);

  // listas dos submenus: só carregam quando alguém abre o submenu
  const [tags, setTags] = useState(null);
  const [tagSelection, setTagSelection] = useState([]);
  const [agents, setAgents] = useState(null);
  const [queues, setQueues] = useState(null);

  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) {
      clearTimeout(hoverTimer.current);
      setView(null);
      setSubAnchor(null);
    }
  }, [open]);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  useEffect(() => {
    if (view === "tags") {
      if (tags === null) {
        api
          .get("/tags/list")
          .then(({ data }) => setTags(data || []))
          .catch(err => {
            setTags([]);
            toastError(err);
          });
      }
      // as marcadas são as da conversa ou as do contato, conforme onde as
      // tags ficam (Configurações > Opções > Atendimento)
      getSetting("tagsMode", "ticket").then(mode => {
        const current =
          mode === "contact" ? ticket?.contact?.tags : ticket?.tags;
        setTagSelection(current || []);
      });
    }
    if (view === "agent" && agents === null) {
      api
        .get("/users/list")
        .then(({ data }) => setAgents(data || []))
        .catch(err => {
          setAgents([]);
          toastError(err);
        });
    }
    if (view === "queue" && queues === null) {
      api
        .get("/queue")
        .then(({ data }) => setQueues(data || []))
        .catch(err => {
          setQueues([]);
          toastError(err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  if (!ticket) return null;

  const isAdmin = user?.profile === "admin";
  const status = ticket.status;
  // mesma regra do servidor: admin sempre; os outros, no que está
  // aguardando ou no que é deles
  const canManage =
    isAdmin || status === "pending" || ticket.userId === user?.id;
  const canTransfer =
    canManage &&
    status !== "closed" &&
    (!ticket.isGroup || !showTabGroups || isAdmin);
  const snoozed = isSnoozed(ticket);
  const link = `${window.location.origin}/tickets/${ticket.uuid}`;
  const isCurrent = [ticket.uuid, String(ticket.id)].includes(
    String(routeTicketId)
  );

  const closeAll = () => {
    clearTimeout(hoverTimer.current);
    setView(null);
    setSubAnchor(null);
    onClose();
  };

  // faz a ação, avisa e, se era a conversa aberta, sai dela
  const act = async (request, { message, leave } = {}) => {
    try {
      await request();
      if (message) toast.success(message, { autoClose: 1800 });
      if (leave && isCurrent) {
        setCurrentTicket({ id: null, code: null });
        history.push("/tickets");
      }
    } catch (err) {
      toastError(err);
    }
  };

  const markUnread = () =>
    act(() => api.put(`/tickets/${ticket.id}/unread`), {
      message: t("toasts.unread"),
      // aberta, a conversa seria lida de novo na hora
      leave: true
    });

  const resolve = () =>
    act(
      () =>
        api.put(`/tickets/${ticket.id}`, {
          status: "closed",
          userId: user?.id
        }),
      { message: t("toasts.resolved"), leave: true }
    );

  const leavePending = () =>
    act(
      () =>
        api.put(`/tickets/${ticket.id}`, { status: "pending", userId: null }),
      { message: t("toasts.pending"), leave: true }
    );

  const snooze = until =>
    act(() => api.put(`/tickets/${ticket.id}/snooze`, { until }), {
      message: !until
        ? t("toasts.unsnoozed")
        : until === "reply"
          ? t("toasts.snoozedReply")
          : t("toasts.snoozed", { when: formatSnooze(until) }),
      leave: !!until
    });

  const setPriority = level =>
    act(() => api.put(`/tickets/${ticket.id}/priority`, { priority: level }));

  const toggleTag = tag => {
    const has = tagSelection.some(item => item.id === tag.id);
    const next = has
      ? tagSelection.filter(item => item.id !== tag.id)
      : [...tagSelection, tag];
    setTagSelection(next);
    act(() => api.post("/tags/sync", { ticketId: ticket.id, tags: next }));
  };

  const assignAgent = agent =>
    act(() => api.put(`/tickets/${ticket.id}`, { userId: agent.id }), {
      message: t("toasts.assigned", { name: agent.name }),
      leave: agent.id !== user?.id
    });

  const assignQueue = queue =>
    act(
      () =>
        api.put(`/tickets/${ticket.id}`, {
          queueId: queue.id,
          status: "pending",
          userId: null
        }),
      { message: t("toasts.queued", { name: queue.name }), leave: true }
    );

  const openNewTab = () => window.open(link, "_blank", "noopener,noreferrer");

  const copyLink = () => {
    copyToClipboard(link);
    toast.success(t("toasts.copied"), { autoClose: 1500 });
  };

  const removeTicket = () =>
    act(() => api.delete(`/tickets/${ticket.id}`), {
      message: t("toasts.deleted"),
      leave: true
    });

  // itens do menu, em blocos separados por linha (como no desenho pedido)
  const sections = [
    [
      status === "pending" &&
        onPreview && {
          key: "preview",
          icon: <VisibilityOutlinedIcon />,
          label: t("preview"),
          run: () => onPreview(ticket)
        },
      !ticket.unreadMessages &&
        canManage && {
          key: "unread",
          icon: <MailOutlineRoundedIcon />,
          label: t("markUnread"),
          run: markUnread
        }
    ],
    [
      canManage &&
        status !== "closed" && {
          key: "resolve",
          icon: <CheckRoundedIcon />,
          label: t("resolve"),
          run: resolve
        },
      canManage &&
        status === "open" && {
          key: "pending",
          icon: <HourglassEmptyRoundedIcon />,
          label: t("pending"),
          run: leavePending
        },
      canManage &&
        status !== "closed" && {
          key: "snooze",
          icon: <SnoozeRoundedIcon />,
          label: t("snooze"),
          sub: "snooze"
        }
    ],
    [
      canManage && {
        key: "priority",
        icon: <ReportProblemOutlinedIcon />,
        label: t("priority"),
        sub: "priority"
      },
      {
        key: "tags",
        icon: <LocalOfferOutlinedIcon />,
        label: t("tags"),
        sub: "tags"
      },
      canTransfer && {
        key: "agent",
        icon: <AssignmentIndOutlinedIcon />,
        label: t("agent"),
        sub: "agent"
      },
      canTransfer && {
        key: "queue",
        icon: <AccountTreeOutlinedIcon />,
        label: t("queue"),
        sub: "queue"
      }
    ],
    [
      {
        key: "newTab",
        icon: <OpenInNewRoundedIcon />,
        label: t("openNewTab"),
        run: openNewTab
      },
      {
        key: "copy",
        icon: <FileCopyOutlinedIcon />,
        label: t("copyLink"),
        run: copyLink
      }
    ],
    [
      isAdmin && {
        key: "delete",
        icon: <DeleteOutlineRoundedIcon />,
        label: t("delete"),
        danger: true,
        run: () => setConfirmDelete(true)
      }
    ]
  ]
    .map(section => section.filter(Boolean))
    .filter(section => section.length);

  const loadingRow = [{ key: "loading", note: t("loading") }];

  const subItems = key => {
    if (key === "snooze") {
      // só texto e horário, sem ícones: a coluna de horas fica alinhada
      return [
        snoozed && {
          key: "clear",
          label: t("snoozeOptions.clear"),
          run: () => snooze(null)
        },
        ...snoozePresets().map(preset => ({
          key: preset.key,
          label: t(`snoozeOptions.${preset.key}`),
          secondary:
            preset.until === "reply" ? null : formatSnooze(preset.until),
          run: () =>
            snooze(
              preset.until === "reply" ? "reply" : preset.until.toISOString()
            )
        })),
        {
          key: "custom",
          label: t("snoozeOptions.custom"),
          run: () => {
            const tomorrow = snoozePresets()[2].until;
            setCustomValue(toLocalInput(tomorrow));
            setCustomOpen(true);
          }
        }
      ].filter(Boolean);
    }
    if (key === "priority") {
      return PRIORITY_KEYS.map((level, value) => ({
        key: level,
        icon: <PriorityIcon level={value} />,
        label: t(`priorities.${level}`),
        checked: (ticket.priority || 0) === value,
        run: () => setPriority(value)
      }));
    }
    if (key === "tags") {
      if (tags === null) return loadingRow;
      if (!tags.length) return [{ key: "empty", note: t("empty.tags") }];
      return tags.map(tag => ({
        key: tag.id,
        icon: (
          <span
            className={classes.dot}
            style={{ backgroundColor: tag.color }}
          />
        ),
        label: tag.name,
        checked: tagSelection.some(item => item.id === tag.id),
        // várias etiquetas de uma vez: o submenu fica aberto
        keepOpen: true,
        run: () => toggleTag(tag)
      }));
    }
    if (key === "agent") {
      if (agents === null) return loadingRow;
      if (!agents.length) return [{ key: "empty", note: t("empty.agents") }];
      // eu primeiro: atribuir a si mesmo é o caso mais comum
      const sorted = [...agents].sort(
        (a, b) => (b.id === user?.id) - (a.id === user?.id)
      );
      return sorted.map(agent => ({
        key: agent.id,
        icon: <UserAvatar user={agent} size={20} />,
        label: agent.id === user?.id ? `${agent.name} ${t("me")}` : agent.name,
        checked: ticket.userId === agent.id,
        run: () => assignAgent(agent)
      }));
    }
    if (key === "queue") {
      if (queues === null) return loadingRow;
      if (!queues.length) return [{ key: "empty", note: t("empty.queues") }];
      return queues.map(queue => ({
        key: queue.id,
        icon: (
          <span
            className={classes.dot}
            style={{ backgroundColor: queue.color }}
          />
        ),
        label: queue.name,
        checked: ticket.queueId === queue.id,
        run: () => assignQueue(queue)
      }));
    }
    return [];
  };

  const run = item => {
    if (!item.keepOpen) closeAll();
    item.run();
  };

  // ---- computador ------------------------------------------------------

  const openSub = (key, element, focus = false) => {
    clearTimeout(hoverTimer.current);
    setView(key);
    setSubAnchor(element);
    setSubFocus(focus);
  };

  // um instante antes de trocar: quem vai na diagonal até o submenu passa
  // por cima de outros itens e não deve fechá-lo no caminho
  const hoverItem = (item, element) => {
    clearTimeout(hoverTimer.current);
    if (item.sub === view) return;
    hoverTimer.current = setTimeout(() => {
      if (item.sub) openSub(item.sub, element);
      else {
        setView(null);
        setSubAnchor(null);
      }
    }, 140);
  };

  const menuRow = (item, { inSub = false } = {}) => {
    if (item.note) {
      return (
        <div key={item.key} className={classes.note}>
          {item.note}
        </div>
      );
    }
    return (
      <MenuItem
        key={item.key}
        className={clsx(classes.item, {
          [classes.danger]: item.danger,
          [classes.itemOpen]: !inSub && item.sub && view === item.sub
        })}
        onMouseEnter={
          inSub
            ? () => clearTimeout(hoverTimer.current)
            : e => hoverItem(item, e.currentTarget)
        }
        onClick={e =>
          item.sub ? openSub(item.sub, e.currentTarget, true) : run(item)
        }
        onKeyDown={e => {
          if (item.sub && e.key === "ArrowRight") {
            e.preventDefault();
            openSub(item.sub, e.currentTarget, true);
          }
        }}
        aria-haspopup={item.sub ? "menu" : undefined}
        aria-expanded={item.sub ? view === item.sub : undefined}
      >
        {item.icon && <span className={classes.icon}>{item.icon}</span>}
        <span className={classes.label}>{item.label}</span>
        {item.secondary && (
          <span className={classes.secondary}>{item.secondary}</span>
        )}
        {item.checked && <CheckRoundedIcon className={classes.check} />}
        {item.sub && <ChevronRightRoundedIcon className={classes.chevron} />}
      </MenuItem>
    );
  };

  const desktop = (
    <>
      <Popover
        open={open && !sheet}
        onClose={closeAll}
        anchorReference="anchorPosition"
        anchorPosition={
          position ? { top: position.y, left: position.x } : undefined
        }
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        classes={{ paper: classes.paper }}
        // o submenu vive fora do menu e precisa receber o foco
        disableEnforceFocus
        transitionDuration={{ enter: 120, exit: 80 }}
        onContextMenu={e => {
          e.preventDefault();
          closeAll();
        }}
      >
        <MenuList autoFocusItem={open} className={classes.list}>
          {sections.flatMap((section, index) => [
            index > 0 && (
              <Divider key={`divider-${index}`} className={classes.divider} />
            ),
            ...section.map(item => menuRow(item))
          ])}
        </MenuList>
      </Popover>
      <Popper
        open={open && !sheet && !!view && !!subAnchor}
        anchorEl={subAnchor}
        placement="right-start"
        style={{ zIndex: 1301 }}
        modifiers={{
          offset: { offset: "-5,6" },
          flip: { enabled: true },
          preventOverflow: { boundariesElement: "viewport", padding: 8 }
        }}
      >
        <Paper
          className={clsx(classes.paper, classes.subPaper)}
          onMouseEnter={() => clearTimeout(hoverTimer.current)}
        >
          <MenuList
            autoFocusItem={subFocus}
            className={classes.list}
            onKeyDown={e => {
              if (e.key === "ArrowLeft" || e.key === "Escape") {
                e.preventDefault();
                const parent = subAnchor;
                setView(null);
                setSubAnchor(null);
                parent?.focus();
              }
            }}
          >
            {view && subItems(view).map(item => menuRow(item, { inSub: true }))}
          </MenuList>
        </Paper>
      </Popper>
    </>
  );

  // ---- celular ---------------------------------------------------------

  const sheetRow = item =>
    item.note ? (
      <div key={item.key} className={classes.note}>
        {item.note}
      </div>
    ) : (
      <ButtonBase
        key={item.key}
        className={clsx(classes.sheetItem, { [classes.danger]: item.danger })}
        onClick={() => (item.sub ? setView(item.sub) : run(item))}
      >
        {item.icon && <span className={classes.icon}>{item.icon}</span>}
        <span className={classes.label}>{item.label}</span>
        {item.secondary && (
          <span className={classes.secondary}>{item.secondary}</span>
        )}
        {item.checked && <CheckRoundedIcon className={classes.check} />}
        {item.sub && <ChevronRightRoundedIcon className={classes.chevron} />}
      </ButtonBase>
    );

  const subTitle = key =>
    ({
      snooze: t("snooze"),
      priority: t("priority"),
      tags: t("tags"),
      agent: t("agent"),
      queue: t("queue")
    })[key];

  const mobile = (
    <BottomSheet
      anchor="top"
      open={open && !!sheet}
      onClose={closeAll}
      title={formatWhatsappContactName(ticket.contact, ticket)}
      subtitle={`#${ticket.id} · ${
        ticket.queue?.name || i18n.t("ticketActions.noQueue")
      }`}
    >
      {view ? (
        <>
          <ButtonBase className={classes.back} onClick={() => setView(null)}>
            <ArrowBackRoundedIcon />
            {subTitle(view)}
          </ButtonBase>
          <div className={classes.sheetSection}>
            {subItems(view).map(sheetRow)}
          </div>
        </>
      ) : (
        sections.map((section, index) => (
          <div key={index} className={classes.sheetSection}>
            {section.map(sheetRow)}
          </div>
        ))
      )}
    </BottomSheet>
  );

  return (
    <>
      {desktop}
      {mobile}
      <Dialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t("snoozeDialog.title")}</DialogTitle>
        <DialogContent>
          <TextField
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={customValue}
            onChange={e => setCustomValue(e.target.value)}
            inputProps={{ min: toLocalInput(new Date()) }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomOpen(false)}>
            {t("snoozeDialog.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disabled={!customValue}
            onClick={() => {
              setCustomOpen(false);
              snooze(new Date(customValue).toISOString());
            }}
          >
            {t("snoozeDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
      <ConfirmationModal
        title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")} #${
          ticket.id
        } ${ticket.contact?.name || ""}?`}
        open={confirmDelete}
        onClose={setConfirmDelete}
        onConfirm={removeTicket}
      >
        {i18n.t("ticketOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
    </>
  );
};

export default TicketContextMenu;
