// A combined Render deployment uses its own origin. Ignore a developer's
// localhost .env during production builds; separate services can set an HTTPS URL.
const configuredUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
const localUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configuredUrl);

export const API_BASE_URL = import.meta.env.PROD && localUrl
  ? ''
  : configuredUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');
