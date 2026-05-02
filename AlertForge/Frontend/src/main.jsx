import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/ui/themes";
import { TooltipProvider } from "./components/ui/tooltip";

import { AuthProvider } from "./context/AuthContext";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TooltipProvider>
      <ClerkProvider
        publishableKey={PUBLISHABLE_KEY}
        appearance={{
          theme: dark,
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ClerkProvider>
    </TooltipProvider>
  </StrictMode>,
);

