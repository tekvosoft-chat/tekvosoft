import React, { useState, useEffect, useContext } from "react";

import Paper from "@material-ui/core/Paper";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

// ICONS
import GroupAddIcon from "@material-ui/icons/GroupAdd";
import HourglassEmptyIcon from "@material-ui/icons/HourglassEmpty";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import TimerIcon from "@material-ui/icons/Timer";

import { makeStyles, useTheme } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { toast } from "react-toastify";

import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";

import { isEmpty } from "lodash";
import moment from "moment";
import { i18n } from "../../translate/i18n";
import useAuth from "../../hooks/useAuth.js";

import { SmallPie } from "./SmallPie";
import SuperDashboard from "./SuperDashboard";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketCountersChart } from "./TicketCountersChart";
import { getTimezoneOffset } from "../../helpers/getTimezoneOffset.js";

import api from "../../services/api.js";
import { SocketContext } from "../../context/Socket/SocketContext.js";
import { formatTimeInterval } from "../../helpers/formatTimeInterval.js";

const useStyles = makeStyles(theme => ({
  container: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    [theme.breakpoints.down("xs")]: {
      paddingTop: theme.spacing(2),
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5)
    }
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "column",
    height: 240,
    overflowY: "auto",
    ...theme.scrollbarStyles
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7)
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700]
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px"
  },
  alignRight: {
    textAlign: "right"
  },
  fullWidth: {
    width: "100%"
  },
  selectContainer: {
    width: "100%",
    textAlign: "left"
  },
  /**
   * Card de métrica.
   *
   * Antes existiam DOIS cards diferentes sem motivo: três roxos maciços e
   * quatro cinzas com texto na cor da marca — que sobre cinza escuro ficava
   * ilegível. Agora é um só, e o roxo aparece na dose certa: no quadradinho
   * do ícone. O que puxa o olho passa a ser o número, que é a informação.
   */
  metricCard: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: theme.spacing(1.5),
    padding: theme.spacing(2.25),
    height: "100%",
    minHeight: 116,
    [theme.breakpoints.down("xs")]: {
      padding: theme.spacing(1.5),
      minHeight: 92,
      gap: theme.spacing(1),
      "& $metricValue": { fontSize: "1.5rem" },
      "& $metricLabel": { fontSize: "0.75rem" },
      "& $metricIcon": { width: 34, height: 34, "& svg": { fontSize: 18 } }
    },
    borderRadius: theme.palette.tkv.radius.lg,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    transition: "border-color .15s ease",
    "&:hover": { borderColor: theme.palette.tkv.borderStrong }
  },
  metricBody: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(0.75)
  },
  metricLabel: {
    fontSize: "0.8125rem",
    fontWeight: 600,
    lineHeight: 1.3,
    color: theme.palette.text.secondary,
    margin: 0
  },
  metricValue: {
    fontSize: "1.875rem",
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    color: theme.palette.text.primary,
    margin: 0
  },
  metricIcon: {
    flex: "none",
    width: 44,
    height: 44,
    borderRadius: theme.palette.tkv.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `var(--metric-tone, ${theme.palette.tkv.brand.main})`,
    color: "#FFFFFF",
    boxShadow: "0 8px 18px -12px var(--metric-tone)",
    "& svg": { fontSize: 22 }
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.75, 2),
    borderRadius: theme.palette.tkv.radius.lg,
    backgroundColor: theme.palette.tkv.surface,
    border: `1px solid ${theme.palette.tkv.border}`
  },
  filterField: {
    minWidth: 210,
    margin: 0,
    [theme.breakpoints.down("xs")]: { minWidth: 0, width: "100%" }
  },
  metricRing: {
    flex: "none",
    width: 60,
    height: 60,
    marginTop: -2,
    [theme.breakpoints.down("xs")]: { display: "none" }
  },

  // cabeçalho de cada bloco: título e, à direita, o que filtra o bloco
  sectionHead: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1)
  },
  sectionTitle: {
    fontSize: "1.0625rem",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: theme.palette.text.primary
  },
  sectionHint: {
    fontSize: "0.8125rem",
    color: theme.palette.text.secondary
  },
  liveDot: {
    display: "inline-block",
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: "50%",
    verticalAlign: "middle",
    backgroundColor: theme.palette.tkv.semantic.success,
    boxShadow: `0 0 0 4px ${theme.palette.tkv.semantic.successSoft}`
  },
  chartCard: {
    padding: theme.spacing(2),
    borderRadius: theme.palette.tkv.radius.lg,
    border: `1px solid ${theme.palette.tkv.border}`,
    backgroundColor: theme.palette.tkv.surface,
    height: 280,
    display: "flex",
    flexDirection: "column"
  }
}));

