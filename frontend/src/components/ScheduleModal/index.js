import React, { useMemo, useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";

import AddPhotoAlternateOutlinedIcon from "@material-ui/icons/AddPhotoAlternateOutlined";
import { getBackendURL } from "../../services/config";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { FormControlLabel, Switch } from "@material-ui/core";
import Collapse from "@material-ui/core/Collapse";
import ContactPicker from "../ContactPicker";
import moment from "moment";
import { AuthContext } from "../../context/Auth/AuthContext";
import { capitalize } from "lodash";

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
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
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  mediaBox: { margin: theme.spacing(1, 0) },
  mediaPreview: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 8,
    borderRadius: 12,
    border: `1px solid ${theme.palette.tkv.border}`,
    "& img": {
      width: 72,
      height: 72,
      objectFit: "cover",
      borderRadius: 8
    }
  },
  mediaName: { flex: 1, fontSize: "0.875rem", wordBreak: "break-all" },
  // versão na página: compacta, em duas colunas no computador
  inlinePanel: {
    marginBottom: theme.spacing(2),
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: theme.palette.tkv.surface,
    border: `1px solid ${theme.palette.tkv.border}`,
    boxShadow: "0 10px 26px -18px rgba(12, 10, 20, 0.45)",
    "& .MuiDialogTitle-root": {
      padding: theme.spacing(1.5, 2.5, 0.5),
      "& h2": { fontSize: 15, fontWeight: 700 }
    },
    "& .MuiDialogContent-root": {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
      gridTemplateAreas: `"contact date" "body media" "body toggle"`,
      alignItems: "start",
      columnGap: theme.spacing(2),
      rowGap: theme.spacing(1),
      padding: theme.spacing(1, 2.5, 1),
      border: "none",
      overflow: "visible",
      "& > br": { display: "none" },
      "& > div:nth-of-type(1)": { gridArea: "contact" },
      "& > div:nth-of-type(2)": { gridArea: "body" },
      "& > div:nth-of-type(3)": { gridArea: "date" },
      "& > div:nth-of-type(4)": { gridArea: "media", margin: 0 },
      "& > div:nth-of-type(5)": { gridArea: "toggle" },
      "& .MuiFormControl-marginDense": { margin: 0 },
      "& textarea": { height: "96px !important", overflowY: "auto !important" },
      [theme.breakpoints.down("xs")]: {
        gridTemplateColumns: "minmax(0, 1fr)",
        gridTemplateAreas: `"contact" "body" "date" "media" "toggle"`,
        padding: theme.spacing(1, 1.5)
      }
    },
    "& .MuiDialogActions-root": {
      padding: theme.spacing(1, 2.5, 1.5),
      borderTop: "none",
      "& .MuiButton-root": { borderRadius: 999, textTransform: "none" }
    }
  }
}));

// versão "na página": o formulário desce suavemente, sem cobrir a tela
const InlinePanel = ({ in: open, className, children }) => (
  <Collapse in={open} timeout={300} unmountOnExit>
    <div className={className}>{children}</div>
  </Collapse>
);

const ScheduleSchema = Yup.object().shape({
  body: Yup.string(),
  contactId: Yup.number().required("Obrigatório"),
  sendAt: Yup.string().required("Obrigatório"),
  saveMessage: Yup.bool()
});

