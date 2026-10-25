import "server-only";
import type { StudioTools } from "@/lib/schemas/studio-tools";

import { studioProjectSchema, queuedJobSchema, studioJobSchema, chatHistorySchema, projectListSchema } from "./schemas/studio-api";
import { readJobStream, type JobEvent } from "./job-stream";
import { studioDeploymentListSchema } from "@/lib/schemas/studio-deployment";

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
    async listProjects() {
      return projectListSchema.parse(await (await request("projects")).json());
    },
    async getChat(id: string) {
      return chatHistorySchema.parse(await (await request(`projects/${encodeURIComponent(id)}/chat`)).json());
    },
    async streamJob(id: string, emit: (event: JobEvent) => void) {
      await readJobStream(await request(`jobs/${encodeURIComponent(id)}/stream`, { headers: { Accept: "text/event-stream" } }), emit);
    },
    async createProject(prompt: string, tools?: StudioTools) {
      return studioProjectSchema.parse(await (await request("projects", {
        method: "POST", body: JSON.stringify({ description: prompt, tools }),
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
    async queueGeneration(id: string, prompt: string, tools?: StudioTools) {
      return queuedJobSchema.parse(await (await request(`projects/${encodeURIComponent(id)}/chat`, {
        method: "POST", body: JSON.stringify({ prompt, tools }),
      })).json());
    },
    async getJob(id: string) {
      return studioJobSchema.parse(await (await request(`jobs/${encodeURIComponent(id)}`)).json());
    },
    async getLogs(id: string) {
      return (await request(`jobs/${encodeURIComponent(id)}/logs`, { headers: { Accept: "text/plain" } })).text();
    },
    async listDeployments(id: string) {
      return studioDeploymentListSchema.parse(await (await request(`projects/${encodeURIComponent(id)}/jobs`)).json());
    },
  };
}