// cada cartão puxa uma cor diferente da paleta de apoio: o painel deixa de
// ser um bloco só da cor da marca
const MetricCard = ({ title, value, icon, graph, tone = 0 }) => {
  const classes = useStyles();
  const theme = useTheme();
  const accents = theme.palette.tkv.accents || [];
  const color = accents.length ? accents[tone % accents.length] : undefined;

  return (
    <Paper
      className={classes.metricCard}
      variant="outlined"
      style={color ? { "--metric-tone": color } : undefined}
    >
      <div className={classes.metricBody}>
        <Typography component="h3" className={classes.metricLabel}>
          {title}
        </Typography>
        <Typography component="p" className={classes.metricValue}>
          {value}
        </Typography>
      </div>
      {graph ? (
        <div className={classes.metricRing}>{graph}</div>
      ) : (
        icon && <div className={classes.metricIcon}>{icon}</div>
      )}
    </Paper>
  );
};

// Dois atalhos para manter as chamadas existentes iguais. A diferença entre
// eles agora é só o que aparece à direita (ícone ou anel), não o visual.
let infoTone = 0;
const InfoCard = props => (
  <Grid item xs={6} sm={6} md={3}>
    <MetricCard tone={(infoTone += 1)} {...props} />
  </Grid>
);

let ringTone = 0;
const InfoRingCard = props => (
  <Grid item xs={4} sm={4}>
    <MetricCard tone={(ringTone += 1) + 2} {...props} />
  </Grid>
);

