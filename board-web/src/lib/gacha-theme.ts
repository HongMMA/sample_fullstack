import type { GachaCard } from "@/lib/types";

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

export function resolveGachaImageUrl(card: Pick<GachaCard, "themeCode" | "artKey" | "imageUrl">) {
  if (card.imageUrl) {
    return card.imageUrl;
  }
  const adapter = GACHA_THEME_ADAPTERS[card.themeCode];
  if (!adapter) {
    return null;
  }
  return adapter.resolveImageUrl(card.artKey);
}

export function getGachaThemeLabel(themeCode: string | null | undefined, fallback?: string) {
  if (!themeCode) {
    return fallback ?? "카드 테마";
  }
  return GACHA_THEME_ADAPTERS[themeCode]?.displayName ?? fallback ?? themeCode;
}
