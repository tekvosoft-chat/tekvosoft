import React, { useState, useEffect, useContext } from "react";
import {
  makeStyles,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Select
} from "@material-ui/core";
import { Formik, Form, Field } from "formik";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";

import { Edit as EditIcon } from "@material-ui/icons";

import { toast } from "react-toastify";
import useCompanies from "../../hooks/useCompanies";
import usePlans from "../../hooks/usePlans";
import ModalUsers from "../ModalUsers";
import api from "../../services/api";
import { head, isArray, has } from "lodash";
import { useDate } from "../../hooks/useDate";
import useSettings from "../../hooks/useSettings";
import { SelectLanguage } from "../SelectLanguage";
import { i18n } from "../../translate/i18n";

import moment from "moment";

import { AuthContext } from "../../context/Auth/AuthContext";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
  // celular: uma tabela de nove colunas não cabe; cada empresa vira um cartão
  companyCards: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1, 0, 2)
  },
  companyCard: {
    borderRadius: theme.palette.tkv.radius.lg,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    padding: theme.spacing(1.5)
  },
  companyCardHead: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1)
  },
  companyName: {
    flex: 1,
    minWidth: 0,
    fontSize: "1rem",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  companyFacts: {
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    gap: "6px 12px",
    margin: 0,
    fontSize: "0.875rem",
    "& dt": { color: theme.palette.text.secondary },
    "& dd": { margin: 0, textAlign: "right", fontWeight: 500 }
  },
  companyBreak: { wordBreak: "break-all" },
  root: {
    width: "100%"
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    padding: theme.spacing(2)
  },
  fullWidth: {
    width: "100%"
  },
  tableContainer: {
    width: "100%",
    overflowX: "scroll",
    ...theme.scrollbarStyles
  },
  textfield: {
    width: "100%"
  },
  textRight: {
    textAlign: "right"
  },
  row: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2)
  },
  control: {
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1)
  },
  buttonContainer: {
    textAlign: "right",
    padding: theme.spacing(1)
  },
  inactive: {
    color: "gray"
  },
  gracePeriod: {
    color: "orange"
  },
  almostDue: {
    color: theme.mode === "light" ? "blue" : "#38f"
  }
}));

