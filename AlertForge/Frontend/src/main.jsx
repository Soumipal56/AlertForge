import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./app/App";
import { TooltipProvider } from "./components/ui/tooltip";
import { Provider } from "react-redux";
import { store } from "./app/app.store"; 

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>                  
      <TooltipProvider>
          <App />
      </TooltipProvider>
    </Provider>
  </StrictMode>,
);