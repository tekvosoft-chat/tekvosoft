import React, { useState, useEffect, useRef } from "react";

import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import usePlans from "../../hooks/usePlans";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import { MenuItem } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";

import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";

import ReCAPTCHA from "react-google-recaptcha";
import config from "../../services/config";
import useSettings from "../../hooks/useSettings";
import { safeValueFormat } from "../../helpers/safeValueFormat";
import { PhoneNumberInput } from "../../components/PhoneNumberInput";
import AuthShell, { useAuthButtonStyles } from "../Login/AuthShell";
import { LanguageMenu } from "../Login";

const SEGMENTS = [
  "retail",
  "services",
  "health",
  "education",
  "food",
  "realEstate",
  "tech",
  "other"
];
const TEAM_SIZES = ["1", "2-5", "6-20", "21-50", "50+"];
const SOURCES = ["google", "instagram", "youtube", "referral", "other"];
const GOALS = ["sales", "support", "scheduling", "marketing", "other"];

const useStyles = makeStyles(theme => ({
  login: {
    textAlign: "center",
    fontSize: 14
  },
  section: {
    marginTop: theme.spacing(1),
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#a3a3a3"
  }
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, i18n.t("common.validations.short"))
    .max(50, i18n.t("common.validations.long"))
    .required(i18n.t("common.validations.required")),
  password: Yup.string()
    .min(6, i18n.t("common.validations.short"))
    .max(50, i18n.t("common.validations.long"))
    .required(i18n.t("common.validations.required")),
  email: Yup.string()
    .email(i18n.t("common.validations.invalidEmail"))
    .required(i18n.t("common.validations.required")),
  segment: Yup.string().required(i18n.t("common.validations.required")),
  teamSize: Yup.string().required(i18n.t("common.validations.required"))
});

const SignUp = () => {
  const classes = useStyles();
  const buttonClasses = useAuthButtonStyles();
  const history = useHistory();
  const { getPublicSetting } = useSettings();
  const [allowSignup, setAllowSignup] = useState(false);
  const [plans, setPlans] = useState([]);
  const { listPublic: listPublicPlans } = usePlans();
  const captchaRef = useRef(null);

  const initialState = {
    name: "",
    email: "",
    phone: "",
    password: "",
    planId: "",
    segment: "",
    teamSize: "",
    source: "",
    goal: ""
  };

  const handleSignUp = async values => {
    if (config.RECAPTCHA_SITE_KEY) {
      Object.assign(values, {
        captchaToken: await captchaRef.current.executeAsync()
      });
    }

    Object.assign(values, { recurrence: "MENSAL" });
    Object.assign(values, { status: "t" });
    Object.assign(values, { campaignsEnabled: true });
    try {
      await openApi.post("/companies/cadastro", values);
      toast.success(i18n.t("signup.toasts.success"));
      history.push("/login");
    } catch (err) {
      console.log(err);
      toastError(err);
    }
  };

  useEffect(() => {
    listPublicPlans().then(setPlans);
    getPublicSetting("allowSignup").then(data => {
      setAllowSignup(data === "enabled");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectField = (name, options, touched, errors, required) => (
    <Field
      as={TextField}
      select
      variant="outlined"
      margin="dense"
      fullWidth
      name={name}
      label={i18n.t(`signup.form.${name}`)}
      required={required}
      error={touched[name] && Boolean(errors[name])}
      helperText={touched[name] && errors[name]}
    >
      {options.map(option => (
        <MenuItem key={option} value={option}>
          {i18n.t(`signup.options.${name}.${option}`)}
        </MenuItem>
      ))}
    </Field>
  );

  return (
    <AuthShell
      title={i18n.t("signup.heading")}
      subtitle={i18n.t("signup.subheading")}
      actions={<LanguageMenu />}
    >
      <Formik
        initialValues={initialState}
        validationSchema={UserSchema}
        onSubmit={async (values, actions) => {
          await handleSignUp(values);
          actions.setSubmitting(false);
        }}
      >
        {({ touched, errors, isSubmitting }) => (
          <Form noValidate>
            {allowSignup ? (
              <>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      autoComplete="organization"
                      name="name"
                      error={touched.name && Boolean(errors.name)}
                      helperText={touched.name && errors.name}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      label={i18n.t("common.company")}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      label={i18n.t("common.email")}
                      name="email"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      autoComplete="email"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={PhoneNumberInput}
                      variant="outlined"
                      fullWidth
                      name="phone"
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                      autoComplete="tel"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      name="password"
                      error={touched.password && Boolean(errors.password)}
                      helperText={touched.password && errors.password}
                      label={i18n.t("signup.form.password")}
                      type="password"
                      autoComplete="new-password"
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <div className={classes.section}>
                      {i18n.t("signup.aboutBusiness")}
                    </div>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {selectField("segment", SEGMENTS, touched, errors, true)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {selectField("teamSize", TEAM_SIZES, touched, errors, true)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {selectField("goal", GOALS, touched, errors)}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {selectField("source", SOURCES, touched, errors)}
                  </Grid>
                  {plans.length > 0 && (
                    <Grid item xs={12}>
                      <Field
                        as={TextField}
                        select
                        variant="outlined"
                        margin="dense"
                        fullWidth
                        label={i18n.t("companies.form.plan")}
                        name="planId"
                        required
                      >
                        {plans.map(plan => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {plan.name} ·{" "}
                            {safeValueFormat(plan.value, plan.currency)}
                          </MenuItem>
                        ))}
                      </Field>
                    </Grid>
                  )}
                </Grid>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isSubmitting}
                  className={buttonClasses.submit}
                >
                  {i18n.t("signup.buttons.submit")}
                </Button>
              </>
            ) : (
              <h2>{i18n.t("common.disabled")}</h2>
            )}
            <div className={classes.login}>
              <Link component={RouterLink} to="/login">
                {i18n.t("signup.buttons.login")}
              </Link>
            </div>
          </Form>
        )}
      </Formik>
      {config.RECAPTCHA_SITE_KEY && allowSignup && (
        <ReCAPTCHA
          size="invisible"
          sitekey={config.RECAPTCHA_SITE_KEY}
          ref={captchaRef}
        />
      )}
    </AuthShell>
  );
};

export default SignUp;
