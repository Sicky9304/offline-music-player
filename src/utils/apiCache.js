/**
 * apiCache.js — Universal in-memory TTL cache for all API calls.
 *
 * Survives React re-mounts (module-level singleton) so the same
 * network request is NEVER repeated within the TTL window.
 *
 * Usage:
 *   import { apiCache } from './apiCache';
 *
 *   const data = await apiCache.get('my-key', () => fetchSomething(), 30);
 *   //  ^^ returns cached value if fresh, otherwise calls fetchSomething()
 *   //     and caches the result for 30 minutes.
 *
 *   apiCache.invalidate('my-key');        // force-clear one key
 *   apiCache.invalidatePrefix('lyrics:'); // clear all lyrics entries
 *   apiCache.clear();                     // wipe everything
 */

const DEFAULT_TTL_MINUTES = 30;

class ApiCache {
  constructor() {
    this._store = new Map(); // key → { data, expiresAt }
  }

  /** Build a safe, consistent cache key from a template string + args. */
  key(...parts) {
    return parts.join('::');
  }

  /** Check whether a cached entry exists and is still fresh. */
  has(key) {
    const entry = this._store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return false;
    }
    return true;
  }

  /** Return the raw cached value (or undefined if missing/stale). */
  peek(key) {
    if (!this.has(key)) return undefined;
    return this._store.get(key).data;
  }

  /**
   * Get a value from cache — or fetch it, cache it, and return it.
   *
   * @param {string}   key        - Unique cache key.
   * @param {Function} fetcher    - Async function that returns the data.
   * @param {number}   ttlMinutes - How many minutes to cache (default 30).
   */
  async get(key, fetcher, ttlMinutes = DEFAULT_TTL_MINUTES) {
    if (this.has(key)) {
      console.log(`[Cache HIT] ${key}`);
      return this._store.get(key).data;
    }

    console.log(`[Cache MISS] ${key} — fetching…`);
    const data = await fetcher();
    this.set(key, data, ttlMinutes);
    return data;
  }

  /** Manually store a value. */
  set(key, data, ttlMinutes = DEFAULT_TTL_MINUTES) {
    this._store.set(key, {
      data,
      expiresAt: Date.now() + ttlMinutes * 60 * 1000,
    });
  }

  /** Remove a single key. */
  invalidate(key) {
    this._store.delete(key);
  }

  /** Remove every key that starts with a given prefix. */
  invalidatePrefix(prefix) {
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) this._store.delete(key);
    }
  }

  /** Wipe the entire cache. */
  clear() {
    this._store.clear();
  }
}

// Singleton — shared across the entire React app
export const apiCache = new ApiCache();
