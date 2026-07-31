"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getGachaProfile, getGachaRanking, getGachaTheme, getMemberGachaCharacterUploadSetting, pullGacha } from "@/lib/api";
import { getAccessToken, getLoginId, isSuperAdmin } from "@/lib/auth";
import { getGachaThemeLabel, resolveGachaImageUrl } from "@/lib/gacha-theme";
import { GachaCharacterUploadPanel } from "@/components/GachaCharacterUploadPanel";
import type {
  GachaCard,
  GachaProfile,
  GachaPullResult,
  GachaRankingEntry,
  GachaRarity,
  GachaTheme,
} from "@/lib/types";

const RARITY_ORDER: GachaRarity[] = ["GOAT", "LEGEND", "UNIQUE", "RARE", "MAGIC", "NORMAL"];

type PullPhase = "idle" | "spin" | "drop" | "burst" | "reveal";

const SPIN_CARD_COUNT = 8;
const MULTI_PULL_COUNT = 30;

const RARITY_STYLE: Record<
  GachaRarity,
  {
    label: string;
    frame: string;
    glow: string;
    badge: string;
    marble: string;
    burst: string;
    title: string;
  }
> = {
  NORMAL: {
    label: "일반",
    frame: "border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200",
    glow: "",
    badge: "bg-slate-500 text-white",
    marble: "bg-slate-300",
    burst: "from-slate-200/80 via-white/40 to-transparent",
    title: "text-slate-700",
  },
  MAGIC: {
    label: "매직",
    frame: "border-sky-400 bg-gradient-to-br from-sky-100 via-cyan-50 to-indigo-100",
    glow: "shadow-[0_0_18px_rgba(56,189,248,0.35)]",
    badge: "bg-sky-500 text-white",
    marble: "bg-gradient-to-br from-sky-300 to-indigo-400",
    burst: "from-sky-300/90 via-cyan-200/50 to-transparent",
    title: "text-sky-700",
  },
  RARE: {
    label: "레어",
    frame: "border-violet-400 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-purple-200",
    glow: "shadow-[0_0_22px_rgba(167,139,250,0.45)]",
    badge: "bg-violet-600 text-white",
    marble: "bg-gradient-to-br from-violet-400 to-fuchsia-500",
    burst: "from-violet-400/90 via-fuchsia-200/50 to-transparent",
    title: "text-violet-700",
  },
  UNIQUE: {
    label: "유니크",
    frame: "border-amber-400 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-200",
    glow: "shadow-[0_0_26px_rgba(251,191,36,0.5)] animate-[gacha-pulse_2.4s_ease-in-out_infinite]",
    badge: "bg-amber-500 text-ink",
    marble: "bg-gradient-to-br from-amber-300 to-orange-500",
    burst: "from-amber-300/95 via-orange-200/55 to-transparent",
    title: "text-amber-700",
  },
  LEGEND: {
    label: "레전드",
    frame: "border-rose-400 bg-[conic-gradient(from_120deg,#fff7ed,#fecdd3,#fef3c7,#ffe4e6)]",
    glow: "shadow-[0_0_34px_rgba(244,63,94,0.55)] animate-[gacha-shimmer_2s_linear_infinite]",
    badge: "bg-rose-600 text-white",
    marble: "bg-gradient-to-br from-rose-400 via-orange-300 to-amber-400",
    burst: "from-rose-400/95 via-amber-200/60 to-transparent",
    title: "text-rose-700",
  },
  GOAT: {
    label: "GOAT",
    frame:
      "border-yellow-300 bg-[radial-gradient(circle_at_30%_20%,#fffbeb,transparent_45%),linear-gradient(145deg,#111827,#92400e_45%,#fbbf24_80%,#111827)] text-amber-50",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.75)] animate-[gacha-orbit_3s_linear_infinite]",
    badge: "bg-black text-amber-300 ring-1 ring-amber-300",
    marble: "bg-gradient-to-br from-yellow-200 via-amber-400 to-yellow-600",
    burst: "from-yellow-300 via-amber-400/70 to-transparent",
    title: "text-amber-200",
  },
};

