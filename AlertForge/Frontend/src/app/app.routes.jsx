import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import WarRoom from "@/pages/WarRoom";

export const routes = createBrowserRouter([

  {
    path: "/war-room",
    element: <WarRoom />,
  },
  {
    path: "/",
    element: <Landing />,
  },
]);
