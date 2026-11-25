/**
 * MegaBachatMart — High-Performance Zero-Dependency Redis Client
 * Native fetch-based client for Upstash Redis (AWS ap-south-1).
 * Works seamlessly in Next.js Server Actions, Route Handlers, Edge, and multi-process environments.
 */

function getRedisConfig() {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    try {
      require('dotenv').config();
    } catch {}
  }
  return {
    url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, ''),
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export const isRedisConfigured = (): boolean => {
  const { url, token } = getRedisConfig();
  return Boolean(url && token);
};

export async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  const { url: REDIS_URL, token: REDIS_TOKEN } = getRedisConfig();
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null;
  }

  try {
    const url = `${REDIS_URL}/${[command, ...args].map((a) => encodeURIComponent(String(a))).join('/')}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`Redis [${command}] returned HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.result;
  } catch (err) {
    console.warn(`Redis [${command}] request failed:`, err);
    return null;
  }
}

export async function redisPostCommand(commands: (string | number)[][]): Promise<any> {
  const { url: REDIS_URL, token: REDIS_TOKEN } = getRedisConfig();
  if (!REDIS_URL || !REDIS_TOKEN) {
    return null;
  }

  try {
    const res = await fetch(`${REDIS_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Redis pipeline failed:', err);
    return null;
  }
}

export async function redisGet<T = any>(key: string): Promise<T | null> {
  const result = await redisCommand('get', key);
  if (!result) return null;
  try {
    return JSON.parse(result) as T;
  } catch {
    return result as unknown as T;
  }
}

export async function redisSet(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds && ttlSeconds > 0) {
    const res = await redisCommand('set', key, serialized, 'ex', ttlSeconds);
    return res === 'OK';
  }
  const res = await redisCommand('set', key, serialized);
  return res === 'OK';
}

export async function redisDel(key: string): Promise<boolean> {
  const res = await redisCommand('del', key);
  return Boolean(res);
}
