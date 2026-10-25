import { MOCK_DATA } from "@/lib/mock/data";
import type { App } from "@/lib/mock/types";

export function getMockApp(appId: string): App | undefined {
  return MOCK_DATA.apps.find((item) => item.id === appId);
}
