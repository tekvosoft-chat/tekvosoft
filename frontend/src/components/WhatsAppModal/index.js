import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  DialogActions,
  CircularProgress,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Grid
} from "@material-ui/core";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";

import { SelectLanguage } from "../SelectLanguage";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },
  paper: { borderRadius: 20 },
  titleBar: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: theme.spacing(2.5, 3)
  },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    background: "linear-gradient(135deg, #25D366, #128C7E)",
    boxShadow: "0 8px 18px -8px #128C7E"
  },
  title: { fontSize: "1.125rem", fontWeight: 700, letterSpacing: "-0.01em" },
  content: {
    padding: theme.spacing(1, 3, 2),
    backgroundColor: theme.palette.tkv.canvas
  },
  section: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: 16,
    backgroundColor: theme.palette.tkv.surface,
    border: `1px solid ${theme.palette.tkv.border}`,
    animation: "$in .3s ease both"
  },
  "@keyframes in": {
    from: { opacity: 0, transform: "translateY(6px)" },
    to: { opacity: 1, transform: "none" }
  },
  sectionTitle: {
    marginBottom: theme.spacing(1.5),
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: theme.palette.text.secondary
  },
  defaultCard: {
    height: "100%",
    minHeight: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: theme.spacing(1, 1, 1, 2),
    borderRadius: 12,
    border: `1px solid ${theme.palette.tkv.border}`,
    cursor: "pointer"
  },
  msgCard: {
    height: "100%",
    padding: theme.spacing(1.5),
    borderRadius: 14,
    border: `1px solid ${theme.palette.tkv.border}`,
    transition: "border-color .15s ease, box-shadow .15s ease",
    "&:focus-within": {
      borderColor: theme.palette.tkv.brand.main,
      boxShadow: `0 0 0 3px ${theme.palette.tkv.brand.focusRing}`
    }
  },
  msgHead: { display: "flex", gap: 10, marginBottom: 10 },
  msgIcon: {
    flex: "none",
    width: 32,
    height: 32,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    backgroundColor: theme.palette.tkv.surfaceSunken
  },
  msgTitle: { fontSize: 14, fontWeight: 600 },
  msgHint: { fontSize: 12, color: theme.palette.text.secondary },
  vars: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing(1.5)
  },
  varChip: {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 11.5,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.tkv.surfaceSunken,
    "& b": { color: theme.palette.tkv.brand.text, fontWeight: 600 }
  },

  multFieldLine: {
    display: "flex",
    "& > *:not(:last-child)": {
      marginRight: theme.spacing(1)
    }
  },

  btnWrapper: {
    position: "relative"
  },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  }
}));

const SessionSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required")
});

