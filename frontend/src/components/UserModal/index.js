import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import Collapse from "@material-ui/core/Collapse";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import CircularProgress from "@material-ui/core/CircularProgress";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";

import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import QueueSelect from "../QueueSelect";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import ProfileImageField from "./ProfileImageField";

const useStyles = makeStyles(theme => ({
  // na página: cartão compacto que desce acima da lista de usuários
  inlinePanel: {
    marginBottom: theme.spacing(2),
    maxWidth: 720,
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
      padding: theme.spacing(1, 2.5),
      border: "none",
      overflow: "visible",
      [theme.breakpoints.down("xs")]: { padding: theme.spacing(1, 1.5) }
    },
    "& .MuiDialogActions-root": {
      padding: theme.spacing(1, 2.5, 1.5),
      "& .MuiButton-root": { borderRadius: 999, textTransform: "none" }
    }
  },
  inlineCompact: {
    borderTop: `1px solid ${theme.palette.tkv.border}`,
    textAlign: "left",
    "& .MuiDialogTitle-root": { display: "none" },
    "& .MuiDialogContent-root": {
      padding: theme.spacing(1.5, 1.5, 0.5),
      border: "none",
      overflow: "visible"
    },
    "& $multFieldLine": {
      flexDirection: "column",
      gap: theme.spacing(1),
      "& > *": { marginRight: "0 !important", width: "100%" }
    },
    "& .MuiDialogActions-root": {
      padding: theme.spacing(1, 1.5, 1.5),
      "& .MuiButton-root": { borderRadius: 999, textTransform: "none" }
    }
  },
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
  }
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("Required"),
  password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
  email: Yup.string().email("Invalid email").required("Required")
});

// versão "na página": o formulário desce suavemente, sem modal por cima
const InlinePanel = ({ in: open, className, children }) => (
  <Collapse in={open} timeout={300} unmountOnExit>
    <div className={className}>{children}</div>
  </Collapse>
);

const UserModal = ({
  open,
  onClose,
  userId,
  inline = false,
  // dentro do cartão do usuário: sem moldura e com os campos um embaixo do outro
  compact = false
}) => {
  const classes = useStyles();
  const Wrapper = inline ? InlinePanel : Dialog;

  const { user: loggedInUser } = useContext(AuthContext);

  // o super admin só cria administradores; eles criam os usuários
  const initialState = {
    name: "",
    email: "",
    password: "",
    profile: loggedInUser?.super ? "admin" : "user"
  };

  const [user, setUser] = useState(initialState);
  const [selectedQueueIds, setSelectedQueueIds] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      // só busca quando abre (há um formulário fechado em cada cartão)
      if (!userId || !open) return;
      try {
        const { data } = await api.get(`/users/${userId}`);
        setUser(prevState => {
          return { ...prevState, ...data };
        });
        const userQueueIds = data.queues?.map(queue => queue.id);
        setSelectedQueueIds(userQueueIds);
      } catch (err) {
        toastError(err);
      }
    };

    fetchUser();
  }, [userId, open]);

  const handleClose = () => {
    onClose();
    setUser(initialState);
  };

  const handleSaveUser = async values => {
    const userData = { ...values, queueIds: selectedQueueIds };
    try {
      if (userId) {
        await api.put(`/users/${userId}`, userData);
      } else {
        await api.post("/users", userData);
      }
      toast.success(i18n.t("userModal.success"));
    } catch (err) {
      toastError(err);
    }
    handleClose();
  };

  return (
    <div className={inline ? undefined : classes.root}>
      <Wrapper
        {...(inline
          ? {
              in: open,
              className: compact ? classes.inlineCompact : classes.inlinePanel
            }
          : {
              open,
              onClose: handleClose,
              maxWidth: "xs",
              fullWidth: true,
              scroll: "paper"
            })}
      >
        <DialogTitle id="form-dialog-title">
          {userId
            ? `${i18n.t("userModal.title.edit")}`
            : `${i18n.t("userModal.title.add")}`}
        </DialogTitle>
        <Formik
          initialValues={user}
          enableReinitialize={true}
          validationSchema={UserSchema}
          onSubmit={(values, actions) => {
            setTimeout(() => {
              handleSaveUser(values);
              actions.setSubmitting(false);
            }, 400);
          }}
        >
          {({ touched, errors, isSubmitting }) => (
            <Form>
              <DialogContent dividers>
                <ProfileImageField
                  userId={userId}
                  user={user}
                  onChange={profileImage =>
                    setUser(prev => ({ ...prev, profileImage }))
                  }
                />
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("userModal.form.name")}
                    autoFocus
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("userModal.form.password")}
                    type="password"
                    name="password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    inputProps={{
                      autoComplete: "off"
                    }}
                  />
                </div>
                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("userModal.form.email")}
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                  />
                  <FormControl
                    variant="outlined"
                    className={classes.formControl}
                    margin="dense"
                    fullWidth
                  >
                    <Can
                      role={loggedInUser.profile}
                      perform="user-modal:editProfile"
                      yes={() => (
                        <>
                          <InputLabel id="profile-selection-input-label">
                            {i18n.t("userModal.form.profile")}
                          </InputLabel>

                          <Field
                            as={Select}
                            label={i18n.t("userModal.form.profile")}
                            name="profile"
                            labelId="profile-selection-label"
                            id="profile-selection"
                            required
                          >
                            <MenuItem value="admin">
                              {i18n.t("userModal.listItems.adminProfile")}
                            </MenuItem>
                            {(!loggedInUser?.super ||
                              user.profile === "user") && (
                              <MenuItem value="user">
                                {i18n.t("userModal.listItems.userProfile")}
                              </MenuItem>
                            )}
                          </Field>
                        </>
                      )}
                    />
                  </FormControl>
                </div>
                <Can
                  role={loggedInUser.profile}
                  perform="user-modal:editQueues"
                  yes={() => (
                    <QueueSelect
                      selectedQueueIds={selectedQueueIds}
                      onChange={values => setSelectedQueueIds(values)}
                    />
                  )}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={handleClose}
                  color="secondary"
                  disabled={isSubmitting}
                  variant="outlined"
                >
                  {i18n.t("userModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={isSubmitting}
                  variant="contained"
                  className={classes.btnWrapper}
                >
                  {userId
                    ? `${i18n.t("userModal.buttons.okEdit")}`
                    : `${i18n.t("userModal.buttons.okAdd")}`}
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
      </Wrapper>
    </div>
  );
};

export default UserModal;
