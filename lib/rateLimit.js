const store = new Map();

/**
 * Simple in-memory sliding-window rate limiter.
 * Returns true if the request is allowed, false if it should be blocked.
 *
 * @param {string} key      - Unique key (e.g. IP address + route)
 * @param {number} max      - Max requests allowed in the window
 * @param {number} windowMs - Window size in milliseconds
 */
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const cutoff = now - windowMs;

  const timestamps = (store.get(key) ?? []).filter(t => t > cutoff);

  if (timestamps.length >= max) {
    store.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}

export function getIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
