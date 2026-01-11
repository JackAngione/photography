export const SWR_fetcher = (url: string | URL | Request) =>
  fetch(url).then((r) => r.json());
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;
