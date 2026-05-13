/** API prefix; empty string = same origin (production build served by FastAPI). */
export function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? "";
}

export type JobArtifacts = {
  server_png: boolean;
  server_svg: boolean;
};

export type JobStatusResponse = {
  status: string;
  job_id: string;
  artifacts?: JobArtifacts;
};

export async function uploadImage(file: File): Promise<{ job_id: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${apiBase()}/api/v1/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function startProcess(jobId: string): Promise<void> {
  const res = await fetch(`${apiBase()}/api/v1/process/${jobId}`, {
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Process failed (${res.status})`);
  }
}

export async function fetchStatus(jobId: string): Promise<JobStatusResponse> {
  const res = await fetch(`${apiBase()}/api/v1/status/${jobId}`);
  if (!res.ok) throw new Error(`Status failed (${res.status})`);
  return res.json();
}

export async function fetchMermaid(jobId: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/v1/results/${jobId}/mermaid`);
  if (!res.ok) throw new Error(`Mermaid fetch failed (${res.status})`);
  return res.text();
}

export function serverPngUrl(jobId: string): string {
  return `${apiBase()}/api/v1/results/${jobId}/png`;
}

export async function postReimagine(
  jobId: string,
  mermaid: string,
): Promise<{ mermaid: string; job_id: string }> {
  const res = await fetch(`${apiBase()}/api/v1/reimagine/${jobId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mermaid }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Reimagine failed (${res.status})`);
  }
  return res.json();
}
