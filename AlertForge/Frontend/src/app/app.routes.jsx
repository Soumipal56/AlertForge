import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import WarRoom from "@/pages/WarRoom";
import WarRoomChat from "@/pages/WarRoomChat";
import LoginPage from "@/features/pages/auth/Login";
import RegisterPage from "@/features/pages/auth/Register";
import { AuthenticateWithRedirectCallback } from "@clerk/react";
import DashboardLayout from "@/features/pages/dashboard/Dashboard";
import RegisterTest from "@/pages/RegisterTest";
import LoginTest from "@/pages/LoginTest";
import DashboardTest from "@/pages/DashboardTest";

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
    element: <DashboardTest />,
  },
  {
    path: "/sso-callback",
    element: <AuthenticateWithRedirectCallback />,
  },
  {
    path: "/create-incident",
    element: <WarRoom />,
  },
  {
    path: "/war-room-chat",
    element: <WarRoomChat />,
  },
  {
    path: "/warroom/:incidentId",
    element: <WarRoomChat />,
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
    element: <DashboardLayout />,
  }
]);
