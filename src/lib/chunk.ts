const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let bust = 0;

/**
 * Chrome keeps a failed module fetch in its module map: calling the same import() again never refetches, so one
 * dropped request (flaky venue Wi-Fi) would leave a panel loading forever. A retry therefore re-imports the chunk under
 * a fresh URL taken from the error message (the service worker and static hosts ignore the query). When a shared
 * dependency failed instead, or the browser does not name the URL, the error is thrown for the caller to show.
 */
export async function importWithRetry<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load();
  } catch (e) {
    const url = /https?:\/\/\S+?\.js\b/.exec(String((e as Error)?.message ?? ''))?.[0];
    if (!url) throw e;
    for (let i = 1; i <= 3; i++) {
      await wait(400 * i);
      try {
        return (await import(/* @vite-ignore */ `${url}?retry=${++bust}`)) as T;
      } catch { /* next attempt */ }
    }
    throw e;
  }
}
