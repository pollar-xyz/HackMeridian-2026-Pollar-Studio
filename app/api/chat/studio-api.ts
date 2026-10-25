import "server-only";

import { studioProjectSchema, queuedJobSchema, studioJobSchema } from "./schemas/studio-api";
import { initialProjectName } from "./project-name";

export class StudioApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function createStudioApi(authorization: string, signal: AbortSignal) {
  const baseURL = new URL(process.env.STUDIO_API_BASE_URL ?? "https://api-studio.pollar.studio");
  if (!["http:", "https:"].includes(baseURL.protocol)) throw new Error("Invalid STUDIO_API_BASE_URL");

  async function request(path: string, init?: RequestInit) {
    const response = await fetch(new URL(`/api/v1/${path}`, baseURL), {
      ...init, signal, cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers, Authorization: authorization },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new StudioApiError(response.status, data?.error?.code ?? "UPSTREAM_ERROR", data?.error?.message ?? "Studio API request failed");
    }
    return response;
  }

  return {
    async createProject(prompt: string) {
      return studioProjectSchema.parse(await (await request("projects", {
        method: "POST", body: JSON.stringify({ displayName: initialProjectName(prompt), description: prompt }),
      })).json());
    },
    async getProject(id: string) {
      return studioProjectSchema.parse(await (await request(`projects/${encodeURIComponent(id)}`)).json());
    },
    async renameProject(id: string, revision: number, displayName: string) {
      return studioProjectSchema.parse(await (await request(`projects/${encodeURIComponent(id)}`, {
        method: "PATCH", headers: { "If-Match": `rev-${revision}` }, body: JSON.stringify({ displayName }),
      })).json());
    },
    async queueGeneration(id: string, prompt: string) {
      return queuedJobSchema.parse(await (await request(`projects/${encodeURIComponent(id)}/generations`, {
        method: "POST", body: JSON.stringify({ prompt }),
      })).json());
    },
    async getJob(id: string) {
      return studioJobSchema.parse(await (await request(`jobs/${encodeURIComponent(id)}`)).json());
    },
    async getLogs(id: string) {
      return (await request(`jobs/${encodeURIComponent(id)}/logs`, { headers: { Accept: "text/plain" } })).text();
    },
  };
}
