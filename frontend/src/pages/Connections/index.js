import React, { useState, useCallback, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { Button, Typography } from "@material-ui/core";
import AddRoundedIcon from "@material-ui/icons/AddRounded";

import MainContainer from "../../components/MainContainer";
import PageLoader from "../../components/ui/PageLoader";
import {
  InstanceCard,
  InstanceDetails,
  InstanceGrid,
  NewInstanceCard
} from "./InstanceCards";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import InboxWizard from "../../components/InboxWizard";
import WebchatForm from "../../components/InboxWizard/WebchatForm";
import WebchatSettings from "../../components/InboxWizard/WebchatSettings";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import PasskeyModal from "../../components/PasskeyModal";
import PrivacyModal from "../../components/PrivacyModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import WavoipModal from "../../components/WavoipModal";

const useStyles = makeStyles(theme => {
  const t = theme.palette.tkv;
  return {
    page: {
      overflowY: "auto",
      ...theme.scrollbarStyles,
      // a página rola inteira: nenhum bloco pode ser espremido pela altura
      "& > div > *": { flexShrink: 0 }
    },
    head: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: theme.spacing(1.5)
    },
    titleBox: { flex: 1, minWidth: 180 },
    title: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
      color: theme.palette.text.primary
    },
    subtitle: { fontSize: "0.875rem", color: theme.palette.text.secondary },
    add: {
      height: 42,
      borderRadius: 999,
      padding: "0 18px",
      fontWeight: 700,
      textTransform: "none"
    },
    center: { display: "flex", justifyContent: "center", padding: 40 },
    brand: { color: t.brand.text }
  };
});

