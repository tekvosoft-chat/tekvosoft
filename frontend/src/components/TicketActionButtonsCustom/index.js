import React, { useContext, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { Button, IconButton, useMediaQuery } from "@material-ui/core";
import { toast } from "react-toastify";
import CheckRoundedIcon from "@material-ui/icons/CheckRounded";
import SwapHorizRoundedIcon from "@material-ui/icons/SwapHorizRounded";
import TransferTicketPanel from "../TransferTicketPanel";
import { MoreVert, Replay } from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { Call, CallEnd } from "@material-ui/icons";
import Tooltip from "@material-ui/core/Tooltip";
import { PhoneCallContext } from "../../context/PhoneCall/PhoneCallContext";
import { wavoipAvailable, wavoipCall } from "../../helpers/wavoipCallManager";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    actionButtons: {
      marginRight: 8,
      flex: "none",
      display: "flex",
      alignItems: "center",
      alignSelf: "center",
      marginLeft: "auto",
      gap: 8,
      // No celular os botões apertam: o nome do contato precisa do espaço
      [theme.breakpoints.down("xs")]: {
        marginRight: 2,
        gap: 2,
        "& .MuiIconButton-root": { padding: 8 },
        "& .MuiSvgIcon-root": { fontSize: 22 }
      }
    },
    // celular: ícones na cor da marca, como os do WhatsApp do iPhone
    phoneButtons: {
      "& .MuiIconButton-root": { color: t.brand.text },
      "& .MuiSvgIcon-root": { fontSize: "24px !important" }
    },
    pill: {
      position: "relative",
      height: 36,
      padding: "0 14px",
      borderRadius: t.radius.pill,
      fontWeight: 700,
      fontSize: "0.8125rem",
      textTransform: "none",
      whiteSpace: "nowrap",
      boxShadow: "none",
      "& .MuiButton-startIcon": { marginRight: 6 },
      "&:hover": { boxShadow: "none" }
    },
    resolve: {
      backgroundColor: t.semantic.success,
      color: "#FFFFFF",
      "&:hover": {
        backgroundColor: t.semantic.success,
        filter: "brightness(0.92)"
      }
    },
    outline: {
      color: t.brand.text,
      borderColor: t.brand.textBorder,
      "&:hover": {
        backgroundColor: t.brand.textSoft,
        borderColor: t.brand.text
      }
    },
    // rótulo some em telas médias: fica só o ícone, com a dica ao passar o mouse
    label: {
      [theme.breakpoints.down("sm")]: { display: "none" }
    },
    compact: {
      minWidth: 36,
      [theme.breakpoints.down("sm")]: {
        padding: 0,
        width: 36,
        "& .MuiButton-startIcon": { margin: 0 }
      }
    },
    phoneResolve: {
      width: 38,
      height: 38,
      padding: "0 !important",
      backgroundColor: t.semantic.successSoft,
      color: `${t.semantic.success} !important`,
      "& .MuiSvgIcon-root": { fontSize: "22px !important" }
    },
    more: {
      width: 36,
      height: 36,
      color: theme.palette.text.secondary
    }
  };
});

