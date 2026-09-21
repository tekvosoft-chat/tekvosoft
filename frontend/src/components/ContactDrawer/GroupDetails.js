import React, { useEffect, useMemo, useRef, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import ButtonBase from "@material-ui/core/ButtonBase";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import IconButton from "@material-ui/core/IconButton";
import InputBase from "@material-ui/core/InputBase";
import TextField from "@material-ui/core/TextField";
import SearchRoundedIcon from "@material-ui/icons/SearchRounded";
import CloseRoundedIcon from "@material-ui/icons/CloseRounded";
import ExitToAppRoundedIcon from "@material-ui/icons/ExitToAppRounded";
import GroupAddOutlinedIcon from "@material-ui/icons/GroupAddOutlined";
import WhatsMarked from "react-whatsmarked";
import { toast } from "react-toastify";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { formatWhatsappDigits } from "../../helpers/formatWhatsappDisplay";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import ConfirmationModal from "../ConfirmationModal";

/**
 * Partes de "Dados do grupo", no desenho do WhatsApp: descrição com "Ler
 * mais", lista de membros (você primeiro, admins com selo, busca) e sair ou
 * voltar para o grupo. Os dados vêm de /groups/:ticketId.
 */

const g = (key, opts) => i18n.t(`contactDrawer.group.${key}`, opts);
const PAGE = 30;

export const useGroupInfo = (ticketId, enabled) => {
  const [state, setState] = useState({ loading: true, info: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !ticketId) return undefined;
    let alive = true;
    setState(prev => ({ ...prev, loading: true }));
    api
      .get(`/groups/${ticketId}`)
      .then(({ data }) => alive && setState({ loading: false, info: data }))
      .catch(() => alive && setState({ loading: false, info: null }));
    return () => {
      alive = false;
    };
  }, [ticketId, enabled, version]);

  return { ...state, reload: () => setVersion(v => v + 1) };
};

// fotos dos membros: só de quem aparece na tela, 4 pedidos por vez
const pictures = new Map();
const queue = [];
let running = 0;
function pump() {
  while (running < 4 && queue.length) {
    const job = queue.shift();
    running += 1;
    job().finally(release);
  }
}
function release() {
  running -= 1;
  pump();
}
const memberPicture = (ticketId, id) => {
  const key = `${ticketId}:${id}`;
  if (!pictures.has(key)) {
    pictures.set(
      key,
      new Promise(resolve => {
        queue.push(() =>
          api
            .get(`/groups/${ticketId}/picture`, { params: { id } })
            .then(({ data }) => resolve(data?.url || null))
            .catch(() => resolve(null))
        );
        pump();
      })
    );
  }
  return pictures.get(key);
};

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    description: {
      padding: "14px 16px",
      fontSize: "0.9375rem",
      lineHeight: 1.5,
      color: theme.palette.text.primary,
      whiteSpace: "pre-wrap",
      overflowWrap: "anywhere",
      "& .whatsmarked": { whiteSpace: "pre-wrap" }
    },
    clamp: {
      display: "-webkit-box",
      WebkitLineClamp: 3,
      WebkitBoxOrient: "vertical",
      overflow: "hidden"
    },
    readMore: {
      marginTop: 2,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: t.brand.text
    },
    membersHead: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      minHeight: 52,
      padding: "4px 8px 4px 16px",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    search: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      margin: "0 12px 8px",
      padding: "4px 12px",
      borderRadius: t.radius.pill,
      backgroundColor: t.surfaceSunken,
      color: theme.palette.text.secondary
    },
    member: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      width: "100%",
      minHeight: 64,
      padding: "8px 16px",
      textAlign: "left",
      justifyContent: "flex-start",
      transition: "background-color .12s ease",
      "&:hover": { backgroundColor: t.surfaceHover }
    },
    memberAvatar: {
      flex: "none",
      width: 46,
      height: 46,
      fontSize: "1rem",
      fontWeight: 700,
      color: "#FFFFFF"
    },
    memberText: { flex: 1, minWidth: 0 },
    memberName: {
      fontSize: "1rem",
      color: theme.palette.text.primary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    memberSub: {
      fontSize: "0.8125rem",
      color: theme.palette.text.secondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    },
    memberSide: {
      flex: "none",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: 4,
      fontSize: "0.75rem",
      color: theme.palette.text.secondary
    },
    adminBadge: {
      padding: "2px 8px",
      borderRadius: t.radius.sm,
      fontSize: "0.6875rem",
      fontWeight: 600,
      color: t.brand.text,
      backgroundColor: t.brand.textSoft,
      whiteSpace: "nowrap"
    },
    more: {
      width: "100%",
      minHeight: 48,
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: t.brand.text
    },
    hint: {
      padding: "12px 16px 16px",
      fontSize: "0.875rem",
      color: theme.palette.text.secondary
    },
    actionRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 16,
      width: "100%",
      minHeight: 52,
      padding: "0 16px",
      fontSize: "0.9375rem",
      fontWeight: 500,
      "& svg": { fontSize: 22 }
    },
    danger: {
      color: t.semantic.danger,
      "&:hover": { backgroundColor: t.semantic.dangerSoft }
    },
    brand: {
      color: t.brand.text,
      "&:hover": { backgroundColor: t.brand.textSoft }
    }
  };
});

/** Descrição do grupo, recolhida em 3 linhas. */
export const GroupDescription = ({ info, className }) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setLong(el.scrollHeight > el.clientHeight + 2);
  }, [info?.description]);

  if (!info?.description) return null;
  return (
    <div className={className}>
      <div className={classes.description}>
        <div ref={ref} className={open ? undefined : classes.clamp}>
          <WhatsMarked>{info.description}</WhatsMarked>
        </div>
        {(long || open) && (
          <ButtonBase
            className={classes.readMore}
            onClick={() => setOpen(v => !v)}
          >
            {open ? g("readLess") : g("readMore")}
          </ButtonBase>
        )}
      </div>
    </div>
  );
};

