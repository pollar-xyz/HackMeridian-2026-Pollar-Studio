import { creditsFor, NEW_APP_LIMIT, STARTING_CREDITS, type Tokens } from "@/lib/credits/pricing";

export interface UsageReport { projects: { projectId: string; title: string; usage: { byModel: Record<string, Tokens> } }[] }

export interface CreditsView {
  plan: "free";
  starting: number;
  spent: number;
  available: number;
  newApps: { used: number; limit: number };
  builds: number;
  apps: { appId: string; name: string; credits: number; builds: number }[];
}

/**
 * The account's generation credits, derived from the tokens the Studio API recorded for each of its
 * projects: nothing is stored here, so the balance is always what the API measured.
 */
export function creditsView(usage: UsageReport, builds: Record<string, number>): CreditsView {
  const apps = usage.projects
    .map((project) => ({ appId: project.projectId, name: project.title, credits: creditsFor(project.usage.byModel), builds: builds[project.projectId] ?? 0 }))
    .sort((a, b) => b.credits - a.credits);
  const spent = apps.reduce((sum, app) => sum + app.credits, 0);
  return {
    plan: "free",
    starting: STARTING_CREDITS,
    spent,
    available: STARTING_CREDITS - spent,
    newApps: { used: usage.projects.length, limit: NEW_APP_LIMIT },
    builds: Object.values(builds).reduce((sum, count) => sum + count, 0),
    apps,
  };
}

interface CreditsApi {
  getUsage(): Promise<UsageReport>;
  getChat(id: string): Promise<{ messages: { status: string; answered?: boolean }[] }>;
}

/** A build is a message that produced a version of the app; chat answers and failures do not count. */
export async function loadCredits(api: CreditsApi): Promise<CreditsView> {
  const usage = await api.getUsage();
  const chats = await Promise.all(usage.projects.map(async (project) => [project.projectId, (await api.getChat(project.projectId)).messages.filter((message) => message.status === "succeeded" && !message.answered).length] as const));
  return creditsView(usage, Object.fromEntries(chats));
}