export function CompanyForm(props) {
  const { onSubmit, onDelete, onImpersonate, onCancel, initialValue, loading } =
    props;
  const classes = useStyles();
  const [plans, setPlans] = useState([]);
  const [modalUser, setModalUser] = useState(false);
  const [firstUser, setFirstUser] = useState({});

  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    language: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    dueDate: "",
    recurrence: "",
    ...initialValue
  });

  const { list: listPlans } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const list = await listPlans();
      setPlans(list);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRecord(prev => {
      if (moment(initialValue).isValid()) {
        initialValue.dueDate = moment(initialValue.dueDate).format(
          "YYYY-MM-DD"
        );
      }
      return {
        ...prev,
        ...initialValue
      };
    });
  }, [initialValue]);

  const handleSubmit = async data => {
    if (data.dueDate === "" || moment(data.dueDate).isValid() === false) {
      data.dueDate = null;
    }
    onSubmit(data);
    setRecord({ ...initialValue, dueDate: "" });
  };

  const handleOpenModalUsers = async () => {
    try {
      const { data } = await api.get("/users/list", {
        params: {
          companyId: initialValue.id
        }
      });
      if (isArray(data) && data.length) {
        setFirstUser(head(data));
      }
      setModalUser(true);
    } catch (e) {
      toast.error(e);
    }
  };

  const handleCloseModalUsers = () => {
    setFirstUser({});
    setModalUser(false);
  };

  const incrementDueDate = () => {
    const data = { ...record };
    if (data.dueDate !== "" && data.dueDate !== null) {
      switch (data.recurrence) {
        case "MENSAL":
          data.dueDate = moment(data.dueDate)
            .add(1, "month")
            .format("YYYY-MM-DD");
          break;
        case "BIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(2, "month")
            .format("YYYY-MM-DD");
          break;
        case "TRIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(3, "month")
            .format("YYYY-MM-DD");
          break;
        case "SEMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(6, "month")
            .format("YYYY-MM-DD");
          break;
        case "ANUAL":
          data.dueDate = moment(data.dueDate)
            .add(12, "month")
            .format("YYYY-MM-DD");
          break;
        default:
          break;
      }
    }
    setRecord(data);
  };

  return (
    <>
      <ModalUsers
        userId={firstUser.id}
        companyId={initialValue.id}
        open={modalUser}
        onClose={handleCloseModalUsers}
      />
      <Formik
        enableReinitialize
        className={classes.fullWidth}
        initialValues={record}
        onSubmit={(values, { resetForm }) =>
          setTimeout(() => {
            handleSubmit(values);
            resetForm();
          }, 500)
        }
      >
        {(values, setValues) => (
          <Form className={classes.fullWidth}>
            <Grid spacing={2} justifyContent="flex-end" container>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  label={i18n.t("common.name")}
                  name="name"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                />
              </Grid>
              <Grid xs={12} sm={6} md={4} item>
                <Field
                  as={TextField}
                  label={i18n.t("common.email")}
                  name="email"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label={i18n.t("common.phone")}
                  name="phone"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={SelectLanguage}
                  name="language"
                  fullWidth
                  variant="outlined"
                  margin="dense"
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="plan-selection">
                    {i18n.t("companies.form.plan")}
                  </InputLabel>
                  <Field
                    as={Select}
                    id="plan-selection"
                    label={i18n.t("companies.form.plan")}
                    labelId="plan-selection-label"
                    name="planId"
                    margin="dense"
                    required
                  >
                    {plans.map((plan, key) => (
                      <MenuItem key={key} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="status-selection">
                    {i18n.t("common.status")}
                  </InputLabel>
                  <Field
                    as={Select}
                    id="status-selection"
                    label={i18n.t("common.status")}
                    labelId="status-selection-label"
                    name="status"
                    margin="dense"
                  >
                    <MenuItem value={true}>{i18n.t("common.yes")}</MenuItem>
                    <MenuItem value={false}>{i18n.t("common.no")}</MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="campaigns-selection">
                    {i18n.t("companiesManager.form.campaigns")}
                  </InputLabel>
                  <Field
                    as={Select}
                    id="campaigns-selection"
                    label={i18n.t("companiesManager.form.campaigns")}
                    labelId="campaigns-selection-label"
                    name="campaignsEnabled"
                    margin="dense"
                  >
                    <MenuItem value={true}>{i18n.t("common.enabled")}</MenuItem>
                    <MenuItem value={false}>
                      {i18n.t("common.disabled")}
                    </MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl variant="outlined" fullWidth>
                  <Field
                    as={TextField}
                    label={i18n.t("common.dueDate")}
                    type="date"
                    name="dueDate"
                    InputLabelProps={{
                      shrink: true
                    }}
                    variant="outlined"
                    fullWidth
                    margin="dense"
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="recorrencia-selection">
                    {i18n.t("companiesManager.form.recurrence")}
                  </InputLabel>
                  <Field
                    as={Select}
                    label={i18n.t("companiesManager.form.recurrence")}
                    labelId="recorrencia-selection-label"
                    id="recurrence"
                    name="recurrence"
                    margin="dense"
                  >
                    <MenuItem value="MENSAL">
                      {i18n.t("companiesManager.form.monthly")}
                    </MenuItem>
                    <MenuItem value="BIMESTRAL">
                      {i18n.t("companiesManager.form.bimonthly")}
                    </MenuItem>
                    <MenuItem value="TRIMESTRAL">
                      {i18n.t("companiesManager.form.quarterly")}
                    </MenuItem>
                    <MenuItem value="SEMESTRAL">
                      {i18n.t("companiesManager.form.semiannual")}
                    </MenuItem>
                    <MenuItem value="ANUAL">
                      {i18n.t("companiesManager.form.annual")}
                    </MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} item>
                <Grid justifyContent="flex-end" spacing={1} container>
                  <Grid xs={4} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading}
                      onClick={() => onCancel()}
                      variant="contained"
                    >
                      {i18n.t("companiesManager.buttons.clear")}
                    </ButtonWithSpinner>
                  </Grid>
                  {record.id !== undefined ? (
                    <>
                      <Grid xs={6} md={2} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => onImpersonate(record)}
                          variant="outlined"
                          color="primary"
                        >
                          {i18n.t("companiesManager.buttons.accessAs")}
                        </ButtonWithSpinner>
                      </Grid>
                      <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => onDelete(record)}
                          variant="contained"
                          color="secondary"
                        >
                          {i18n.t("common.delete")}
                        </ButtonWithSpinner>
                      </Grid>
                      <Grid xs={6} md={2} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => incrementDueDate()}
                          variant="contained"
                          color="primary"
                        >
                          {i18n.t("companiesManager.buttons.incrementDueDate")}
                        </ButtonWithSpinner>
                      </Grid>
                      <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => handleOpenModalUsers()}
                          variant="contained"
                          color="primary"
                        >
                          {i18n.t("common.user")}
                        </ButtonWithSpinner>
                      </Grid>
                    </>
                  ) : null}
                  <Grid xs={6} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading}
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      {i18n.t("common.save")}
                    </ButtonWithSpinner>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
}

