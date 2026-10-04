/**
 * Brew Helper — Search Provider (M5). The swappable web-search backend.
 * The engine ships with a Mock provider (returns injected fixtures or nothing) so it NEVER
 * fabricates web content. A real provider (web-search API) implements the same interface later.
 */
export interface RawDoc { url: string; domain: string; title: string; text: string; }

export interface SearchProvider {
  search(query: string): Promise<RawDoc[]>;
}

/** Returns injected fixtures (optionally filtered by query terms). Default: nothing. */
export class MockSearchProvider implements SearchProvider {
  constructor(private fixtures: RawDoc[] = []) {}
  async search(query: string): Promise<RawDoc[]> {
    if (!this.fixtures.length) return [];
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return this.fixtures.filter((d) => {
      const hay = (d.title + ' ' + d.text).toLowerCase();
      return terms.some((t) => hay.includes(t));
    });
  }
}

/** Official Google Programmable Search adapter. It is optional because Google has
 * closed this API to new customers; never scrape google.com as a substitute. */
export class GoogleProgrammableSearchProvider implements SearchProvider {
  constructor(private apiKey: string, private engineId: string, private site = 'www.coffeedb.pro') {}
  async search(query: string): Promise<RawDoc[]> {
    if (!this.apiKey || !this.engineId) return [];
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('cx', this.engineId);
    url.searchParams.set('q', query);
    url.searchParams.set('siteSearch', this.site);
    url.searchParams.set('num', '5');
    const response = await fetch(url);
    if (!response.ok) return [];
    const body = await response.json() as { items?: { link?: string; title?: string; snippet?: string }[] };
    return (body.items ?? []).flatMap((item) => {
      if (!item.link) return [];
      try { return [{ url: item.link, domain: new URL(item.link).hostname, title: item.title ?? '', text: item.snippet ?? '' }]; } catch { return []; }
    });
  }
}
