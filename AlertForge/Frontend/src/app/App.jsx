import { routes } from "./app.routes";
import { RouterProvider } from "react-router";
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function App() {
  return (
    <div className="min-h-screen">
      <RouterProvider router={routes} />
    </div>
  );
}

export default App;
