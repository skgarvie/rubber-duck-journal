// Hash router: works on static hosting (GitHub Pages) with no rewrite rules.

const DEFAULT_HASH = '#/today';

/**
 * @param {Array<{name: string, pattern: RegExp}>} routes
 * @param {(route: object, params: string[]) => Promise<void>|void} onChange
 */
export function createRouter(routes, onChange) {
  function resolve() {
    const hash = location.hash || DEFAULT_HASH;
    for (const route of routes) {
      const match = hash.match(route.pattern);
      if (match) return { route, params: match.slice(1) };
    }
    return null;
  }

  async function handle() {
    const resolved = resolve();
    if (!resolved) {
      location.replace(DEFAULT_HASH); // triggers hashchange → handle()
      return;
    }
    await onChange(resolved.route, resolved.params);
  }

  window.addEventListener('hashchange', handle);

  return {
    start: handle,
    refresh: handle,
    current: () => resolve()?.route.name ?? null,
  };
}
