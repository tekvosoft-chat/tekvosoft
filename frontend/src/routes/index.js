import React, { useEffect, useState } from "react";
import { BrowserRouter, Redirect, Switch } from "react-router-dom";
import AppToaster from "../components/AppToaster";

import LoggedInLayout from "../layout";
import Dashboard from "../pages/Dashboard/";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Signup from "../pages/Signup/";
import Login from "../pages/Login/";
import Connections from "../pages/Connections/";
import SettingsCustom from "../pages/SettingsCustom/";
import Financeiro from "../pages/Financeiro/";
import Users from "../pages/Users";
import Contacts from "../pages/Contacts/";
import Queues from "../pages/Queues/";
import MessagesAPI from "../pages/MessagesAPI/";
import Helps from "../pages/Helps/";
import ContactLists from "../pages/ContactLists/";
import ContactListItems from "../pages/ContactListItems/";
// import Companies from "../pages/Companies/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
import withPlanFeature from "../components/PlanGate";
import Schedules from "../pages/Schedules";
import Campaigns from "../pages/Campaigns";
import CampaignsConfig from "../pages/CampaignsConfig";
import CampaignReport from "../pages/CampaignReport";
import Chat from "../pages/Chat";
import Kanban from "../pages/Kanban/";
import Subscription from "../pages/Subscription/";

// telas que dependem do plano contratado
const KanbanPage = withPlanFeature(Kanban, "useKanban");
const ChatPage = withPlanFeature(Chat, "useInternalChat");
const SchedulesPage = withPlanFeature(Schedules, "useSchedules");
const MessagesAPIPage = withPlanFeature(MessagesAPI, "useExternalApi");
const CampaignsPage = withPlanFeature(Campaigns, "useCampaigns");
const CampaignsConfigPage = withPlanFeature(CampaignsConfig, "useCampaigns");
const CampaignReportPage = withPlanFeature(CampaignReport, "useCampaigns");
const ContactListsPage = withPlanFeature(ContactLists, "useCampaigns");
const ContactListItemsPage = withPlanFeature(ContactListItems, "useCampaigns");

const Routes = () => {
  const [showCampaigns, setShowCampaigns] = useState(false);

  useEffect(() => {
    const cshow = localStorage.getItem("cshow");
    if (cshow !== undefined) {
      setShowCampaigns(true);
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketsContextProvider>
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            {/* <Route exact path="/create-company" component={Companies} /> */}
            <WhatsAppsProvider>
              <LoggedInLayout>
                <Route exact path="/" component={Dashboard} isPrivate />
                <Route
                  exact
                  path="/tickets/:ticketId?"
                  component={TicketResponsiveContainer}
                  isPrivate
                />
                <Route
                  exact
                  path="/connections"
                  component={Connections}
                  isPrivate
                />
                {/* respostas rápidas agora ficam dentro da conversa (botão ⚡) */}
                <Route
                  exact
                  path="/quick-messages"
                  component={() => <Redirect to="/tickets" />}
                  isPrivate
                />
                <Route
                  exact
                  path="/schedules"
                  component={SchedulesPage}
                  isPrivate
                />
                <Route exact path="/kanban" component={KanbanPage} isPrivate />
                {/* "Tarefas" virou Kanban: links e favoritos antigos continuam
                    chegando ao lugar certo */}
                <Route
                  exact
                  path="/todolist"
                  component={() => <Redirect to="/kanban" />}
                  isPrivate
                />
                {/* as etiquetas agora vivem só no Kanban (cada coluna é uma) */}
                <Route
                  exact
                  path="/tags"
                  component={() => <Redirect to="/kanban" />}
                  isPrivate
                />
                <Route exact path="/contacts" component={Contacts} isPrivate />
                <Route exact path="/helps" component={Helps} isPrivate />
                <Route exact path="/users" component={Users} isPrivate />
                <Route
                  exact
                  path="/messages-api"
                  component={MessagesAPIPage}
                  isPrivate
                />
                <Route
                  exact
                  path="/settings"
                  component={SettingsCustom}
                  isPrivate
                />
                <Route
                  exact
                  path="/financeiro"
                  component={Financeiro}
                  isPrivate
                />
                <Route exact path="/queues" component={Queues} isPrivate />
                <Route
                  exact
                  path="/subscription"
                  component={Subscription}
                  isPrivate
                />

                <Route
                  exact
                  path="/chats/:id?"
                  component={ChatPage}
                  isPrivate
                />
                {showCampaigns && (
                  <>
                    <Route
                      exact
                      path="/contact-lists"
                      component={ContactListsPage}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/contact-lists/:contactListId/contacts"
                      component={ContactListItemsPage}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns"
                      component={CampaignsPage}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaign/:campaignId/report"
                      component={CampaignReportPage}
                      isPrivate
                    />
                    <Route
                      exact
                      path="/campaigns-config"
                      component={CampaignsConfigPage}
                      isPrivate
                    />
                  </>
                )}
              </LoggedInLayout>
            </WhatsAppsProvider>
          </Switch>
          <AppToaster />
        </TicketsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
