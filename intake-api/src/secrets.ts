/**
 * Secrets loader (Anbaric secret store).
 *
 * Secret names used by this API:
 *   hubspot_token       HubSpot private app token
 *   anthropic_api_key   Anthropic API key (photo triage)
 *
 * Set them on the platform (value is prompted for, never passed on the command line):
 *   anbaric secrets set hubspot_token
 *   anbaric secrets set anthropic_api_key
 *
 * Locally there is no platform store, so a secret that was never written falls
 * back to the environment under its upper-cased name: HUBSPOT_TOKEN and
 * ANTHROPIC_API_KEY from .env (loaded by `tsx --env-file=.env`). On the platform
 * there is NO env fallback.
 */
import { Code, SecretStoreFactory } from "anbaric";

export type SecretName = "hubspot_token" | "anthropic_api_key";

const LOG_INTERVAL_MS = 5 * 60 * 1000;

const actor = new Code("intake-api");
const cache = new Map<SecretName, string>();
const lastLoggedAt = new Map<SecretName, number>();

/**
 * Returns the secret value, or undefined when it is unavailable (callers keep
 * their existing "key missing" behavior). Successes are cached for the process
 * lifetime; failures are not cached, so the next call retries. Only the secret
 * NAME is ever logged, at most once per 5 minutes per name.
 */
export async function getSecret(name: SecretName): Promise<string | undefined> {
  const cached = cache.get(name);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const value = await SecretStoreFactory.instance().retrieve(name, actor);
    if (!value) {
      return undefined;
    }
    cache.set(name, value);
    return value;
  } catch {
    // Error text is deliberately not logged: it comes from the platform and is
    // not guaranteed to be free of sensitive detail.
    const now = Date.now();
    if (now - (lastLoggedAt.get(name) ?? -Infinity) >= LOG_INTERVAL_MS) {
      lastLoggedAt.set(name, now);
      console.error(`secret "${name}" unavailable`);
    }
    return undefined;
  }
}