const ScheduleModal = ({
  open,
  onClose,
  scheduleId,
  contactId,
  cleanContact,
  reload,
  defaultSendAt,
  // inline: abre deslizando dentro da página (sem modal por cima)
  inline = false
}) => {
  const classes = useStyles();
  const history = useHistory();
  const Wrapper = inline ? InlinePanel : Dialog;
  const { user } = useContext(AuthContext);

  const initialState = {
    body: "",
    contactId: "",
    sendAt: moment().add(1, "hour").format("YYYY-MM-DDTHH:mm"),
    sentAt: "",
    saveMessage: false
  };

  const initialContact = {
    id: "",
    name: ""
  };

  const [schedule, setSchedule] = useState(initialState);
  const [mediaFile, setMediaFile] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [currentContact, setCurrentContact] = useState(initialContact);
  // veio de um contato específico: carrega só ele (antes baixava a lista
  // inteira de contatos da empresa a cada abertura)
  useEffect(() => {
    if (!open || !contactId) return;
    api
      .get(`/contacts/${contactId}`)
      .then(({ data }) => data?.id && setCurrentContact(data))
      .catch(() => {});
  }, [contactId, open]);

  useEffect(() => {
    const { companyId } = user;
    if (open) {
      try {
        (async () => {
          if (contactId) {
            setSchedule(prevState => {
              return { ...prevState, contactId };
            });
          }

          // aberto a partir de um dia do calendário: já sugere esse dia
          if (!scheduleId && defaultSendAt) {
            setSchedule(prevState => ({ ...prevState, sendAt: defaultSendAt }));
          }

          if (!scheduleId) return;

          const { data } = await api.get(`/schedules/${scheduleId}`);
          setSchedule(prevState => {
            return {
              ...prevState,
              ...data,
              sendAt: moment(data.sendAt).format("YYYY-MM-DDTHH:mm")
            };
          });
          setCurrentContact(data.contact);
        })();
      } catch (err) {
        toastError(err);
      }
    }
  }, [scheduleId, contactId, open, user, defaultSendAt]);

  const handleClose = () => {
    onClose();
    setSchedule(initialState);
    setMediaFile(null);
    setRemoveMedia(false);
  };

  const mediaPreviewUrl = useMemo(
    () => (mediaFile ? URL.createObjectURL(mediaFile) : null),
    [mediaFile]
  );
  useEffect(
    () => () => mediaPreviewUrl && URL.revokeObjectURL(mediaPreviewUrl),
    [mediaPreviewUrl]
  );
  const savedMediaUrl =
    !removeMedia && schedule.mediaPath
      ? `${getBackendURL()}/public/${schedule.mediaPath}`
      : null;

  const handleSaveSchedule = async values => {
    if (
      !String(values.body || "").trim() &&
      !mediaFile &&
      !schedule.mediaPath
    ) {
      toastError({ message: i18n.t("scheduleModal.mediaOrText") });
      return;
    }
    // com imagem vai como multipart; sem, continua JSON
    const form = new FormData();
    Object.entries({ ...values, userId: user.id }).forEach(([key, value]) => {
      if (value !== undefined && value !== null) form.append(key, value);
    });
    if (mediaFile) form.append("media", mediaFile);
    if (removeMedia) form.append("removeMedia", "true");
    try {
      if (scheduleId) {
        await api.put(`/schedules/${scheduleId}`, form);
      } else {
        await api.post("/schedules", form);
      }
      setMediaFile(null);
      setRemoveMedia(false);
      toast.success(i18n.t("scheduleModal.success"));
      if (typeof reload == "function") {
        reload();
      }
      if (contactId) {
        if (typeof cleanContact === "function") {
          cleanContact();
          history.push("/schedules");
        }
      }
    } catch (err) {
      toastError(err);
    }
    setCurrentContact(initialContact);
    setSchedule(initialState);
    handleClose();
  };

  return (
    <div className={inline ? undefined : classes.root}>
      <Wrapper
        {...(inline
          ? { in: open, className: classes.inlinePanel }
          : {
              open,
              onClose: handleClose,
              maxWidth: "xs",
              fullWidth: true,
              scroll: "paper"
            })}
      >
        <DialogTitle id="form-dialog-title">
          {schedule.status === "ERRO"
            ? "Erro de Envio"
            : `Mensagem ${capitalize(schedule.status)}`}
        </DialogTitle>
        <Formik
          initialValues={schedule}
          enableReinitialize={true}
          validationSchema={ScheduleSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveSchedule(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting, values, setFieldValue }) => (
            <Form>
              <DialogContent dividers>
                <div className={classes.multFieldLine}>
                  <div style={{ width: "100%" }}>
                    <ContactPicker
                      value={currentContact}
                      autoFocus={inline && !scheduleId && !contactId}
                      error={touched.contactId && errors.contactId}
                      onChange={contact => {
                        setFieldValue("contactId", contact ? contact.id : "");
                        setCurrentContact(contact || initialContact);
                      }}
                    />
                  </div>
                </div>
                <br />
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    rows={9}
                    multiline={true}
                    label={i18n.t("scheduleModal.form.body")}
                    name="body"
                    error={touched.body && Boolean(errors.body)}
                    helperText={touched.body && errors.body}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                </div>
                <br />
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("scheduleModal.form.sendAt")}
                    type="datetime-local"
                    name="sendAt"
                    InputLabelProps={{
                      shrink: true
                    }}
                    error={touched.sendAt && Boolean(errors.sendAt)}
                    helperText={touched.sendAt && errors.sendAt}
                    variant="outlined"
                    fullWidth
                  />
                </div>
                {/* imagem ou arquivo que vai junto da mensagem */}
                <div className={classes.mediaBox}>
                  <input
                    id="schedule-media-input"
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    hidden
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setMediaFile(file);
                        setRemoveMedia(false);
                      }
                      e.target.value = "";
                    }}
                  />
                  {mediaFile || savedMediaUrl ? (
                    <div className={classes.mediaPreview}>
                      {(mediaFile?.type || "").startsWith("image/") ||
                      (!mediaFile &&
                        /\.(png|jpe?g|webp|gif)$/i.test(
                          schedule.mediaPath || ""
                        )) ? (
                        <img src={mediaPreviewUrl || savedMediaUrl} alt="" />
                      ) : (
                        <span className={classes.mediaName}>
                          📎 {mediaFile?.name || schedule.mediaName}
                        </span>
                      )}
                      <Button
                        size="small"
                        onClick={() => {
                          setMediaFile(null);
                          if (schedule.mediaPath) setRemoveMedia(true);
                        }}
                      >
                        {i18n.t("scheduleModal.removeMedia")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      component="label"
                      htmlFor="schedule-media-input"
                      variant="outlined"
                      color="primary"
                      startIcon={<AddPhotoAlternateOutlinedIcon />}
                    >
                      {i18n.t("scheduleModal.addMedia")}
                    </Button>
                  )}
                </div>
                <div className={classes.multFieldLine}>
                  <FormControlLabel
                    label={i18n.t("scheduleModal.form.saveMessage")}
                    labelPlacement="end"
                    control={
                      <Switch
                        size="small"
                        checked={values.saveMessage}
                        onChange={() =>
                          setFieldValue("saveMessage", !values.saveMessage)
                        }
                        name="saveMessage"
                        color="primary"
                      />
                    }
                  />
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("scheduleModal.buttons.cancel")}
                </Button>
                {(schedule.sentAt === null || schedule.sentAt === "") && (
                  <Button
                    type="submit"
                    color="primary"
                    disabled={isSubmitting}
                    variant="contained"
                    className={classes.btnWrapper}
                  >
                    {scheduleId
                      ? `${i18n.t("scheduleModal.buttons.okEdit")}`
                      : `${i18n.t("scheduleModal.buttons.okAdd")}`}
                    {isSubmitting && (
                      <CircularProgress
                        size={24}
                        className={classes.buttonProgress}
                      />
                    )}
                  </Button>
                )}
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </div>
  );
};

export default ScheduleModal;