const formatBytes = bytes => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export function CompaniesManagerGrid(props) {
  const { records, onSelect } = props;
  const classes = useStyles();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [storage, setStorage] = useState({});

  // espaço em disco usado por cada empresa (mídias das conversas)
  useEffect(() => {
    api
      .get("/companies/storage")
      .then(({ data }) => setStorage(data || {}))
      .catch(() => setStorage({}));
  }, []);
  const { dateToClient } = useDate();
  const { getSetting } = useSettings();
  const [gracePeriod, setGracePeriod] = useState(5);

  useEffect(() => {
    getSetting("gracePeriod").then(value => {
      if (!isNaN(Number(value))) {
        setGracePeriod(Number(value));
      }
    });
  }, [getSetting]);

  const renderStatus = row => {
    return row.status === false ? i18n.t("common.no") : i18n.t("common.yes");
  };

  const renderPlan = row => {
    return row.planId !== null ? row.plan.name : i18n.t("common.undefined");
  };

  const renderCampaignsStatus = row => {
    if (
      has(row, "settings") &&
      isArray(row.settings) &&
      row.settings.length > 0
    ) {
      const setting = row.settings.find(s => s.key === "campaignsEnabled");
      if (setting) {
        return setting.value === "true"
          ? i18n.t("common.enabled")
          : i18n.t("common.disabled");
      }
    }
    return i18n.t("common.disabled");
  };

  const rowClass = record => {
    if (moment(record.dueDate).isValid()) {
      const now = moment();
      const dueDate = moment(record.dueDate);
      const diff = dueDate.diff(now, "days");
      if (diff < -gracePeriod) {
        return classes.inactive;
      }
      if (diff < 0) {
        return classes.gracePeriod;
      }
      if (diff < 7) {
        return classes.almostDue;
      }
    }
    return classes.active;
  };

  if (isPhone) {
    return (
      <div className={classes.companyCards}>
        {records.map(row => (
          <div
            key={row.id}
            className={clsx(classes.companyCard, rowClass(row))}
          >
            <div className={classes.companyCardHead}>
              <span className={classes.companyName}>{row.name || "-"}</span>
              <IconButton size="small" onClick={() => onSelect(row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </div>
            <dl className={classes.companyFacts}>
              <dt>{i18n.t("companies.form.plan")}</dt>
              <dd>{renderPlan(row)}</dd>
              <dt>{i18n.t("common.status")}</dt>
              <dd>{renderStatus(row)}</dd>
              <dt>{i18n.t("common.dueDate")}</dt>
              <dd>
                {dateToClient(row.dueDate)}
                {row.recurrence ? ` · ${row.recurrence}` : ""}
              </dd>
              <dt>{i18n.t("companiesManager.table.storage")}</dt>
              <dd>{formatBytes(storage[row.id])}</dd>
              <dt>{i18n.t("common.email")}</dt>
              <dd className={classes.companyBreak}>{row.email || "-"}</dd>
              <dt>{i18n.t("common.phone")}</dt>
              <dd>{row.phone || "-"}</dd>
              <dt>{i18n.t("companiesManager.table.campaigns")}</dt>
              <dd>{renderCampaignsStatus(row)}</dd>
            </dl>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Paper className={classes.tableContainer}>
      <Table
        className={classes.fullWidth}
        size="small"
        aria-label="a dense table"
      >
        <TableHead>
          <TableRow>
            <TableCell align="center" style={{ width: "1%" }}>
              #
            </TableCell>
            <TableCell align="left">{i18n.t("common.name")}</TableCell>
            <TableCell align="left">{i18n.t("common.email")}</TableCell>
            <TableCell align="left">{i18n.t("common.phone")}</TableCell>
            <TableCell align="left">{i18n.t("companies.form.plan")}</TableCell>
            <TableCell align="left">
              {i18n.t("companiesManager.table.campaigns")}
            </TableCell>
            <TableCell align="left">{i18n.t("common.status")}</TableCell>
            <TableCell align="left">
              {i18n.t("companiesManager.table.createdAt")}
            </TableCell>
            <TableCell align="left">{i18n.t("common.dueDate")}</TableCell>
            <TableCell align="left">
              {i18n.t("companiesManager.table.storage")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row, key) => (
            <TableRow className={rowClass(row)} key={key}>
              <TableCell align="center" style={{ width: "1%" }}>
                <IconButton onClick={() => onSelect(row)} aria-label="delete">
                  <EditIcon />
                </IconButton>
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.name || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.email || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {row.phone || "-"}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderPlan(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderCampaignsStatus(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {renderStatus(row)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {dateToClient(row.createdAt)}
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {dateToClient(row.dueDate)}
                <br />
                <span>{row.recurrence}</span>
              </TableCell>
              <TableCell align="left" style={{ color: "unset" }}>
                {formatBytes(storage[row.id])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function CompaniesManager() {
  const classes = useStyles();
  const { list, save, update, remove } = useCompanies();

  const [showConfirmDeleteDialog, setShowConfirmDeleteDialog] = useState(false);
  const [showConfirmImpersonateDialog, setShowConfirmImpersonateDialog] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    language: "",
    planId: "",
    status: true,
    campaignsEnabled: false,
    dueDate: "",
    recurrence: ""
  });

  const { handleImpersonate } = useContext(AuthContext);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const companyList = await list();
      setRecords(companyList);
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.loadError"));
    }
    setLoading(false);
  };

  const handleSubmit = async data => {
    setLoading(true);
    try {
      if (data.id !== undefined) {
        await update(data);
      } else {
        await save(data);
      }
      await loadPlans();
      handleCancel();
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationErrorDuplicate"));
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await remove(record.id);
      await loadPlans();
      handleCancel();
      toast.success(i18n.t("companiesManager.toasts.operationSuccess"));
    } catch (e) {
      toast.error(i18n.t("companiesManager.toasts.operationError"));
    }
    setLoading(false);
  };

  const onImpersonate = async () => {
    handleImpersonate(record.id);
  };

  const handleOpenDeleteDialog = () => {
    setShowConfirmDeleteDialog(true);
  };

  const handleOpenImpersonateDialog = () => {
    setShowConfirmImpersonateDialog(true);
  };

  const handleCancel = () => {
    setRecord(prev => ({
      ...prev,
      name: "",
      email: "",
      phone: "",
      language: "",
      planId: "",
      status: true,
      campaignsEnabled: false,
      dueDate: "",
      recurrence: ""
    }));
  };

  const handleSelect = data => {
    let campaignsEnabled = false;

    const setting = data.settings.find(
      s => s.key.indexOf("campaignsEnabled") > -1
    );
    if (setting) {
      campaignsEnabled =
        setting.value === "true" || setting.value === "enabled";
    }

    setRecord(prev => ({
      ...prev,
      id: data.id,
      name: data.name || "",
      phone: data.phone || "",
      language: data.language || "",
      email: data.email || "",
      planId: data.planId || "",
      status: data.status === false ? false : true,
      campaignsEnabled,
      dueDate: data.dueDate || "",
      recurrence: data.recurrence || ""
    }));
  };

  return (
    <Paper className={classes.mainPaper} elevation={0}>
      <Grid spacing={2} container>
        <Grid xs={12} item>
          <CompanyForm
            initialValue={record}
            onDelete={handleOpenDeleteDialog}
            onImpersonate={handleOpenImpersonateDialog}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} item>
          <CompaniesManagerGrid records={records} onSelect={handleSelect} />
        </Grid>
      </Grid>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.deleteTitle")}
        open={showConfirmDeleteDialog}
        onClose={() => setShowConfirmDeleteDialog(false)}
        onConfirm={() => handleDelete()}
      >
        {i18n.t("companiesManager.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      <ConfirmationModal
        title={i18n.t("companiesManager.confirmationModal.impersonateTitle")}
        open={showConfirmImpersonateDialog}
        onClose={() => setShowConfirmImpersonateDialog(false)}
        onConfirm={() => onImpersonate()}
      >
        {i18n.t("companiesManager.confirmationModal.impersonateMessage")}
      </ConfirmationModal>
    </Paper>
  );
}
