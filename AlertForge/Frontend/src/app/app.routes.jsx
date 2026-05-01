import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import WarRoom from "@/pages/WarRoom";
import LoginPage from "@/features/pages/auth/Login";
import RegisterPage from "@/features/pages/auth/Register";

export const routes = createBrowserRouter([

  {
    path: "/war-room",
    element: <WarRoom />,
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
