import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";
import WarRoom from "@/pages/WarRoom";
import WarRoomChat from "@/pages/WarRoomChat";

export const routes = createBrowserRouter([

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
]);
