import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./presentation/App";
import { AuthGate } from "./presentation/components/AuthGate";
import "./presentation/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </React.StrictMode>,
);
