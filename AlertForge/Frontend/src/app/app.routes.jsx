import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import LoginPage from "@/features/pages/auth/Login";
import RegisterPage from "@/features/pages/auth/Register";
import DashboardLayout from "@/features/pages/dashboard/DashboardLayout";
import Incidents from "@/features/pages/dashboard/Incidents";
import IncidentDetail from "@/features/pages/dashboard/IncidentDetail";
import WarRoom from "@/features/pages/dashboard/WarRoom";
import Postmortem from "@/features/pages/dashboard/Postmortem";
import StatusPage from "@/features/pages/dashboard/StatusPage";
import Team from "@/features/pages/dashboard/Team";
import Integrations from "@/features/pages/dashboard/Integrations";
import Services from "@/features/pages/dashboard/Services";
import { Overview } from "@/features/pages/dashboard/Overview";
import ProtectedRoute from "@/components/ProtectedRoute";

export const routes = createBrowserRouter([

  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: "incidents", element: <Incidents /> },
      { path: "incidents/:incidentId", element: <IncidentDetail /> },
      { path: "war-room/:incidentId", element: <WarRoom /> },
      { path: "war-room", element: <WarRoom /> },
      { path: "incidents/:incidentId/postmortem", element: <Postmortem /> },
      { path: "postmortem", element: <Postmortem /> },
      { path: "services", element: <Services /> },
      { path: "integrations", element: <Integrations /> },
      { path: "status", element: <StatusPage /> },
      { path: "team", element: <Team /> },
    ],
  },
]);
