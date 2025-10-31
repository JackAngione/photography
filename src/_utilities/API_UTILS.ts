export const SWR_fetcher = (url: string | URL | Request) =>
  fetch(url).then((r) => r.json());
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