const TicketActionButtonsCustom = ({ ticket, showTabGroups }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const history = useHistory();
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferAnchor, setTransferAnchor] = useState(null);
  const ticketOptionsMenuOpen = Boolean(anchorEl);
  const a = key => i18n.t(`ticketHeaderActions.${key}`);
  // grupos na aba de grupos não têm resolver/devolver/transferir no topo
  const canHandle = !showTabGroups || !ticket.isGroup;
  const { user } = useContext(AuthContext);
  const { setCurrentTicket } = useContext(TicketsContext);
  const phoneContext = useContext(PhoneCallContext);

  const handleOpenTicketOptionsMenu = e => {
    setAnchorEl(e.currentTarget);
  };

  const handleCloseTicketOptionsMenu = e => {
    setAnchorEl(null);
  };

  const handleUpdateTicketStatus = async (e, status, userId) => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: status,
        userId: userId || null
      });

      setLoading(false);
      if (status === "closed") {
        toast.success(a("resolved"), { autoClose: 1800 });
      }
      if (status === "open") {
        setCurrentTicket({ ...ticket, code: "#open" });
      } else {
        setCurrentTicket({ id: null, code: null });
        history.push("/tickets");
      }
    } catch (err) {
      setLoading(false);
      toastError(err);
    }
  };

  const handleCall = async () => {
    wavoipCall(ticket, () => {
      phoneContext.disconnect();
    })
      .then(wavoipInstance => {
        phoneContext.updateCurrentCall({
          contact: ticket.contact,
          whatsapp: ticket.whatsapp,
          disconnect: () => {
            window.wavoipCallingSound.stop();
            wavoipInstance.endCall();
          }
        });
      })
      .catch(err => {
        toastError(err);
      });
  };

  return (
    <div
      className={`${classes.actionButtons}${isPhone ? ` ${classes.phoneButtons}` : ""}`}
    >
      {ticket.status === "closed" && (!showTabGroups || !ticket.isGroup) && (
        <>
          {user.profile === "admin" && (
            <Tooltip title={i18n.t("messagesList.header.buttons.reopen")}>
              {isPhone ? (
                <IconButton
                  onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
                >
                  <Replay />
                </IconButton>
              ) : (
                <Button
                  variant="outlined"
                  className={`${classes.pill} ${classes.outline} ${classes.compact}`}
                  startIcon={<Replay />}
                  onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
                >
                  <span className={classes.label}>{a("reopen")}</span>
                </Button>
              )}
            </Tooltip>
          )}
        </>
      )}
      {(ticket.status === "open" || (showTabGroups && ticket.isGroup)) && (
        <>
          {wavoipAvailable() &&
            phoneContext &&
            !phoneContext.currentCall &&
            ticket.whatsapp?.wavoip?.token &&
            !ticket.contact?.isGroup && (
              <Tooltip title={i18n.t("messagesList.header.buttons.call")}>
                <IconButton onClick={handleCall}>
                  <Call />
                </IconButton>
              </Tooltip>
            )}

          {wavoipAvailable() &&
            phoneContext &&
            phoneContext.currentCall &&
            phoneContext.currentCall.contact.id === ticket.contact?.id &&
            phoneContext.currentCall.whatsapp.id === ticket.whatsapp?.id && (
              <Tooltip title={i18n.t("messagesList.header.buttons.endCall")}>
                <IconButton onClick={phoneContext.disconnect}>
                  <CallEnd />
                </IconButton>
              </Tooltip>
            )}

          {canHandle && !isPhone && (
            <Tooltip title={a("transferHint")}>
              <Button
                variant="outlined"
                className={`${classes.pill} ${classes.outline} ${classes.compact}`}
                startIcon={<SwapHorizRoundedIcon />}
                onClick={e => {
                  setTransferAnchor(e.currentTarget);
                  setTransferOpen(open => !open);
                }}
              >
                <span className={classes.label}>{a("transfer")}</span>
              </Button>
            </Tooltip>
          )}

          {canHandle &&
            (isPhone ? (
              <IconButton
                className={classes.phoneResolve}
                aria-label={a("resolve")}
                disabled={loading}
                onClick={() =>
                  handleUpdateTicketStatus(null, "closed", user?.id)
                }
              >
                <CheckRoundedIcon />
              </IconButton>
            ) : (
              <Tooltip title={a("resolveHint")}>
                <Button
                  variant="contained"
                  className={`${classes.pill} ${classes.resolve} ${classes.compact}`}
                  startIcon={<CheckRoundedIcon />}
                  disabled={loading}
                  onClick={() =>
                    handleUpdateTicketStatus(null, "closed", user?.id)
                  }
                >
                  <span className={classes.label}>{a("resolve")}</span>
                </Button>
              </Tooltip>
            ))}

          <Tooltip title={a("more")}>
            <IconButton
              className={isPhone ? undefined : classes.more}
              aria-label={a("more")}
              onClick={handleOpenTicketOptionsMenu}
            >
              <MoreVert />
            </IconButton>
          </Tooltip>
          <TicketOptionsMenu
            ticket={ticket}
            anchorEl={anchorEl}
            menuOpen={ticketOptionsMenuOpen}
            handleClose={handleCloseTicketOptionsMenu}
            showTabGroups={showTabGroups}
            sheet={isPhone}
            hideTransfer={!isPhone && canHandle}
            onReturn={
              canHandle
                ? () => handleUpdateTicketStatus(null, "pending", null)
                : undefined
            }
          />
          <TransferTicketPanel
            anchorEl={transferAnchor}
            open={transferOpen}
            onClose={() => setTransferOpen(false)}
            ticketid={ticket.id}
            hideUserSelection={showTabGroups && ticket.isGroup}
          />
        </>
      )}
      {ticket.status === "pending" && (!showTabGroups || !ticket.isGroup) && (
        <ButtonWithSpinner
          loading={loading}
          size="small"
          variant="contained"
          color="primary"
          className={classes.pill}
          onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
        >
          {i18n.t("messagesList.header.buttons.accept")}
        </ButtonWithSpinner>
      )}
    </div>
  );
};

export default TicketActionButtonsCustom;
