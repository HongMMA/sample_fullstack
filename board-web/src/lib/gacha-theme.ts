import type { GachaCard } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type GachaThemeAdapter = {
  themeCode: string;
  displayName: string;
  resolveImageUrl: (artKey: string) => string | null;
};

const POKEMON_ART_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork";

/**
 * Frontend theme adapters.
 * Add a new adapter here when introducing another character universe.
 */
export const GACHA_THEME_ADAPTERS: Record<string, GachaThemeAdapter> = {
  "pokemon-gen1": {
    themeCode: "pokemon-gen1",
    displayName: "포켓몬 오리지널 151",
    resolveImageUrl: (artKey) => (artKey ? `${POKEMON_ART_BASE}/${artKey}.png` : null),
  },
  dkt: {
    themeCode: "dkt",
    displayName: "DKT",
    resolveImageUrl: (artKey) => (artKey ? `/gacha/dkt/${artKey}.png` : null),
  },
};

function withApiOrigin(url: string) {
  // Uploaded media must go through same-origin Next proxy.
  // Direct ngrok <img> requests get an HTML interstitial (broken image).
  const mediaMatch = url.match(/^\/api\/gacha\/media\/([^/]+)\/([^/?#]+)$/);
  if (mediaMatch) {
    return `/api/gacha-media/${mediaMatch[1]}/${mediaMatch[2]}`;
  }
  if (url.startsWith("/api/")) {
    return `${API_URL}${url}`;
  }
  return url;
}

export function resolveGachaImageUrl(card: Pick<GachaCard, "themeCode" | "artKey" | "imageUrl">) {
  if (card.imageUrl) {
    return withApiOrigin(card.imageUrl);
  }
  const adapter = GACHA_THEME_ADAPTERS[card.themeCode];
  if (!adapter) {
    return null;
  }
  const resolved = adapter.resolveImageUrl(card.artKey);
  return resolved ? withApiOrigin(resolved) : null;
}

export function resolveGachaMediaUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) {
    return null;
  }
  return withApiOrigin(imageUrl);
}

export function getGachaThemeLabel(themeCode: string | null | undefined, fallback?: string) {
  if (!themeCode) {
    return fallback ?? "카드 테마";
  }
  return GACHA_THEME_ADAPTERS[themeCode]?.displayName ?? fallback ?? themeCode;
}
