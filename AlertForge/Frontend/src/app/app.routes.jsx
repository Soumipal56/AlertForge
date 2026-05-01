import { createBrowserRouter } from "react-router";
import Landing from "@/features/landing/Landing";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
]);