const Connections = () => {
  const classes = useStyles();

  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  // escolha do canal antes do formulário: cada canal se conecta de um jeito
  const [wizardOpen, setWizardOpen] = useState(false);
  const [webchatOpen, setWebchatOpen] = useState(false);
  // ajustes da caixa do site (a bolinha), incluindo o script para copiar
  const [webchatInbox, setWebchatInbox] = useState(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(
    confirmationModalInitialState
  );
  const [wavoipModalOpen, setWavoipModalOpen] = useState(false);
  const [passkeyModalOpen, setPasskeyModalOpen] = useState(false);
  const [passkeyInitialToken, setPasskeyInitialToken] = useState("");
  const [connectorReady, setConnectorReady] = useState(false);
  const [details, setDetails] = useState(null);
  // o painel acompanha a instância ao vivo (status muda pelo socket)
  const detailsWhatsApp = details
    ? (whatsApps || []).find(w => w.id === details.id)
    : null;

  const handleStartWhatsAppSession = async whatsAppId => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async whatsAppId => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  // "adicionar caixa de entrada" abre a escolha do canal; o formulário vem
  // depois, de acordo com o que a pessoa escolher
  const handleChooseChannel = channel => {
    setWizardOpen(false);
    if (channel.id === "whatsapp") {
      setSelectedWhatsApp(null);
      setWhatsAppModalOpen(true);
    }
    if (channel.id === "webchat") {
      setWebchatOpen(true);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

  const handleOpenQrModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleOpenPasskeyModal = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setPasskeyModalOpen(true);
  };

  const handleResetPasskeySession = async whatsAppId => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}/reset`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleClosePasskeyModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setPasskeyInitialToken("");
    setPasskeyModalOpen(false);
  }, [setPasskeyModalOpen, setSelectedWhatsApp, setPasskeyInitialToken]);

  const handleTriggerCaptureFromQr = useCallback(
    token => {
      setQrModalOpen(false);
      setPasskeyInitialToken(token);
      setPasskeyModalOpen(true);
    },
    [setQrModalOpen, setPasskeyInitialToken, setPasskeyModalOpen]
  );

  const handleOpenInstallInstructionsFromQr = useCallback(() => {
    setQrModalOpen(false);
    setPasskeyInitialToken("");
    setPasskeyModalOpen(true);
  }, [setQrModalOpen, setPasskeyInitialToken, setPasskeyModalOpen]);

  const handleEditWhatsApp = whatsApp => {
    // a caixa do site tem a sua própria tela: cor, textos, o que a janela
    // mostra e o script para colar
    if (whatsApp.channel === "webchat") {
      setWebchatInbox(whatsApp);
      return;
    }
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const handleOpenPrivacyWhatsApp = whatsApp => {
    setSelectedWhatsApp(whatsApp);
    setPrivacyModalOpen(true);
  };

  const handleClosePrivacyWhatsAppModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setPrivacyModalOpen(false);
  }, [setPrivacyModalOpen, setSelectedWhatsApp]);

  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async (checked, extra = {}) => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        // marcado: apaga do sistema tudo o que veio por essa conexão
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`, {
          params: checked ? { purge: true } : undefined
        });
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        // "excluir todas as conversas": apaga do sistema tudo o que veio
        // por essa conexão antes de removê-la
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`, {
          params: { closeTickets: checked, purge: !!extra.purge }
        });
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const handleCloseWavoipModal = useCallback(() => {
    setWavoipModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setWavoipModalOpen, setSelectedWhatsApp]);

  const refreshWhatsApp = async whatsApp => {
    try {
      await api.get(`/whatsappsession/refresh/${whatsApp.id}`);
    } catch (err) {
      toastError(err);
    }
  };

  // tudo o que dá para fazer com uma instância (cartão e painel)
  const instanceActions = {
    scan: whatsApp => handleOpenQrModal(whatsApp),
    retry: whatsApp => handleStartWhatsAppSession(whatsApp.id),
    newQr: whatsApp => handleRequestNewQrCode(whatsApp.id),
    passkey: whatsApp => handleOpenPasskeyModal(whatsApp),
    resetPasskey: whatsApp => handleResetPasskeySession(whatsApp.id),
    disconnect: whatsApp =>
      handleOpenConfirmationModal("disconnect", whatsApp.id),
    refresh: whatsApp => refreshWhatsApp(whatsApp),
    edit: whatsApp => handleEditWhatsApp(whatsApp),
    privacy: whatsApp => handleOpenPrivacyWhatsApp(whatsApp),
    remove: whatsApp => handleOpenConfirmationModal("delete", whatsApp.id)
  };

  return (
    <MainContainer className={classes.page}>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
        checkbox={
          confirmModalInfo.action === "delete"
            ? i18n.t("connections.confirmationModal.closeTickets")
            : confirmModalInfo.action === "disconnect"
              ? i18n.t("connections.confirmationModal.purge")
              : undefined
        }
        checkboxes={
          confirmModalInfo.action === "delete"
            ? [
                {
                  name: "purge",
                  label: i18n.t("connections.confirmationModal.purgeOnDelete"),
                  hint: i18n.t(
                    "connections.confirmationModal.purgeOnDeleteHint"
                  )
                }
              ]
            : []
        }
      >
        {confirmModalInfo.message}
      </ConfirmationModal>
      <QrcodeModal
        open={qrModalOpen}
        onClose={handleCloseQrModal}
        onOpenPasskeyModal={handleOpenInstallInstructionsFromQr}
        connectorReady={connectorReady}
        whatsAppId={
          !whatsAppModalOpen && !privacyModalOpen && selectedWhatsApp?.id
        }
      />
      <PasskeyModal
        open={passkeyModalOpen}
        onClose={handleClosePasskeyModal}
        captureToken={passkeyInitialToken}
        onConnectorReady={() => setConnectorReady(true)}
        whatsAppId={
          !whatsAppModalOpen && !privacyModalOpen && selectedWhatsApp?.id
        }
      />
      <InboxWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onChoose={handleChooseChannel}
      />
      <WebchatForm open={webchatOpen} onClose={() => setWebchatOpen(false)} />
      <WebchatSettings
        open={!!webchatInbox}
        inbox={webchatInbox}
        onClose={() => setWebchatInbox(null)}
      />
      <WhatsAppModal
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        whatsAppId={!qrModalOpen && !privacyModalOpen && selectedWhatsApp?.id}
      />
      <PrivacyModal
        open={privacyModalOpen}
        onClose={handleClosePrivacyWhatsAppModal}
        whatsAppId={!qrModalOpen && !whatsAppModalOpen && selectedWhatsApp?.id}
      />
      <WavoipModal
        open={wavoipModalOpen}
        onClose={handleCloseWavoipModal}
        whatsappId={selectedWhatsApp?.id}
      />
      <div className={classes.head}>
        <div className={classes.titleBox}>
          <Typography component="h1" className={classes.title}>
            {i18n.t("connections.title")}
          </Typography>
          <Typography className={classes.subtitle}>
            {i18n.t("instances.summary", {
              connected: (whatsApps || []).filter(w => w.status === "CONNECTED")
                .length,
              total: (whatsApps || []).length
            })}
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          className={classes.add}
          startIcon={<AddRoundedIcon />}
          onClick={() => setWizardOpen(true)}
        >
          {i18n.t("connections.buttons.add")}
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <InstanceGrid>
          {(whatsApps || []).map((whatsApp, index) => (
            <InstanceCard
              key={whatsApp.id}
              whatsApp={whatsApp}
              index={index}
              actions={instanceActions}
              onOpen={(item, profile) => setDetails({ id: item.id, profile })}
            />
          ))}
          <NewInstanceCard onClick={() => setWizardOpen(true)} />
        </InstanceGrid>
      )}

      <InstanceDetails
        open={!!details && !!detailsWhatsApp}
        whatsApp={detailsWhatsApp}
        profile={details?.profile}
        onClose={() => setDetails(null)}
        actions={instanceActions}
      />
    </MainContainer>
  );
};

export default Connections;
