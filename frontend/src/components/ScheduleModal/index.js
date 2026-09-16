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
import { FormControl, FormControlLabel, Switch } from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import moment from "moment";
import { AuthContext } from "../../context/Auth/AuthContext";
import { isArray, capitalize } from "lodash";

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
  mediaName: { flex: 1, fontSize: "0.875rem", wordBreak: "break-all" }
}));

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
  defaultSendAt
}) => {
  const classes = useStyles();
  const history = useHistory();
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
  const [contacts, setContacts] = useState([initialContact]);

  useEffect(() => {
    if (contactId && contacts.length) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setCurrentContact(contact);
      }
    }
  }, [contactId, contacts]);

  useEffect(() => {
    const { companyId } = user;
    if (open) {
      try {
        (async () => {
          const { data: contactList } = await api.get("/contacts/list", {
            params: { companyId: companyId }
          });
          let customList = contactList.map(c => ({ id: c.id, name: c.name }));
          if (isArray(customList)) {
            setContacts([{ id: "", name: "" }, ...customList]);
          }
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
    <div className={classes.root}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="xs"
        fullWidth
        scroll="paper"
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
                  <FormControl variant="outlined" fullWidth>
                    <Autocomplete
                      fullWidth
                      value={currentContact}
                      options={contacts}
                      onChange={(e, contact) => {
                        const contactId = contact ? contact.id : "";
                        setFieldValue("contactId", contactId);
                        setCurrentContact(contact ? contact : initialContact);
                      }}
                      getOptionLabel={option => option.name}
                      getOptionSelected={(option, value) => {
                        return value.id === option.id;
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          variant="outlined"
                          placeholder="Contato"
                        />
                      )}
                    />
                  </FormControl>
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
      </Dialog>
    </div>
  );
};

export default ScheduleModal;