const WhatsAppModal = ({ open, onClose, whatsAppId }) => {
  const classes = useStyles();
  const initialState = {
    name: "",
    greetingMessage: "",
    complationMessage: "",
    outOfHoursMessage: "",
    ratingMessage: "",
    transferMessage: "",
    isDefault: false,
    token: "",
    provider: "beta",
    language: localStorage.getItem("language") || ""
  };
  const [whatsApp, setWhatsApp] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);

  useEffect(() => {
    const fetchSession = async () => {
      if (!whatsAppId) return;

      try {
        const { data } = await api.get(`whatsapp/${whatsAppId}?session=0`);
        setWhatsApp(data);

        const whatsQueueIds = data.queues?.map(queue => queue.id);
        setSelectedQueueIds(whatsQueueIds);
      } catch (err) {
        toastError(err);
      }
    };
    fetchSession();
  }, [whatsAppId]);

  const handleSaveWhatsApp = async values => {
    const whatsappData = { ...values, queueIds: selectedQueueIds };
    delete whatsappData["queues"];
    delete whatsappData["session"];

    try {
      if (whatsAppId) {
        await api.put(`/whatsapp/${whatsAppId}`, whatsappData);
      } else {
        await api.post("/whatsapp", whatsappData);
      }
      toast.success(i18n.t("whatsappModal.success"));
      handleClose();
    } catch (err) {
      toastError(err);
    }
  };

  const handleClose = () => {
    onClose();
    setWhatsApp(initialState);
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ className: classes.paper }}
      >
        <DialogTitle disableTypography className={classes.titleBar}>
          <span className={classes.titleIcon}>
            <WhatsAppIcon />
          </span>
          <div>
            <div className={classes.title}>
              {whatsAppId
                ? i18n.t("whatsappModal.title.edit")
                : i18n.t("whatsappModal.title.add")}
            </div>
            <div className={classes.msgHint}>
              {i18n.t(
                "whatsappModal.subtitle",
                "Nome, filas e as mensagens automáticas desta conexão"
              )}
            </div>
          </div>
        </DialogTitle>
        <Formik
          initialValues={whatsApp}
          enableReinitialize={true}
          validationSchema={SessionSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveWhatsApp(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ values, touched, errors, isSubmitting }) => (
            <Form>
              <DialogContent dividers className={classes.content}>
                <section className={classes.section}>
                  <div className={classes.sectionTitle}>
                    {i18n.t("whatsappModal.sections.identity", "Identificação")}
                  </div>
                  <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={7}>
                      <Field
                        as={TextField}
                        label={i18n.t("whatsappModal.form.name")}
                        autoFocus
                        name="name"
                        error={touched.name && Boolean(errors.name)}
                        helperText={
                          (touched.name && errors.name) ||
                          i18n.t(
                            "whatsappModal.hints.name",
                            "Como essa conexão aparece para a equipe"
                          )
                        }
                        variant="outlined"
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <label className={classes.defaultCard}>
                        <div>
                          <div className={classes.msgTitle}>
                            {i18n.t("whatsappModal.form.default")}
                          </div>
                          <div className={classes.msgHint}>
                            {i18n.t(
                              "whatsappModal.hints.default",
                              "Usada quando nenhuma outra for escolhida"
                            )}
                          </div>
                        </div>
                        <Field
                          as={Switch}
                          color="primary"
                          name="isDefault"
                          checked={values.isDefault}
                        />
                      </label>
                    </Grid>
                    <Grid item xs={12} md={7}>
                      <QueueSelect
                        selectedQueueIds={selectedQueueIds}
                        onChange={selectedIds =>
                          setSelectedQueueIds(selectedIds)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={5}>
                      <Field
                        as={SelectLanguage}
                        name="language"
                        fullWidth
                        variant="outlined"
                        margin="dense"
                      />
                    </Grid>
                  </Grid>
                </section>

                <section className={classes.section}>
                  <div className={classes.sectionTitle}>
                    {i18n.t(
                      "whatsappModal.sections.messages",
                      "Mensagens automáticas"
                    )}
                  </div>
                  <div className={classes.vars}>
                    <span className={classes.msgHint}>
                      {i18n.t("whatsappModal.variables", "Variáveis:")}
                    </span>
                    {[
                      ["{{name}}", "nome do contato"],
                      ["{{ms}}", "turno"],
                      ["{{protocol}}", "protocolo"],
                      ["{{hora}}", "hora"]
                    ].map(([v, d]) => (
                      <span key={v} className={classes.varChip} title={d}>
                        <b>{v}</b> {d}
                      </span>
                    ))}
                  </div>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <div className={classes.msgCard}>
                        <div className={classes.msgHead}>
                          <span className={classes.msgIcon}>👋</span>
                          <div>
                            <div className={classes.msgTitle}>
                              {i18n.t("queueModal.form.greetingMessage")}
                            </div>
                            <div className={classes.msgHint}>
                              {i18n.t(
                                "whatsappModal.hints.greetingMessage",
                                "Enviada quando o cliente inicia a conversa"
                              )}
                            </div>
                          </div>
                        </div>
                        <Field
                          as={TextField}
                          placeholder={i18n.t(
                            "whatsappModal.placeholder",
                            "Escreva a mensagem…"
                          )}
                          multiline
                          minRows={3}
                          maxRows={8}
                          fullWidth
                          name="greetingMessage"
                          spellCheck={true}
                          error={
                            touched.greetingMessage &&
                            Boolean(errors.greetingMessage)
                          }
                          helperText={
                            touched.greetingMessage && errors.greetingMessage
                          }
                          variant="outlined"
                          size="small"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div className={classes.msgCard}>
                        <div className={classes.msgHead}>
                          <span className={classes.msgIcon}>✅</span>
                          <div>
                            <div className={classes.msgTitle}>
                              {i18n.t("queueModal.form.complationMessage")}
                            </div>
                            <div className={classes.msgHint}>
                              {i18n.t(
                                "whatsappModal.hints.complationMessage",
                                "Enviada ao resolver o atendimento"
                              )}
                            </div>
                          </div>
                        </div>
                        <Field
                          as={TextField}
                          placeholder={i18n.t(
                            "whatsappModal.placeholder",
                            "Escreva a mensagem…"
                          )}
                          multiline
                          minRows={3}
                          maxRows={8}
                          fullWidth
                          name="complationMessage"
                          spellCheck={true}
                          error={
                            touched.complationMessage &&
                            Boolean(errors.complationMessage)
                          }
                          helperText={
                            touched.complationMessage &&
                            errors.complationMessage
                          }
                          variant="outlined"
                          size="small"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div className={classes.msgCard}>
                        <div className={classes.msgHead}>
                          <span className={classes.msgIcon}>🔁</span>
                          <div>
                            <div className={classes.msgTitle}>
                              {i18n.t("queueModal.form.transferMessage")}
                            </div>
                            <div className={classes.msgHint}>
                              {i18n.t(
                                "whatsappModal.hints.transferMessage",
                                "Enviada ao transferir para outra fila ou atendente"
                              )}
                            </div>
                          </div>
                        </div>
                        <Field
                          as={TextField}
                          placeholder={i18n.t(
                            "whatsappModal.placeholder",
                            "Escreva a mensagem…"
                          )}
                          multiline
                          minRows={3}
                          maxRows={8}
                          fullWidth
                          name="transferMessage"
                          spellCheck={true}
                          error={
                            touched.transferMessage &&
                            Boolean(errors.transferMessage)
                          }
                          helperText={
                            touched.transferMessage && errors.transferMessage
                          }
                          variant="outlined"
                          size="small"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div className={classes.msgCard}>
                        <div className={classes.msgHead}>
                          <span className={classes.msgIcon}>🌙</span>
                          <div>
                            <div className={classes.msgTitle}>
                              {i18n.t("queueModal.form.outOfHoursMessage")}
                            </div>
                            <div className={classes.msgHint}>
                              {i18n.t(
                                "whatsappModal.hints.outOfHoursMessage",
                                "Enviada fora do horário de atendimento"
                              )}
                            </div>
                          </div>
                        </div>
                        <Field
                          as={TextField}
                          placeholder={i18n.t(
                            "whatsappModal.placeholder",
                            "Escreva a mensagem…"
                          )}
                          multiline
                          minRows={3}
                          maxRows={8}
                          fullWidth
                          name="outOfHoursMessage"
                          spellCheck={true}
                          error={
                            touched.outOfHoursMessage &&
                            Boolean(errors.outOfHoursMessage)
                          }
                          helperText={
                            touched.outOfHoursMessage &&
                            errors.outOfHoursMessage
                          }
                          variant="outlined"
                          size="small"
                        />
                      </div>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <div className={classes.msgCard}>
                        <div className={classes.msgHead}>
                          <span className={classes.msgIcon}>⭐</span>
                          <div>
                            <div className={classes.msgTitle}>
                              {i18n.t("queueModal.form.ratingMessage")}
                            </div>
                            <div className={classes.msgHint}>
                              {i18n.t(
                                "whatsappModal.hints.ratingMessage",
                                "Pede a avaliação do atendimento"
                              )}
                            </div>
                          </div>
                        </div>
                        <Field
                          as={TextField}
                          placeholder={i18n.t(
                            "whatsappModal.placeholder",
                            "Escreva a mensagem…"
                          )}
                          multiline
                          minRows={3}
                          maxRows={8}
                          fullWidth
                          name="ratingMessage"
                          spellCheck={true}
                          error={
                            touched.ratingMessage &&
                            Boolean(errors.ratingMessage)
                          }
                          helperText={
                            touched.ratingMessage && errors.ratingMessage
                          }
                          variant="outlined"
                          size="small"
                        />
                      </div>
                    </Grid>
                  </Grid>
                </section>

                <section className={classes.section}>
                  <div className={classes.sectionTitle}>
                    {i18n.t("whatsappModal.sections.integration", "Integração")}
                  </div>
                  <Field
                    as={TextField}
                    label={i18n.t("queueModal.form.token")}
                    fullWidth
                    name="token"
                    variant="outlined"
                    size="small"
                    helperText={i18n.t(
                      "whatsappModal.hints.token",
                      "Opcional: token para enviar mensagens pela API"
                    )}
                  />
                </section>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("whatsappModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {whatsAppId
                    ? i18n.t("whatsappModal.buttons.okEdit")
                    : i18n.t("whatsappModal.buttons.okAdd")}
                  {isSubmitting && (
                    <CircularProgress
                      size={24}
                      className={classes.buttonProgress}
                    />
                  )}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default React.memo(WhatsAppModal);
