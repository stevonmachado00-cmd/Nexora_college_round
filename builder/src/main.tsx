import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ErrorBoundary } from "./components/UI";
import "./components/website/website.css";
import "./builder.css";
import "../../dist/design-system.css";
import "./builder-system.css";
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
