import React, { lazy, Suspense } from "react";
import PageLoader from "../components/ui/PageLoader";

// Telas carregadas sob demanda: o app abre só com o essencial (login e
// atendimentos) e cada outra tela baixa na primeira vez que é aberta.
import { BrowserRouter, Redirect, Switch } from "react-router-dom";
import AppToaster from "../components/AppToaster";

import LoggedInLayout from "../layout";
import TicketResponsiveContainer from "../pages/TicketResponsiveContainer";
import Login from "../pages/Login/";
import { AuthProvider } from "../context/Auth/AuthContext";
import { TicketsContextProvider } from "../context/Tickets/TicketsContext";
import { WhatsAppsProvider } from "../context/WhatsApp/WhatsAppsContext";
import Route from "./Route";
import withPlanFeature from "../components/PlanGate";
const Dashboard = lazy(() => import("../pages/Dashboard/"));
const Signup = lazy(() => import("../pages/Signup/"));
const Connections = lazy(() => import("../pages/Connections/"));
const SettingsCustom = lazy(() => import("../pages/SettingsCustom/"));
const Financeiro = lazy(() => import("../pages/Financeiro/"));
const Users = lazy(() => import("../pages/Users"));
const Contacts = lazy(() => import("../pages/Contacts/"));
const Queues = lazy(() => import("../pages/Queues/"));
const MessagesAPI = lazy(() => import("../pages/MessagesAPI/"));
const Helps = lazy(() => import("../pages/Helps/"));
const Profile = lazy(() => import("../pages/Profile/"));
const Schedules = lazy(() => import("../pages/Schedules"));
const Chat = lazy(() => import("../pages/Chat"));
const Kanban = lazy(() => import("../pages/Kanban/"));
const Subscription = lazy(() => import("../pages/Subscription/"));

// telas que dependem do plano contratado
const KanbanPage = withPlanFeature(Kanban, "useKanban");
const ChatPage = withPlanFeature(Chat, "useInternalChat");
const SchedulesPage = withPlanFeature(Schedules, "useSchedules");
const MessagesAPIPage = withPlanFeature(MessagesAPI, "useExternalApi");

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketsContextProvider>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route exact path="/login" component={Login} />
              <Route exact path="/signup" component={Signup} />
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
                  <Route
                    exact
                    path="/kanban"
                    component={KanbanPage}
                    isPrivate
                  />
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
                  <Route
                    exact
                    path="/contacts"
                    component={Contacts}
                    isPrivate
                  />
                  <Route exact path="/helps" component={Helps} isPrivate />
                  <Route exact path="/profile" component={Profile} isPrivate />
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
                </LoggedInLayout>
              </WhatsAppsProvider>
            </Switch>
          </Suspense>
          <AppToaster />
        </TicketsContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