export function GachaGame() {
  const router = useRouter();
  const [profile, setProfile] = useState<GachaProfile | null>(null);
  const [ranking, setRanking] = useState<GachaRankingEntry[]>([]);
  const [theme, setTheme] = useState<GachaTheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PullPhase>("idle");
  const [lastPull, setLastPull] = useState<GachaPullResult | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<GachaRarity | "RANDOM">("RANDOM");
  const [isPending, startTransition] = useTransition();
  const [isAdmin, setIsAdmin] = useState(false);
  const [characterUploadEnabled, setCharacterUploadEnabled] = useState(false);

  const busy = phase !== "idle" || isPending;

  const spinCards = useMemo(() => {
    const rarities: GachaRarity[] = [
      "NORMAL",
      "MAGIC",
      "RARE",
      "UNIQUE",
      "LEGEND",
      "GOAT",
      "RARE",
      "MAGIC",
    ];
    return rarities.slice(0, SPIN_CARD_COUNT).map((rarity, index) => ({
      id: index,
      rarity,
      angle: (360 / SPIN_CARD_COUNT) * index,
    }));
  }, []);

  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: 8 + ((index * 17) % 84),
        delay: index * 0.05,
        duration: 0.7 + (index % 5) * 0.12,
        size: 8,
      })),
    []
  );

  const epicRayLayers = useMemo(() => {
    const buildLayer = (count: number, seed: number) => {
      const rays: {
        id: number;
        rotate: number;
        width: number;
        length: number;
        opacity: number;
      }[] = [];
      for (let i = 0; i < count; i += 1) {
        const base = (360 / count) * i;
        const jitter = ((i * 13 + seed * 3) % 9) - 4;
        rays.push({
          id: i,
          rotate: base + jitter,
          width: 1.5 + (i % 5) * 0.8,
          length: 48 + ((i + seed) % 8) * 3,
          opacity: 0.35 + ((i + seed) % 5) * 0.1,
        });
      }
      return rays;
    };

    return [
      { id: "outer", rays: buildLayer(48, 0), duration: "1.55s", reverse: false },
      { id: "inner", rays: buildLayer(32, 11), duration: "1.25s", reverse: true },
      { id: "core", rays: buildLayer(20, 23), duration: "1.8s", reverse: false },
    ];
  }, []);

  const epicShards = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: index,
        left: 4 + ((index * 13) % 92),
        delay: 0.05 + index * 0.03,
        duration: 0.9 + (index % 4) * 0.15,
        size: 4 + (index % 3) * 3,
      })),
    []
  );

  useEffect(() => {
    setIsAdmin(isSuperAdmin(getLoginId()));
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/gacha");
      return;
    }

    Promise.all([
      getGachaProfile(accessToken),
      getGachaRanking(accessToken),
      getGachaTheme(accessToken),
      getMemberGachaCharacterUploadSetting(),
    ])
      .then(([nextProfile, nextRanking, nextTheme, uploadSetting]) => {
        setProfile(nextProfile);
        setRanking(nextRanking);
        setTheme(nextTheme);
        setCharacterUploadEnabled(uploadSetting.enabled);
      })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          router.replace("/board");
          return;
        }
        setError("가챠 정보를 불러오지 못했습니다.");
      });
  }, [router]);

  function reload(accessToken: string) {
    return Promise.all([getGachaProfile(accessToken), getGachaRanking(accessToken)]).then(
      ([nextProfile, nextRanking]) => {
        setProfile(nextProfile);
        setRanking(nextRanking);
      }
    );
  }

  function onPull(count = 1) {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/gacha");
      return;
    }
    if (!profile || profile.points < count || busy) {
      return;
    }

    setError(null);
    setLastPull(null);
    setPhase("spin");

    startTransition(async () => {
      try {
        await wait(1300);
        const result = await pullGacha(accessToken, {
          rarity: count === 1 && selectedRarity !== "RANDOM" ? selectedRarity : null,
          count,
        });
        setLastPull(result);
        setPhase("drop");
        await wait(850);
        setPhase("burst");
        const rarity = result.highlightCard.rarity;
        await wait(rarity === "GOAT" ? 1500 : rarity === "LEGEND" ? 1250 : 800);
        setPhase("reveal");
        await reload(accessToken);
      } catch (err) {
        setPhase("idle");
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("뽑기에 실패했습니다.");
        }
      }
    });
  }

  function closeReveal() {
    setPhase("idle");
    setLastPull(null);
  }

  if (!profile) {
    return <p className="text-sm text-muted">가챠 금고를 여는 중...</p>;
  }

  const highlight = lastPull?.highlightCard ?? null;
  const revealStyle = highlight ? RARITY_STYLE[highlight.rarity] : null;
  const isEpicReveal = highlight?.rarity === "LEGEND" || highlight?.rarity === "GOAT";
  const isGoatReveal = highlight?.rarity === "GOAT";
  const isLegendReveal = highlight?.rarity === "LEGEND";
  const isMultiPull = (lastPull?.pullCount ?? 0) > 1;
  const highlightDuplicate =
    lastPull?.results.find((item) => item.card.id === highlight?.id)?.duplicate ?? false;

  return (
    <div className="space-y-10">
      <GachaCharacterUploadPanel enabled={characterUploadEnabled} />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.16em] text-muted uppercase">Capsule Vault</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">카드 뽑기</h2>
              <p className="mt-2 text-sm text-muted">
                1회 뽑기 = 1포인트 · 현재 테마:{" "}
                {theme?.displayName ?? getGachaThemeLabel(profile.cards[0]?.themeCode, "카드")}
              </p>
            </div>
            <div className="rounded-full border border-line bg-white px-5 py-2 text-sm font-medium text-ink">
              보유 포인트 <span className="text-accent">{profile.points}</span>
            </div>
          </div>

          {isAdmin && (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-white/60 p-4">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Admin 등급 지정 뽑기</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setSelectedRarity("RANDOM")}
                className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                  selectedRarity === "RANDOM"
                    ? "border-accent bg-accent text-white"
                    : "border-line bg-white text-ink hover:bg-accent-soft/50"
                }`}
              >
                랜덤
              </button>
              {[...RARITY_ORDER].reverse().map((rarity) => (
                <button
                  key={rarity}
                  type="button"
                  disabled={busy}
                  onClick={() => setSelectedRarity(rarity)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${
                    selectedRarity === rarity
                      ? "border-accent bg-accent text-white"
                      : "border-line bg-white text-ink hover:bg-accent-soft/50"
                  }`}
                >
                  {RARITY_STYLE[rarity].label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              선택: {selectedRarity === "RANDOM" ? "확률 기반 랜덤" : RARITY_STYLE[selectedRarity].label}
            </p>
          </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-6">
            <div
              className={`relative h-80 w-80 overflow-hidden rounded-[2.2rem] border-4 border-ink/80 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,#243044,#0b1220)] shadow-[inset_0_0_50px_rgba(255,255,255,0.08),0_20px_50px_rgba(15,23,42,0.35)] ${
                phase === "spin" ? "animate-[gacha-pulse_0.7s_ease-in-out_infinite]" : ""
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.12),transparent_40%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[conic-gradient(from_90deg,transparent,rgba(255,255,255,0.05),transparent_40%)] opacity-70" />

              <div className="absolute inset-0 flex items-center justify-center [perspective:980px]">
                <div
                  className={`relative h-40 w-28 [transform-style:preserve-3d] ${
                    phase === "spin"
                      ? "animate-[gacha-wheel-spin_0.48s_linear_infinite]"
                      : phase === "drop"
                        ? "animate-[gacha-wheel-collapse_0.8s_ease-in_forwards]"
                        : phase === "burst" || phase === "reveal"
                          ? "opacity-0"
                          : "animate-[gacha-wheel-idle_7s_linear_infinite]"
                  }`}
                >
                  {spinCards.map((card) => {
                    const style = RARITY_STYLE[card.rarity];
                    return (
                      <div
                        key={card.id}
                        className={`absolute inset-0 overflow-hidden rounded-[1.1rem] border-2 shadow-[0_10px_28px_rgba(0,0,0,0.35)] ${style.frame}`}
                        style={{
                          transform: `rotateY(${card.angle}deg) translateZ(118px)`,
                        }}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.35),transparent_42%,rgba(0,0,0,0.12))]" />
                        <div className="absolute inset-x-3 top-3 flex justify-between">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${style.badge}`}>
                            {style.label}
                          </span>
                          <span className="text-[9px] text-ink/50">?</span>
                        </div>
                        <div className="absolute inset-x-5 top-[38%] h-12 rounded-lg border border-white/40 bg-white/25" />
                        <div className="absolute inset-x-6 bottom-4 h-2 rounded-full bg-ink/15" />
                        <div className="absolute inset-x-8 bottom-8 h-2 rounded-full bg-ink/10" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {(phase === "drop" || phase === "burst") && highlight && (
                <div className="absolute inset-0 flex items-center justify-center [perspective:900px]">
                  <div
                    className={`h-44 w-32 overflow-hidden rounded-[1.2rem] border-2 ${
                      RARITY_STYLE[highlight.rarity].frame
                    } ${RARITY_STYLE[highlight.rarity].glow} animate-[gacha-card-settle_0.85s_cubic-bezier(0.2,0.85,0.2,1)_forwards]`}
                  >
                    <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.45),transparent_55%)]">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          RARITY_STYLE[highlight.rarity].badge
                        }`}
                      >
                        {RARITY_STYLE[highlight.rarity].label}
                      </span>
                      <div
                        className={`mt-5 h-16 w-16 rounded-full border border-white/50 ${
                          RARITY_STYLE[highlight.rarity].marble
                        } animate-[gacha-card-flipglow_0.85s_ease-in-out_infinite]`}
                      />
                      <p className="mt-4 text-xs text-ink/60">
                        {isMultiPull ? `${MULTI_PULL_COUNT}장 결정 중...` : "결정 중..."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] tracking-wide text-white/70 backdrop-blur">
                {phase === "idle" ? "READY" : phase === "spin" ? "SPINNING" : "LOCKING"}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onPull(1)}
                disabled={busy || profile.points < 1}
                className="relative overflow-hidden rounded-full bg-accent px-8 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
              >
                <span className="relative z-10">
                  {busy
                    ? phaseLabel(phase)
                    : profile.points < 1
                      ? "포인트 부족"
                      : selectedRarity === "RANDOM" || !isAdmin
                        ? "1장 뽑기"
                        : `${RARITY_STYLE[selectedRarity].label} 뽑기`}
                </span>
                {busy && (
                  <span className="absolute inset-0 animate-[gacha-button-shine_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onPull(MULTI_PULL_COUNT)}
                disabled={busy || profile.points < MULTI_PULL_COUNT}
                className="relative overflow-hidden rounded-full border border-accent bg-white px-8 py-3 text-sm font-medium text-accent transition hover:bg-accent-soft disabled:opacity-50"
              >
                {busy
                  ? "뽑는 중..."
                  : profile.points < MULTI_PULL_COUNT
                    ? `30장 (${MULTI_PULL_COUNT}P 필요)`
                    : "30장 한번에 열기"}
              </button>
            </div>

            {error && (
              <div className="w-full rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-ink">랭킹 TOP 10</h2>
          <p className="mt-2 text-sm text-muted">GOAT 1장 &gt; 레전드 여러 장 (메달 시스템)</p>
          <ul className="mt-6 space-y-3">
            {ranking.length === 0 ? (
              <li className="text-sm text-muted">아직 랭킹 데이터가 없습니다. 첫 뽑기를 해보세요.</li>
            ) : (
              ranking.map((entry) => (
                <li key={entry.loginId} className="rounded-2xl border border-line bg-white/70 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">
                      #{entry.rank} {entry.loginId}
                    </p>
                    <p className="text-xs text-muted">총 {entry.totalCards}장</p>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {RARITY_ORDER.map((rarity) => `${RARITY_STYLE[rarity].label} ${entry.rarityCounts[rarity] ?? 0}`).join(
                      " · "
                    )}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-ink">내 카드 목록</h2>
            <p className="mt-2 text-sm text-muted">
              {profile.cards.length === 0
                ? "아직 카드가 없습니다. 뽑기로 컬렉션을 시작하세요."
                : `${profile.cards.length}종 · ${theme?.displayName ?? "현재 테마"}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            {RARITY_ORDER.map((rarity) => (
              <span key={rarity} className="rounded-full border border-line bg-white px-3 py-1">
                {RARITY_STYLE[rarity].label} {profile.rarityCounts[rarity] ?? 0}
              </span>
            ))}
          </div>
        </div>

        {profile.cards.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {profile.cards.map((card) => (
              <GachaCardView key={card.id} card={card} />
            ))}
          </div>
        )}
      </section>

      {(phase === "burst" || phase === "reveal") && lastPull && highlight && revealStyle && (
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 py-8 ${
            isEpicReveal && phase === "burst"
              ? isGoatReveal
                ? "animate-[gacha-screen-shake_0.55s_ease-in-out]"
                : "animate-[gacha-screen-shake-soft_0.45s_ease-in-out]"
              : ""
          }`}
        >
          <button
            type="button"
            aria-label="닫기"
            className={`fixed inset-0 backdrop-blur-sm ${
              isGoatReveal
                ? "bg-slate-950/85"
                : isLegendReveal
                  ? "bg-rose-950/80"
                  : "bg-slate-950/75"
            }`}
            onClick={phase === "reveal" ? closeReveal : undefined}
          />

          {isEpicReveal && (
            <div
              className={`pointer-events-none fixed inset-0 ${
                phase === "burst"
                  ? isGoatReveal
                    ? "animate-[gacha-flash-gold_0.7s_ease-out_forwards]"
                    : "animate-[gacha-flash-rose_0.55s_ease-out_forwards]"
                  : "opacity-0"
              }`}
            />
          )}

          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div
              className={`absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${revealStyle.burst} ${
                phase === "burst"
                  ? isEpicReveal
                    ? "animate-[gacha-ring-epic_1.2s_ease-out_forwards]"
                    : "animate-[gacha-ring_0.9s_ease-out_forwards]"
                  : isEpicReveal
                    ? "opacity-50"
                    : "opacity-40"
              }`}
            />

            {isEpicReveal && (
              <div className="absolute inset-0 overflow-hidden">
                {epicRayLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`absolute inset-0 ${
                      phase === "burst"
                        ? layer.reverse
                          ? "animate-[gacha-ray-spin-reverse_1.35s_cubic-bezier(0.15,0.7,0.25,1)_forwards]"
                          : "animate-[gacha-ray-spin_1.55s_cubic-bezier(0.15,0.7,0.25,1)_forwards]"
                        : layer.reverse
                          ? "animate-[gacha-ray-drift-reverse_10s_linear_infinite] opacity-30"
                          : "animate-[gacha-ray-drift_12s_linear_infinite] opacity-35"
                    }`}
                    style={{
                      animationDuration: phase === "burst" ? layer.duration : undefined,
                    }}
                  >
                    {layer.rays.map((ray) => (
                      <span
                        key={`${layer.id}-${ray.id}`}
                        className={`absolute left-1/2 top-1/2 rounded-full ${
                          isGoatReveal
                            ? "bg-gradient-to-b from-white via-yellow-200 to-amber-400/0"
                            : "bg-gradient-to-b from-white via-orange-200 to-rose-500/0"
                        }`}
                        style={{
                          width: `${ray.width}px`,
                          height: `${ray.length}vmax`,
                          marginLeft: `${-ray.width / 2}px`,
                          opacity: ray.opacity,
                          transform: `rotate(${ray.rotate}deg)`,
                          transformOrigin: "top center",
                          boxShadow: isGoatReveal
                            ? "0 0 12px rgba(251, 191, 36, 0.55)"
                            : "0 0 12px rgba(251, 113, 133, 0.5)",
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {isEpicReveal && phase === "burst" && (
              <div
                className={`absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${
                  isGoatReveal
                    ? "bg-amber-300/70 animate-[gacha-core-pulse_1.2s_ease-out_forwards]"
                    : "bg-rose-300/60 animate-[gacha-core-pulse_1s_ease-out_forwards]"
                }`}
              />
            )}

            {(isEpicReveal ? epicShards : sparks).map((spark) => (
              <span
                key={spark.id}
                className={`absolute top-1/2 rounded-full ${revealStyle.marble} ${
                  phase === "burst"
                    ? isEpicReveal
                      ? "animate-[gacha-spark-epic_1.15s_ease-out_forwards]"
                      : "animate-[gacha-spark_0.9s_ease-out_forwards]"
                    : "opacity-0"
                }`}
                style={{
                  left: `${spark.left}%`,
                  width: spark.size,
                  height: spark.size,
                  animationDelay: `${spark.delay}s`,
                  animationDuration: `${spark.duration}s`,
                }}
              />
            ))}
          </div>

          <div
            className={`relative z-10 my-auto w-full rounded-[2rem] border p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
              isMultiPull ? "max-w-5xl" : "max-w-md"
            } ${
              isGoatReveal
                ? "border-amber-300/50 bg-gradient-to-b from-amber-950/90 via-slate-950/90 to-black/90"
                : isLegendReveal
                  ? "border-rose-300/40 bg-gradient-to-b from-rose-950/90 via-slate-950/90 to-black/90"
                  : "border-white/20 bg-slate-950/80"
            } ${
              phase === "reveal"
                ? isGoatReveal
                  ? "animate-[gacha-reveal-goat_0.9s_cubic-bezier(0.16,0.9,0.2,1)_forwards]"
                  : isLegendReveal
                    ? "animate-[gacha-reveal-legend_0.75s_cubic-bezier(0.16,0.9,0.2,1)_forwards]"
                    : "animate-[gacha-reveal_0.55s_cubic-bezier(0.2,0.9,0.2,1)_forwards]"
                : "scale-90 opacity-0"
            }`}
          >
            {isEpicReveal && phase === "reveal" && (
              <div
                className={`pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] blur-2xl ${
                  isGoatReveal
                    ? "bg-amber-400/25 animate-[gacha-aura_2s_ease-in-out_infinite]"
                    : "bg-rose-400/20 animate-[gacha-aura_2.2s_ease-in-out_infinite]"
                }`}
              />
            )}

            <p
              className={`text-sm tracking-[0.2em] uppercase ${
                isGoatReveal
                  ? "text-amber-200 animate-[gacha-title-glint_1.4s_ease-in-out_infinite]"
                  : revealStyle.title
              }`}
            >
              {isMultiPull
                ? `${lastPull.pullCount}연차 · BEST`
                : isGoatReveal
                  ? "MYTHIC APPEARANCE"
                  : isLegendReveal
                    ? "LEGENDARY PULL"
                    : highlightDuplicate
                      ? "Duplicate Pull"
                      : "New Card"}
            </p>
            <h3
              className={`mt-2 font-[family-name:var(--font-display)] text-3xl ${
                isGoatReveal
                  ? "bg-gradient-to-r from-yellow-200 via-amber-100 to-yellow-300 bg-clip-text text-transparent"
                  : isLegendReveal
                    ? "text-rose-100"
                    : "text-white"
              }`}
            >
              {isGoatReveal
                ? "GOAT 강림!"
                : isLegendReveal
                  ? "레전드 등장!"
                  : `${revealStyle.label} 등장!`}
            </h3>
            <div className="mx-auto mt-6 max-w-xs text-left">
              <GachaCardView
                card={highlight}
                featured
                epicEntrance={isEpicReveal && phase === "reveal"}
              />
            </div>

            {phase === "reveal" && isMultiPull && (
              <div className="mt-8 text-left">
                <p className="mb-4 text-center text-sm text-white/70">
                  뽑힌 카드 {lastPull.results.length}장
                </p>
                <div className="grid max-h-[42vh] gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {lastPull.results.map((item, index) => (
                    <div key={`${item.card.id}-${index}`} className="relative">
                      <GachaCardView card={item.card} />
                      {item.duplicate && (
                        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">
                          DUP
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-5 text-sm text-white/70">남은 포인트 {lastPull.remainingPoints}</p>
            {phase === "reveal" && (
              <button
                type="button"
                onClick={closeReveal}
                className={`pointer-events-auto mt-6 rounded-full px-6 py-2.5 text-sm font-medium transition ${
                  isGoatReveal
                    ? "bg-gradient-to-r from-amber-200 to-yellow-300 text-ink hover:brightness-110"
                    : isLegendReveal
                      ? "bg-gradient-to-r from-rose-200 to-orange-200 text-ink hover:brightness-110"
                      : "bg-white text-ink hover:bg-accent-soft"
                }`}
              >
                확인
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GachaCardView({
  card,
  featured = false,
  epicEntrance = false,
}: {
  card: GachaCard;
  featured?: boolean;
  epicEntrance?: boolean;
}) {
  const style = RARITY_STYLE[card.rarity];
  const isGoat = card.rarity === "GOAT";
  const isLegend = card.rarity === "LEGEND";
  const imageUrl = resolveGachaImageUrl(card);

  return (
    <article
      className={`relative overflow-hidden rounded-[1.4rem] border-2 p-3 ${style.frame} ${style.glow} ${
        epicEntrance && isGoat
          ? "animate-[gacha-card-pop-goat_0.95s_cubic-bezier(0.16,0.9,0.2,1)_forwards]"
          : epicEntrance && isLegend
            ? "animate-[gacha-card-pop-legend_0.8s_cubic-bezier(0.16,0.9,0.2,1)_forwards]"
            : featured
              ? "animate-[gacha-card-pop_0.6s_cubic-bezier(0.2,0.9,0.2,1)_forwards]"
              : ""
      }`}
    >
      {featured && (
        <div className="pointer-events-none absolute -left-10 top-0 h-full w-16 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[gacha-button-shine_1.4s_linear_infinite]" />
      )}
      {epicEntrance && (
        <div
          className={`pointer-events-none absolute inset-0 ${
            isGoat
              ? "bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.45),transparent_55%)] animate-[gacha-card-shine_1.2s_ease-out_forwards]"
              : "bg-[radial-gradient(circle_at_50%_20%,rgba(251,113,133,0.4),transparent_55%)] animate-[gacha-card-shine_1s_ease-out_forwards]"
          }`}
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${style.badge}`}>
          {style.label}
        </span>
        <span className={`text-xs ${isGoat ? "text-amber-100/80" : "text-muted"}`}>
          #{card.serialNo} · x{card.quantity}
        </span>
      </div>
      <div
        className={`relative mt-3 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[1rem] border ${
          isGoat ? "border-amber-300/40 bg-black/30" : "border-white/60 bg-white/55"
        }`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="h-full w-full object-contain p-3 drop-shadow-[0_8px_18px_rgba(0,0,0,0.25)]"
            loading="lazy"
          />
        ) : (
          <div className={`h-16 w-16 rounded-full border border-white/50 ${style.marble}`} />
        )}
      </div>
      <h3 className={`mt-3 text-lg font-semibold ${isGoat ? "text-amber-50" : "text-ink"}`}>{card.name}</h3>
      <p className={`mt-1 text-xs ${isGoat ? "text-amber-100/70" : "text-muted"}`}>
        {getGachaThemeLabel(card.themeCode)} · {card.code}
      </p>
    </article>
  );
}

function phaseLabel(phase: PullPhase) {
  switch (phase) {
    case "spin":
      return "카드가 도는 중...";
    case "drop":
      return "카드가 정해지는 중...";
    case "burst":
      return "결과 확인 중...";
    case "reveal":
      return "결과 공개";
    default:
      return "뽑는 중...";
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
