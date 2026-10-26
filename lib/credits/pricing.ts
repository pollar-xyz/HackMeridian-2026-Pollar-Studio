/** Every account starts on the Free plan with these credits, a gift from the event. */
export const STARTING_CREDITS = 500;
/** New apps a Free account may create; messages to an existing app do not count. */
export const NEW_APP_LIMIT = 5;

/** Credits per million tokens. A typical build reads ~50k tokens and writes ~10k: about 18 credits. */
interface ModelPrice { input: number; output: number }
const DEFAULT_PRICE: ModelPrice = { input: 200, output: 800 };
const PRICES: Record<string, ModelPrice> = {
  "gpt-oss:20b": { input: 50, output: 200 },
};

export interface Tokens { inputTokens: number; outputTokens: number; reasoningTokens?: number }

/** Reasoning tokens are billed as output, as providers do. Rounded up so any work costs at least one credit. */
export function creditsFor(byModel: Record<string, Tokens>): number {
  const micro = Object.entries(byModel).reduce((sum, [model, tokens]) => {
    const price = PRICES[model] ?? DEFAULT_PRICE;
    return sum + tokens.inputTokens * price.input + (tokens.outputTokens + (tokens.reasoningTokens ?? 0)) * price.output;
  }, 0);
  return Math.ceil(micro / 1_000_000);
}
