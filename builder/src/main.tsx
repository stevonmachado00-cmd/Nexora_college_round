import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/UI";
import "./components/website/website.css";
import "./builder.css";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