const MemberAvatar = ({ ticketId, member, className }) => {
  const [src, setSrc] = useState(member.profilePicUrl || null);
  const ref = useRef(null);

  useEffect(() => {
    if (member.profilePicUrl) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    let alive = true;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      memberPicture(ticketId, member.id).then(
        url => alive && url && setSrc(url)
      );
    });
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [ticketId, member.id, member.profilePicUrl]);

  // sem nome: o ícone padrão de pessoa, como no WhatsApp
  return (
    <Avatar
      ref={ref}
      src={src || undefined}
      className={className}
      style={{ backgroundColor: generateColor(member.number || member.id) }}
    >
      {member.name ? getInitials(member.name) : undefined}
    </Avatar>
  );
};

/** Membros do grupo: você primeiro, admins com selo, busca por nome/número. */
export const GroupMembers = ({
  info,
  ticketId,
  className,
  searchRef,
  onSelect
}) => {
  const classes = useStyles();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const inputRef = useRef(null);

  // o atalho "Pesquisar" do topo abre a busca daqui
  useEffect(() => {
    if (!searchRef) return;
    searchRef.current = () => {
      setSearching(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ block: "center" });
      }, 50);
    };
  }, [searchRef]);

  const members = useMemo(() => info?.participants || [], [info]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    const digits = q.replace(/\D/g, "");
    return members.filter(
      m =>
        String(m.name || "")
          .toLowerCase()
          .includes(q) ||
        (digits && String(m.number || "").includes(digits))
    );
  }, [members, query]);

  if (!members.length) return null;
  const visible = filtered.slice(0, shown);

  return (
    <div className={className}>
      <div className={classes.membersHead}>
        {g("members", { count: info.size || members.length })}
        <IconButton
          size="small"
          onClick={() => {
            setSearching(v => !v);
            setQuery("");
          }}
          aria-label={g("search")}
        >
          {searching ? <CloseRoundedIcon /> : <SearchRoundedIcon />}
        </IconButton>
      </div>
      {searching && (
        <label className={classes.search}>
          <SearchRoundedIcon fontSize="small" />
          <InputBase
            fullWidth
            inputRef={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder={g("search")}
          />
        </label>
      )}

      {visible.map(member => {
        const number = member.number ? formatWhatsappDigits(member.number) : "";
        const title = member.isMe ? g("you") : member.name || number || "—";
        return (
          <ButtonBase
            component="div"
            key={member.id}
            className={classes.member}
            disabled={member.isMe || !member.number}
            onClick={() => onSelect?.(member)}
          >
            <MemberAvatar
              ticketId={ticketId}
              member={member}
              className={classes.memberAvatar}
            />
            <div className={classes.memberText}>
              <div className={classes.memberName}>{title}</div>
              {member.isMe && number && (
                <div className={classes.memberSub}>{number}</div>
              )}
            </div>
            <div className={classes.memberSide}>
              {member.admin && (
                <span className={classes.adminBadge}>{g("admin")}</span>
              )}
              {!member.isMe && member.name && number && <span>{number}</span>}
            </div>
          </ButtonBase>
        );
      })}

      {filtered.length === 0 && (
        <div className={classes.hint}>{g("noResults")}</div>
      )}
      {filtered.length > shown && (
        <ButtonBase
          className={classes.more}
          onClick={() => setShown(n => n + 100)}
        >
          {shown === PAGE
            ? g("showAll", { count: filtered.length })
            : g("showMore")}
        </ButtonBase>
      )}
    </div>
  );
};

/** Sair do grupo (admin) ou voltar por link de convite. */
export const GroupMembership = ({
  info,
  ticketId,
  isAdmin,
  onChange,
  className
}) => {
  const classes = useStyles();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);

  if (!info || !isAdmin) return null;

  const leave = async () => {
    try {
      await api.post(`/groups/${ticketId}/leave`);
      toast.success(g("left"));
      onChange();
    } catch (err) {
      toastError(err);
    }
  };

  const join = async () => {
    setBusy(true);
    try {
      await api.post(`/groups/${ticketId}/join`, { link });
      toast.success(g("joined"));
      setJoinOpen(false);
      setLink("");
      onChange();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      {info.isMember ? (
        <ButtonBase
          className={`${classes.actionRow} ${classes.danger}`}
          onClick={() => setConfirmLeave(true)}
        >
          <ExitToAppRoundedIcon />
          {g("leave")}
        </ButtonBase>
      ) : (
        <>
          <div className={classes.hint}>{g("notMember")}</div>
          <ButtonBase
            className={`${classes.actionRow} ${classes.brand}`}
            onClick={() => setJoinOpen(true)}
          >
            <GroupAddOutlinedIcon />
            {g("join")}
          </ButtonBase>
        </>
      )}

      <ConfirmationModal
        title={g("leaveConfirmTitle")}
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={leave}
      >
        {g("leaveConfirmText")}
      </ConfirmationModal>

      <Dialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{g("joinTitle")}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            size="small"
            label={g("joinLink")}
            placeholder="https://chat.whatsapp.com/…"
            helperText={g("joinHint")}
            value={link}
            onChange={e => setLink(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinOpen(false)}>
            {i18n.t("common.cancel")}
          </Button>
          <Button
            color="primary"
            variant="contained"
            disableElevation
            disabled={!link.trim() || busy}
            onClick={join}
          >
            {g("join")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
