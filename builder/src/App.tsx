import { lazy, Suspense, useEffect, useState } from "react";
import { request } from "./lib/api";
import { Loading, type Health } from "./components/UI";
import Hub from "./routes/Hub";
const LoadEditor = lazy(() => import("./routes/Editor"));
const Preview = lazy(() =>
  import("./routes/Views").then((module) => ({ default: module.Preview })),
);
const Site = lazy(() =>
  import("./routes/Views").then((module) => ({ default: module.Site })),
);
export function App() {
  const [health, setHealth] = useState<Health>({
    provider: "Checking provider…",
    demo: true,
  });
  useEffect(() => {
    request<Health>("/health")
      .then(setHealth)
      .catch(() => setHealth({ provider: "API unavailable", demo: true }));
  }, []);
  const path = location.pathname.split("/").filter(Boolean);
  return (
    <Suspense fallback={<Loading />}>
      {path[0] === "site" ? (
        <Site slug={path[1]} />
      ) : path[0] === "preview" ? (
        <Preview id={path[1]} />
      ) : path[1] ? (
        <LoadEditor id={path[1]} health={health} />
      ) : (
        <Hub health={health} />
      )}
    </Suspense>
  );
}