const CompanyDashboard = ({ embedded = false }) => {
  const classes = useStyles();
  const theme = useTheme();
  const [period, setPeriod] = useState(0);
  const [currentUser, setCurrentUser] = useState({});
  const [dateFrom, setDateFrom] = useState(
    moment("1", "D").format("YYYY-MM-DDTHH") + ":00"
  );
  const [dateTo, setDateTo] = useState(
    moment().format("YYYY-MM-DDTHH") + ":59"
  );
  const { getCurrentUserInfo } = useAuth();

  const [usersOnlineTotal, setUsersOnlineTotal] = useState(0);
  const [usersOfflineTotal, setUsersOfflineTotal] = useState(0);
  const [usersStatusChartData, setUsersStatusChartData] = useState([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingChartData, setPendingChartData] = useState([]);
  const [openedTotal, setOpenedTotal] = useState(0);
  const [openedChartData, setOpenedChartData] = useState([]);

  const [ticketsData, setTicketsData] = useState({});
  const [usersData, setUsersData] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const socketManager = useContext(SocketContext);
  const companyId = localStorage.getItem("companyId");

  useEffect(() => {
    const socket = socketManager.GetSocket(companyId);

    socket.on("userOnlineChange", updateStatus);
    socket.on("counter", updateStatus);

    return () => {
      socket.disconnect();
    };
  }, [socketManager, companyId]);

  useEffect(() => {
    getCurrentUserInfo().then(user => {
      if (user?.profile !== "admin") {
        window.location.href = "/tickets";
      }
      setCurrentUser(user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [period]);

  async function handleChangePeriod(value) {
    setPeriod(value);
  }

  async function updateStatus() {
    api
      .get("/dashboard/status")
      .then(result => {
        const { data } = result;

        if (!data) return;

        let usersOnlineTotal = 0;
        let usersOfflineTotal = 0;
        data.usersStatusSummary.forEach(item => {
          if (item.online) {
            usersOnlineTotal++;
          } else {
            usersOfflineTotal++;
          }
        });

        setUsersStatusChartData([
          {
            name: "Online",
            value: usersOnlineTotal,
            color: theme.palette.tkv.semantic.success
          },
          {
            name: "Offline",
            value: usersOfflineTotal,
            // cinza, não vermelho: estar offline não é erro
            color: theme.palette.tkv.borderStrong
          }
        ]);

        setUsersOnlineTotal(usersOnlineTotal);
        setUsersOfflineTotal(usersOfflineTotal);

        let pendingTotal = 0;
        let openedTotal = 0;
        const pendingChartData = [];
        const openedChartData = [];
        data.ticketsStatusSummary.forEach(item => {
          if (item.status === "pending") {
            pendingTotal += Number(item.count);
            pendingChartData.push({
              name: item.queue?.name || i18n.t("common.noqueue"),
              value: Number(item.count),
              color: item.queue?.color || "#888"
            });
            return;
          }
          if (item.status === "open") {
            openedTotal += Number(item.count);
            openedChartData.push({
              name: item.queue?.name || i18n.t("common.noqueue"),
              value: Number(item.count),
              color: item.queue?.color || "#888"
            });
          }
        });
        setPendingTotal(pendingTotal);
        setPendingChartData(pendingChartData);
        setOpenedTotal(openedTotal);
        setOpenedChartData(openedChartData);
      })
      .catch(() => {});
  }

  async function fetchData() {
    let params = { tz: getTimezoneOffset() };

    const days = Number(period);

    if (days) {
      params = {
        date_from: moment().subtract(days, "days").format("YYYY-MM-DD"),
        date_to: moment().format("YYYY-MM-DD")
      };
    }

    if (!days && !isEmpty(dateFrom) && moment(dateFrom).isValid()) {
      params = {
        ...params,
        date_from: moment(dateFrom).format("YYYY-MM-DD"),
        hour_from: moment(dateFrom).format("HH:mm:ss")
      };
    }

    if (!days && !isEmpty(dateTo) && moment(dateTo).isValid()) {
      params = {
        ...params,
        date_to: moment(dateTo).format("YYYY-MM-DD"),
        hour_to: moment(dateTo).format("HH:mm:ss")
      };
    }

    if (Object.keys(params).length === 0) {
      toast.error(i18n.t("dashboard.filter.invalid"));
      return;
    }

    api
      .get("/dashboard/tickets", { params })
      .then(result => {
        if (result?.data) {
          setTicketsData(result.data);
        }
      })
      .catch(() => {});

    setLoadingUsers(true);
    api
      .get("/dashboard/users", { params })
      .then(result => {
        if (result?.data) {
          setUsersData(result.data);
          setLoadingUsers(false);
        }
      })
      .catch(() => {});
  }

  useEffect(() => {
    updateStatus();
  }, []);

  /**
   * Barra de período.
   *
   * Antes os três campos eram itens soltos do MESMO grid dos cards, então
   * caíam no meio das métricas como se fossem mais um cartão — e ainda havia
   * um item vazio de largura variável só para empurrar o layout. Agora é uma
   * faixa própria: fica claro que aquilo filtra o que vem abaixo.
   */
  function renderFilters() {
    return (
      <Grid item xs={12}>
        <div className={classes.sectionHead}>
          <div>
            <Typography component="h2" className={classes.sectionTitle}>
              {i18n.t("dashboard.sections.period")}
            </Typography>
            <Typography className={classes.sectionHint}>
              {i18n.t("dashboard.sections.periodHint")}
            </Typography>
          </div>
        </div>
        <Paper
          variant="outlined"
          className={classes.filterBar}
          style={{ marginTop: 12 }}
        >
          <FormControl className={classes.filterField}>
            <InputLabel id="period-selector-label">
              {i18n.t("dashboard.filter.period")}
            </InputLabel>
            <Select
              labelId="period-selector-label"
              id="period-selector"
              label={i18n.t("dashboard.filter.period")}
              value={period}
              onChange={e => handleChangePeriod(e.target.value)}
            >
              <MenuItem value={0}>{i18n.t("dashboard.filter.custom")}</MenuItem>
              <MenuItem value={3}>
                {i18n.t("dashboard.filter.last3days")}
              </MenuItem>
              <MenuItem value={7}>
                {i18n.t("dashboard.filter.last7days")}
              </MenuItem>
              <MenuItem value={15}>
                {i18n.t("dashboard.filter.last14days")}
              </MenuItem>
              <MenuItem value={30}>
                {i18n.t("dashboard.filter.last30days")}
              </MenuItem>
              <MenuItem value={90}>
                {i18n.t("dashboard.filter.last90days")}
              </MenuItem>
            </Select>
          </FormControl>

          {!period && (
            <>
              <TextField
                label={i18n.t("dashboard.date.start")}
                type="datetime-local"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                onBlur={fetchData}
                className={classes.filterField}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label={i18n.t("dashboard.date.end")}
                type="datetime-local"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                onBlur={fetchData}
                className={classes.filterField}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </Paper>
      </Grid>
    );
  }

  if (currentUser?.profile !== "admin") {
    return <div></div>;
  }

  return (
    <div>
      <Container
        maxWidth="lg"
        className={classes.container}
        style={embedded ? { padding: 0 } : undefined}
      >
        <Grid container spacing={2} justifyContent="flex-start">
          <Grid item xs={12}>
            <div className={classes.sectionHead} style={{ marginTop: 0 }}>
              <div>
                <Typography component="h2" className={classes.sectionTitle}>
                  <span className={classes.liveDot} />
                  {i18n.t("dashboard.sections.now")}
                </Typography>
                <Typography className={classes.sectionHint}>
                  {i18n.t("dashboard.sections.nowHint")}
                </Typography>
              </div>
            </div>
          </Grid>
          {/* USUARIOS ONLINE */}
          <InfoRingCard
            title={i18n.t("dashboard.usersOnline")}
            value={`${usersOnlineTotal}/${usersOnlineTotal + usersOfflineTotal}`}
            graph={<SmallPie chartData={usersStatusChartData} />}
          />

          {/* ATENDIMENTOS PENDENTES */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsWaiting")}
            value={pendingTotal}
            graph={<SmallPie chartData={pendingChartData} />}
          />

          {/* ATENDIMENTOS ACONTECENDO */}
          <InfoRingCard
            title={i18n.t("dashboard.ticketsOpen")}
            value={openedTotal}
            graph={<SmallPie chartData={openedChartData} />}
          />

          {/* FILTROS */}
          {renderFilters()}

          {/* ATENDIMENTOS REALIZADOS */}
          <InfoCard
            title={i18n.t("dashboard.ticketsDone")}
            value={ticketsData.ticketStatistics?.totalClosed || 0}
            icon={<CheckCircleIcon />}
          />

          {/* NOVOS CONTATOS */}
          <InfoCard
            title={i18n.t("dashboard.newContacts")}
            value={ticketsData.ticketStatistics?.newContacts || 0}
            icon={<GroupAddIcon />}
          />

          {/* T.M. DE ATENDIMENTO */}
          <InfoCard
            title={i18n.t("dashboard.avgServiceTime")}
            value={formatTimeInterval(
              ticketsData.ticketStatistics?.avgServiceTime
            )}
            icon={<TimerIcon />}
          />

          {/* T.M. DE ESPERA */}
          <InfoCard
            title={i18n.t("dashboard.avgWaitTime")}
            value={formatTimeInterval(
              ticketsData.ticketStatistics?.avgWaitTime
            )}
            icon={<HourglassEmptyIcon />}
          />

          {/* DASHBOARD ATENDIMENTOS NO PERÍODO */}
          <Grid item xs={12}>
            <div className={classes.chartCard}>
              <TicketCountersChart
                ticketCounters={ticketsData.ticketCounters}
              />
            </div>
          </Grid>

          {/* EQUIPE */}
          <Grid item xs={12}>
            <div className={classes.sectionHead}>
              <div>
                <Typography component="h2" className={classes.sectionTitle}>
                  {i18n.t("dashboard.sections.team")}
                </Typography>
                <Typography className={classes.sectionHint}>
                  {i18n.t("dashboard.sections.teamHint")}
                </Typography>
              </div>
            </div>
          </Grid>
          <Grid item xs={12}>
            {usersData.userReport?.length ? (
              <TableAttendantsStatus
                attendants={usersData.userReport}
                loading={loadingUsers}
              />
            ) : null}
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

/**
 * Dashboard: só administradores entram (usuários vão para os atendimentos).
 * O super admin ganha o painel da plataforma, com o da própria empresa
 * numa das abas.
 */
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  if (user?.super) {
    return <SuperDashboard companyDashboard={<CompanyDashboard embedded />} />;
  }
  return <CompanyDashboard />;
};

export default Dashboard;
