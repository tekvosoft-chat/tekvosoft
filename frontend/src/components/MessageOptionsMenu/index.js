import React, { useState, useContext } from "react";
import PropTypes from "prop-types";

import MenuItem from "@material-ui/core/MenuItem";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ConfirmationModal from "../ConfirmationModal";
import { Menu } from "@material-ui/core";
import { ReplyMessageContext } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { EditMessageContext } from "../../context/EditingMessage/EditingMessageContext";
import toastError from "../../errors/toastError";
import MessageHistoryModal from "../MessageHistoryModal";
import MessageForwardModal from "../MessageForwardModal";
import { useStyles } from "./style";




const MessageOptionsMenu = ({
  message,
  data,
  menuOpen,
  handleClose,
  anchorEl
}) => {
  const classes = useStyles();
  const { setReplyingMessage } = useContext(ReplyMessageContext);
  const editingContext = useContext(EditMessageContext);
  const setEditingMessage = editingContext
    ? editingContext.setEditingMessage
    : null;

  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [messageHistoryOpen, setMessageHistoryOpen] = useState(false);

  const closeMenu = () => {
    handleClose();
  };


  const handleDeleteMessage = async () => {
    try {
      await api.delete(`/messages/${message.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenReactions = () => {
    // abre a ReactionBar ancorada no balão da mensagem
    closeMenu();
    try {
      window.dispatchEvent(
        new CustomEvent("vuup:open-reaction-bar", { detail: { message, data } })
      );
    } catch (e) {}
  };

  const handleReplyMessage = () => {
    setReplyingMessage(message);
    closeMenu();
  };

  const handleOpenConfirmationModal = e => {
    setConfirmationOpen(true);
    closeMenu();
  };

  const handleEditMessage = async () => {
    setEditingMessage(message);
    closeMenu();
  };

  const handleOpenMessageHistoryModal = e => {
    setMessageHistoryOpen(true);
    closeMenu();
  };

  const handleOpenForwardModal = e => {
    setForwardModalOpen(true);
    closeMenu();
  };

  const isSticker = data?.message && "stickerMessage" in data.message;

  return (
    <>
      <ConfirmationModal
        title={i18n.t("messageOptionsMenu.confirmationModal.title")}
        open={confirmationOpen}
        onClose={setConfirmationOpen}
        onConfirm={handleDeleteMessage}
      >
        {i18n.t("messageOptionsMenu.confirmationModal.message")}
      </ConfirmationModal>
      <MessageHistoryModal
        open={messageHistoryOpen}
        onClose={setMessageHistoryOpen}
        messageId={message.id}
      />
      <MessageForwardModal
        modalOpen={forwardModalOpen}
        onClose={setForwardModalOpen}
        ticketId={message.ticketId}
        messageId={message.id}
        message={message}
      />
      <Menu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right"
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right"
        }}
        open={menuOpen}
        onClose={closeMenu}
      >
        <div>
          <MenuItem key="react" onClick={handleOpenReactions}>
            {i18n.t("messagesList.reactions.react")}
          </MenuItem>
          {message.fromMe && [
            <MenuItem key="delete" onClick={handleOpenConfirmationModal}>
              {i18n.t("messageOptionsMenu.delete")}
            </MenuItem>,
            !isSticker && (
              <MenuItem key="edit" onClick={handleEditMessage}>
                {i18n.t("messageOptionsMenu.edit")}
              </MenuItem>
            )
          ]}
          {!isSticker &&
            (message.isEdited || message.oldMessages?.length > 0) && (
              <MenuItem key="history" onClick={handleOpenMessageHistoryModal}>
                {i18n.t("messageOptionsMenu.history")}
              </MenuItem>
            )}
          <MenuItem onClick={handleReplyMessage}>
            {i18n.t("messageOptionsMenu.reply")}
          </MenuItem>
          <MenuItem key="forward" onClick={handleOpenForwardModal}>
            {i18n.t("messageOptionsMenu.forward")}
          </MenuItem>
        </div>
      </Menu>
    </>
  );
};

MessageOptionsMenu.propTypes = {
  message: PropTypes.object,
  menuOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  anchorEl: PropTypes.object
};

export default MessageOptionsMenu;
