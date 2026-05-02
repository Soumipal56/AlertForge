import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
// import WarRoom from "@/pages/WarRoom";
import WarRoomChat from "@/pages/WarRoomChat";
import LoginPage from "@/features/pages/auth/Login";
import RegisterPage from "@/features/pages/auth/Register";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
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
import RegisterTest from "@/pages/RegisterTest";
import LoginTest from "@/pages/LoginTest";
import DashboardTest from "@/pages/DashboardTest";

import ProtectedRoute from "@/components/ProtectedRoute";

export const routes = createBrowserRouter([
  {
    path: "/test-register",
    element: <RegisterTest />,
  },
  {
    path: "/test-login",
    element: <LoginTest />,
  },
  {
    path: "/test-dashboard",
    element: (
      <ProtectedRoute>
        <DashboardTest />
      </ProtectedRoute>
    ),
  },
  {
    path: "/sso-callback",
    element: <AuthenticateWithRedirectCallback />,
  },
  // {
  //   path: "/create-incident",
  //   element: <WarRoom />,
  // },
  {
    path: "/war-room-chat",
    element: (
      <ProtectedRoute>
        <WarRoomChat />
      </ProtectedRoute>
    ),
  },
  {
    path: "/warroom/:incidentId",
    element: (
      <ProtectedRoute>
        <WarRoomChat />
      </ProtectedRoute>
    ),
  },
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

      {
        index: true,
        element: <Overview />,
      },
      { path: "incidents", element: <Incidents /> },
      { path: "incidents/:incidentId", element: <IncidentDetail /> },
      {
        path: "war-room/:incidentId",
        element: <WarRoom />,
      },
      {
        path: "war-room",
        element: <WarRoom />,
      },
      {
        path: "incidents/:incidentId/postmortem",
        element: <Postmortem />,
      },
      {
        path: "postmortem",
        element: <Postmortem />,
      },
      {
        path: "services",
        element: <Services />,
      },
      {
        path: "integrations",
        element: <Integrations />,
      },
      {
        path: "status",
        element: <StatusPage />,
      },
      {
        path: "team",
        element: <Team />,
      },
    ],
  },
]);
