import React, { useContext, useEffect, useRef, useState } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import ButtonBase from "@material-ui/core/ButtonBase";
import UndoRoundedIcon from "@material-ui/icons/UndoRounded";
import SwapHorizRoundedIcon from "@material-ui/icons/SwapHorizRounded";
import EventRoundedIcon from "@material-ui/icons/EventRounded";
import DeleteOutlineRoundedIcon from "@material-ui/icons/DeleteOutlineRounded";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ScheduleModal from "../ScheduleModal";
import BottomSheet from "../ui/BottomSheet";
import toastError from "../../errors/toastError";
import { Can } from "../Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import { planAllows } from "../../helpers/planFeatures";

/**
 * Mais ações do atendimento.
 *
 * Cada opção tem ícone e uma linha dizendo o que acontece — "devolver" e
 * "transferir" confundiam quem estava começando. No computador abre um menu
 * junto do botão; no celular, um painel de baixo com botões grandes.
 */
const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    paper: {
      minWidth: 280,
      borderRadius: t.radius.lg,
      padding: "6px 0"
    },
    item: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 16px",
      whiteSpace: "normal"
    },
    icon: {
      flex: "none",
      width: 36,
      height: 36,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.brand.textSoft,
      color: t.brand.text,
      "& svg": { fontSize: 20 }
    },
    iconDanger: {
      backgroundColor: t.semantic.dangerSoft,
      color: t.semantic.danger
    },
    texts: { display: "flex", flexDirection: "column", minWidth: 0 },
    label: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      color: theme.palette.text.primary
    },
    labelDanger: { color: t.semantic.danger },
    hint: {
      fontSize: "0.75rem",
      color: theme.palette.text.secondary,
      lineHeight: 1.35
    },
    sheetList: { display: "flex", flexDirection: "column", gap: 4 },
    sheetItem: {
      width: "100%",
      justifyContent: "flex-start",
      textAlign: "left",
      borderRadius: t.radius.md,
      minHeight: 60,
      "&:active": { backgroundColor: t.surfaceHover }
    }
  };
});

const TicketOptionsMenu = ({
  ticket,
  menuOpen,
  handleClose,
  anchorEl,
  showTabGroups,
  onReturn,
  hideTransfer = false,
  sheet = false
}) => {
  const classes = useStyles();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleDeleteTicket = async () => {
    try {
      await api.delete(`/tickets/${ticket.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleCloseTransferTicketModal = () => {
    if (isMounted.current) {
      setTransferTicketModalOpen(false);
    }
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setContactId(null);
  };

  const a = key => i18n.t(`ticketHeaderActions.${key}`);
  const canTransfer =
    !hideTransfer &&
    (!ticket.isGroup || !showTabGroups || user.profile === "admin");

  const items = [
    onReturn && {
      key: "return",
      icon: <UndoRoundedIcon />,
      label: a("return"),
      hint: a("returnHint"),
      onClick: onReturn
    },
    canTransfer && {
      key: "transfer",
      icon: <SwapHorizRoundedIcon />,
      label: a("transfer"),
      hint: a("transferHint"),
      onClick: () => setTransferTicketModalOpen(true)
    },
    planAllows(user, "useSchedules") && {
      key: "schedule",
      icon: <EventRoundedIcon />,
      label: a("schedule"),
      hint: a("scheduleHint"),
      onClick: () => {
        setContactId(ticket.contact?.id);
        setScheduleModalOpen(true);
      }
    }
  ].filter(Boolean);

  const deleteItem = {
    key: "delete",
    icon: <DeleteOutlineRoundedIcon />,
    label: a("delete"),
    hint: a("deleteHint"),
    danger: true,
    onClick: () => setConfirmationOpen(true)
  };

  const content = item => (
    <>
      <span
        className={`${classes.icon}${item.danger ? ` ${classes.iconDanger}` : ""}`}
      >
        {item.icon}
      </span>
      <span className={classes.texts}>
        <span
          className={`${classes.label}${item.danger ? ` ${classes.labelDanger}` : ""}`}
        >
          {item.label}
        </span>
        <span className={classes.hint}>{item.hint}</span>
      </span>
    </>
  );

  const run = item => {
    handleClose();
    item.onClick();
  };

  return (
    <>
      {sheet ? (
        <BottomSheet
          open={menuOpen}
          onClose={handleClose}
          title={a("more")}
          subtitle={ticket.contact?.name}
        >
          <div className={classes.sheetList}>
            {items.map(item => (
              <ButtonBase
                key={item.key}
                className={`${classes.item} ${classes.sheetItem}`}
                onClick={() => run(item)}
              >
                {content(item)}
              </ButtonBase>
            ))}
            <Can
              role={user.profile}
              perform="ticket-options:deleteTicket"
              yes={() => (
                <ButtonBase
                  className={`${classes.item} ${classes.sheetItem}`}
                  onClick={() => run(deleteItem)}
                >
                  {content(deleteItem)}
                </ButtonBase>
              )}
            />
          </div>
        </BottomSheet>
      ) : (
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          getContentAnchorEl={null}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          keepMounted
          open={menuOpen}
          onClose={handleClose}
          classes={{ paper: classes.paper }}
        >
          {items.map(item => (
            <MenuItem
              key={item.key}
              className={classes.item}
              onClick={() => run(item)}
            >
              {content(item)}
            </MenuItem>
          ))}
          <Can
            role={user.profile}
            perform="ticket-options:deleteTicket"
            yes={() => [
              <Divider key="divider" style={{ margin: "6px 0" }} />,
              <MenuItem
                key="delete"
                className={classes.item}
                onClick={() => run(deleteItem)}
              >
                {content(deleteItem)}
              </MenuItem>
            ]}
          />
        </Menu>
      )}
      <ConfirmationModal
        title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")} #${
          ticket.id
        } ${ticket.contact?.name}?`}
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={handleDeleteTicket}
      >
        {i18n.t("ticketOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
      <TransferTicketModalCustom
        modalOpen={transferTicketModalOpen}
        onClose={handleCloseTransferTicketModal}
        ticketid={ticket.id}
        hideUserSelection={showTabGroups && ticket.isGroup}
      />
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={handleCloseScheduleModal}
        aria-labelledby="form-dialog-title"
        contactId={contactId}
      />
    </>
  );
};

export default TicketOptionsMenu;
