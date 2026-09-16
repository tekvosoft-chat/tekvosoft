import React, { useContext, useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import InputBase from "@material-ui/core/InputBase";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Badge from "@material-ui/core/Badge";
import MoveToInboxIcon from "@material-ui/icons/MoveToInbox";
import CheckBoxIcon from "@material-ui/icons/CheckBox";

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import {
  Badge as MuiBadge,
  Box,
  Button,
  IconButton,
  Tooltip,
  useMediaQuery
} from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";
import AddRoundedIcon from "@material-ui/icons/AddRounded";
import TuneRoundedIcon from "@material-ui/icons/TuneRounded";
import Collapse from "@material-ui/core/Collapse";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPeopleGroup } from "@fortawesome/free-solid-svg-icons";
import useSettings from "../../hooks/useSettings";
import { ContactSelect } from "../ContactSelect";

const useStyles = makeStyles(theme => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },

  tabsHeader: {
    flex: "none"
    // backgroundColor: "#eee",
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: 8
  },

  tabWithGroups: {
    minWidth: 90,
    width: 90
  },

  tab: {
    minWidth: 120,
    width: 120
  },

  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.tkv.border}`
  },

  // ── versão de celular da linha de opções ──
  // Em 390px de largura, botão + interruptor "Todos" + seletor de filas não
  // cabem: ou quebram em duas linhas, ou empurram a lista para fora da
  // primeira dobra. Viram um botão de criar e um de filtros; o conteúdo dos
  // filtros vai para um painel que sobe.
  optionsMobile: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.75, 1.25)
  },
  optionsSpacer: { flex: 1 },
  // ── celular: abas em pílula (segmentado) ──
  pillTabs: {
    minHeight: 38,
    margin: theme.spacing(1, 1.25, 0.5),
    padding: 3,
    borderRadius: 999,
    backgroundColor: theme.palette.tkv.surfaceSunken,
    "& .MuiTabs-flexContainer": { position: "relative", zIndex: 1 }
  },
  pillIndicator: {
    height: "100%",
    borderRadius: 999,
    zIndex: 0,
    backgroundColor: theme.palette.tkv.surface,
    boxShadow: "0 2px 8px -2px rgba(12, 10, 20, 0.25)",
    transition: "all .28s cubic-bezier(.3, 1.3, .5, 1)"
  },
  pillTab: {
    minWidth: 0,
    width: "auto",
    flex: 1,
    minHeight: 32,
    padding: "4px 8px",
    borderRadius: 999,
    textTransform: "none",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
    opacity: 1,
    transition: "color .2s ease",
    "&.Mui-selected": { color: theme.palette.text.primary }
  },
  newButtonPhone: {
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 600,
    boxShadow: "none",
    padding: "4px 14px"
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.tkv.surfaceSunken,
    transition: "background-color .2s ease, color .2s ease, transform .15s",
    "&:active": { transform: "scale(0.92)" },
    "& svg": { transition: "transform .3s cubic-bezier(.3, 1.4, .5, 1)" }
  },
  filterButtonOn: {
    color: theme.palette.tkv.brand.contrastText,
    backgroundColor: `${theme.palette.tkv.brand.main} !important`,
    "& svg": { transform: "rotate(90deg)" }
  },
  // filtros abrem ali mesmo, deslizando por baixo da linha, sem modal
  filterPanel: {
    margin: theme.spacing(0, 1.25, 1),
    padding: theme.spacing(1, 1.25),
    borderRadius: 16,
    backgroundColor: theme.palette.tkv.surfaceSunken,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    animation: "$dropIn .28s cubic-bezier(.3, 1.3, .5, 1)",
    "& .MuiFormControlLabel-root": {
      marginLeft: 0,
      justifyContent: "space-between"
    }
  },
  "@keyframes dropIn": {
    from: { opacity: 0, transform: "translateY(-8px) scale(.98)" },
    to: { opacity: 1, transform: "none" }
  },
  sheetSection: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
    padding: theme.spacing(0.5, 1, 1)
  },
  filterBadge: {
    "& .MuiBadge-badge": {
      backgroundColor: theme.palette.tkv.brand.main,
      color: theme.palette.tkv.brand.contrastText
    }
  },

  serachInputWrapper: {
    flex: 1,
    // background: "#fff",
    display: "flex",
    borderRadius: 40,
    padding: 4,
    marginRight: theme.spacing(1)
  },

  searchIcon: {
    color: "grey",
    marginLeft: 6,
    marginRight: 6,
    alignSelf: "center"
  },

  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30
  },

  badge: {
    right: "-10px"
  },
  show: {
    display: "block"
  },
  hide: {
    display: "none !important"
  },

  icon24: {
    width: 24,
    height: 24
  }
}));

const TicketsManagerTabs = () => {
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const searchInputRef = useRef();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { profile } = user;

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const userQueueIds = user.queues.map(q => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const { getSetting } = useSettings();
  const [showTabGroups, setShowTabGroups] = useState(false);

  useEffect(() => {
    Promise.all([getSetting("CheckMsgIsGroup"), getSetting("groupsTab")]).then(
      ([ignoreGroups, groupsTab]) => {
        setShowTabGroups(
          ignoreGroups === "disabled" && groupsTab === "enabled"
        );
      }
    );
  }, []);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN") {
      setShowAllTickets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
  }, [tab]);

  let searchTimeout;

  const handleSearch = e => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
    }, 500);
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = status => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleCloseOrOpenTicket = ticket => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = selecteds => {
    const tags = selecteds.map(t => t.id);
    setSelectedTags(tags);
  };

  const handleSelectedUsers = selecteds => {
    const users = selecteds.map(t => t.id);
    setSelectedUsers(users);
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={ticket => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <Paper elevation={0} square className={classes.tabsHeader}>
        <Tabs
          value={tab}
          onChange={handleChangeTab}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
          aria-label="icon label tabs example"
          classes={
            isPhone
              ? { root: classes.pillTabs, indicator: classes.pillIndicator }
              : undefined
          }
        >
          <Tab
            value={"open"}
            icon={isPhone ? undefined : <MoveToInboxIcon />}
            label={i18n.t("tickets.tabs.open.title")}
            classes={{
              root: isPhone
                ? classes.pillTab
                : showTabGroups
                  ? classes.tabWithGroups
                  : classes.tab
            }}
          />

          {showTabGroups && (
            <Tab
              value={"groups"}
              icon={
                isPhone ? undefined : (
                  <FontAwesomeIcon
                    className={classes.icon24}
                    icon={faPeopleGroup}
                  />
                )
              }
              label={i18n.t("tickets.tabs.groups.title")}
              classes={{
                root: isPhone ? classes.pillTab : classes.tabWithGroups
              }}
            />
          )}

          <Tab
            value={"closed"}
            icon={isPhone ? undefined : <CheckBoxIcon />}
            label={i18n.t("tickets.tabs.closed.title")}
            classes={{
              root: isPhone
                ? classes.pillTab
                : showTabGroups
                  ? classes.tabWithGroups
                  : classes.tab
            }}
          />

          <Tab
            value={"search"}
            icon={isPhone ? undefined : <SearchIcon />}
            label={i18n.t("tickets.tabs.search.title")}
            classes={{
              root: isPhone
                ? classes.pillTab
                : showTabGroups
                  ? classes.tabWithGroups
                  : classes.tab
            }}
          />
        </Tabs>
      </Paper>
      {(() => {
        const searchField = (
          <div className={classes.serachInputWrapper}>
            <SearchIcon className={classes.searchIcon} />
            <InputBase
              className={classes.searchInput}
              inputRef={searchInputRef}
              placeholder={i18n.t("tickets.search.placeholder")}
              type="search"
              onChange={handleSearch}
            />
          </div>
        );

        const showAllSwitch = tab === "open" && (
          <Can
            role={user.profile}
            perform="tickets-manager:showall"
            yes={() => (
              <FormControlLabel
                label={i18n.t("tickets.buttons.showAll")}
                labelPlacement="start"
                control={
                  <Switch
                    size="small"
                    checked={showAllTickets}
                    onChange={() => setShowAllTickets(prevState => !prevState)}
                    name="showAllTickets"
                    color="primary"
                  />
                }
              />
            )}
          />
        );

        const queueSelect = (
          <TicketsQueueSelect
            selectedQueueIds={selectedQueueIds}
            userQueues={user?.queues}
            onChange={values => setSelectedQueueIds(values)}
          />
        );

        // Badge só quando há restrição de verdade: filas selecionadas que
        // não são todas. "Todos" ligado é o estado padrão do admin — contá-lo
        // faria o badge nascer com 1 em toda visita e ensinar a ignorá-lo.
        const totalQueues = user?.queues?.length || 0;
        const chosenQueues = selectedQueueIds?.length || 0;
        const activeFilters =
          totalQueues > 0 && chosenQueues > 0 && chosenQueues < totalQueues
            ? 1
            : 0;

        if (isPhone) {
          return (
            <>
              <div className={classes.optionsMobile}>
                {tab === "search" ? (
                  searchField
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      className={classes.newButtonPhone}
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setNewTicketModalOpen(true)}
                    >
                      {i18n.t("ticketsManager.buttons.newTicket")}
                    </Button>
                    <div className={classes.optionsSpacer} />
                    <Tooltip title={i18n.t("common.filter")}>
                      <IconButton
                        size="small"
                        className={`${classes.filterButton}${filtersOpen ? ` ${classes.filterButtonOn}` : ""}`}
                        onClick={() => setFiltersOpen(v => !v)}
                        aria-label={i18n.t("common.filter")}
                        aria-expanded={filtersOpen}
                      >
                        <MuiBadge
                          badgeContent={activeFilters}
                          className={classes.filterBadge}
                        >
                          <TuneRoundedIcon />
                        </MuiBadge>
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </div>

              <Collapse in={filtersOpen && tab !== "search"} timeout={220}>
                <div className={classes.filterPanel}>
                  {showAllSwitch}
                  {queueSelect}
                </div>
              </Collapse>
            </>
          );
        }

        return (
          <Paper square elevation={0} className={classes.ticketOptionsBox}>
            {tab === "search" ? (
              searchField
            ) : (
              <>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddRoundedIcon />}
                  onClick={() => setNewTicketModalOpen(true)}
                >
                  {i18n.t("ticketsManager.buttons.newTicket")}
                </Button>
                {showAllSwitch}
              </>
            )}
            {queueSelect}
          </Paper>
        );
      })()}
      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Tabs
          value={tabOpen}
          onChange={handleChangeTabOpen}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          classes={
            isPhone
              ? { root: classes.pillTabs, indicator: classes.pillIndicator }
              : undefined
          }
        >
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={isPhone ? 0 : openCount}
                color="primary"
                max={999}
              >
                {i18n.t("ticketsList.assignedHeader")}
              </Badge>
            }
            value={"open"}
            classes={isPhone ? { root: classes.pillTab } : undefined}
          />
          <Tab
            label={
              <Badge
                className={classes.badge}
                badgeContent={isPhone ? 0 : pendingCount}
                color="secondary"
                max={999}
              >
                {i18n.t("ticketsList.pendingHeader")}
              </Badge>
            }
            value={"pending"}
            classes={isPhone ? { root: classes.pillTab } : undefined}
          />
        </Tabs>
        <Paper className={classes.ticketsWrapper}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            updateCount={val => setOpenCount(val)}
            style={applyPanelStyle("open")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            updateCount={val => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            setTabOpen={setTabOpen}
            showTabGroups={showTabGroups}
          />
        </Paper>
      </TabPanel>
      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
      <TabPanel value={tab} name="groups" className={classes.ticketsWrapper}>
        <TicketsList
          groups={true}
          showAll={true}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <Box style={{ paddingRight: 10, paddingLeft: 10 }}>
          <ContactSelect
            onSelected={contactId => {
              setSelectedContact(contactId);
            }}
            allowCreate={false}
          />
        </Box>
        <TagsFilter onFiltered={handleSelectedTags} />
        {profile === "admin" && (
          <UsersFilter onFiltered={handleSelectedUsers} />
        )}
        <TicketsList
          isSearch={true}
          searchParam={searchParam}
          showAll={true}
          contactId={selectedContact}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
          showTabGroups={showTabGroups}
        />
      </TabPanel>
    </Paper>
  );
};

export default TicketsManagerTabs;
