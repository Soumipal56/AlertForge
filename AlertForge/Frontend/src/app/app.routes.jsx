import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import WarRoom from "@/pages/WarRoom";
import WarRoomChat from "@/pages/WarRoomChat";
import LoginPage from "@/features/pages/auth/Login";
import RegisterPage from "@/features/pages/auth/Register";
import { AuthenticateWithRedirectCallback } from "@clerk/react";

export const routes = createBrowserRouter([
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
]);
