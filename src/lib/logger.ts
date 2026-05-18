const LOG_PREFIX = '[tab-coach]';

type ViteEnvLike = { DEV?: unknown; MODE?: unknown };
type ProcessLike = { env?: Record<string, string | undefined> };

function isDevelopment(): boolean {
  try {
    const meta = import.meta as unknown as { env?: ViteEnvLike };
    const env = meta.env;
    if (env) {
      if (typeof env.DEV === 'boolean') return env.DEV;
      if (typeof env.MODE === 'string') return env.MODE === 'development';
    }
  } catch {
    // import.meta not available
  }
  try {
    const proc = (globalThis as unknown as { process?: ProcessLike }).process;
    const nodeEnv = proc?.env?.['NODE_ENV'];
    if (typeof nodeEnv === 'string') return nodeEnv === 'development';
  } catch {
    // process not available
  }
  return false;
}

const DEV = isDevelopment();

/* eslint-disable no-console */
export const logger = {
  debug: (...args: unknown[]): void => {
    if (DEV) console.debug(LOG_PREFIX, ...args);
  },
  log: (...args: unknown[]): void => {
    if (DEV) console.log(LOG_PREFIX, ...args);
  },
  info: (...args: unknown[]): void => {
    if (DEV) console.info(LOG_PREFIX, ...args);
  },
  warn: (...args: unknown[]): void => {
    if (DEV) console.warn(LOG_PREFIX, ...args);
  },
  error: (...args: unknown[]): void => {
    if (DEV) console.error(LOG_PREFIX, ...args);
  },
  isDevelopment: (): boolean => DEV,
} as const;
/* eslint-enable no-console */

export type Logger = typeof logger;
