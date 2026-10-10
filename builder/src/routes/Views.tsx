import { useEffect, useState } from "react";
import type { WebsiteProject } from "../../shared/project";
import { validateDocument, type WebsiteDocument } from "../../shared/schema";
import { projectStorage, request } from "../lib/api";
import { WebsiteRenderer } from "../components/WebsiteRenderer";
import { Loading, ErrorPage, message } from "../components/UI";
export function Preview({ id }: { id: string }) {
  const [project, setProject] = useState<WebsiteProject | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    projectStorage
      .get(id)
      .then((p) => {
        setProject(p);
        document.title = `${p.name} · Preview`;
      })
      .catch((e) => setError(message(e)));
  }, [id]);
  return error ? (
    <ErrorPage text={error} />
  ) : project ? (
    project.document.data.content.length ? (
      <WebsiteRenderer document={project.document} />
    ) : (
      <ErrorPage text="This draft has no sections yet. Add a section in the builder to create a preview." />
    )
  ) : (
    <Loading />
  );
}
export function Site({ slug }: { slug: string }) {
  const [site, setSite] = useState<{
      name: string;
      document: WebsiteDocument;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    request<{ name: string; document: WebsiteDocument }>(
      `/sites/${encodeURIComponent(slug)}`,
    )
      .then((s) => {
        setSite({ ...s, document: validateDocument(s.document) });
        document.title = s.name;
      })
      .catch((e) => setError(message(e)));
  }, [slug]);
  return error ? (
    <ErrorPage text={error} />
  ) : site ? (
    <WebsiteRenderer document={site.document} />
  ) : (
    <Loading />
  );
}
