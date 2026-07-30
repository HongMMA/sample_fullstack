"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getGachaProfile, getGachaRanking, getGachaTheme, pullGacha } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { getGachaThemeLabel, resolveGachaImageUrl } from "@/lib/gacha-theme";
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

  const busy = phase !== "idle" || isPending;

  const marbles = useMemo(() => {
    const rarities: GachaRarity[] = [
      "NORMAL",
      "NORMAL",
      "NORMAL",
      "NORMAL",
      "MAGIC",
      "MAGIC",
      "MAGIC",
      "RARE",
      "RARE",
      "UNIQUE",
      "LEGEND",
      "GOAT",
    ];
    return rarities.map((rarity, index) => ({
      id: index,
      rarity,
      left: 10 + ((index * 13) % 72),
      top: 12 + ((index * 19) % 52),
      delay: index * 0.12,
      size: 26 + (index % 3) * 4,
    }));
  }, []);

  const sparks = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: 8 + ((index * 17) % 84),
        delay: index * 0.05,
        duration: 0.7 + (index % 5) * 0.12,
      })),
    []
  );

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/gacha");
      return;
    }

    Promise.all([
      getGachaProfile(accessToken),
      getGachaRanking(accessToken),
      getGachaTheme(accessToken),
    ])
      .then(([nextProfile, nextRanking, nextTheme]) => {
        setProfile(nextProfile);
        setRanking(nextRanking);
        setTheme(nextTheme);
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

  function onPull() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/gacha");
      return;
    }
    if (!profile || profile.points < 1 || busy) {
      return;
    }

    setError(null);
    setLastPull(null);
    setPhase("spin");

    startTransition(async () => {
      try {
        await wait(1100);
        const result = await pullGacha(
          accessToken,
          selectedRarity === "RANDOM" ? null : selectedRarity
        );
        setLastPull(result);
        setPhase("drop");
        await wait(750);
        setPhase("burst");
        await wait(
          result.pulledCard.rarity === "GOAT" || result.pulledCard.rarity === "LEGEND" ? 1100 : 800
        );
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
  }

  if (!profile) {
    return <p className="text-sm text-muted">가챠 금고를 여는 중...</p>;
  }

  const revealStyle = lastPull ? RARITY_STYLE[lastPull.pulledCard.rarity] : null;

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm tracking-[0.16em] text-muted uppercase">Capsule Vault</p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">구슬 뽑기</h2>
              <p className="mt-2 text-sm text-muted">
                1회 뽑기 = 1포인트 · 현재 테마:{" "}
                {theme?.displayName ?? getGachaThemeLabel(profile.cards[0]?.themeCode, "카드")}
              </p>
            </div>
            <div className="rounded-full border border-line bg-white px-5 py-2 text-sm font-medium text-ink">
              보유 포인트 <span className="text-accent">{profile.points}</span>
            </div>
          </div>

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

          <div className="mt-8 flex flex-col items-center gap-6">
            <div
              className={`relative h-80 w-80 overflow-hidden rounded-[2.2rem] border-4 border-ink/80 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.22),transparent_34%),linear-gradient(180deg,#243044,#0b1220)] shadow-[inset_0_0_50px_rgba(255,255,255,0.08),0_20px_50px_rgba(15,23,42,0.35)] ${
                phase === "spin" ? "animate-[gacha-shake_0.35s_ease-in-out_infinite]" : ""
              } ${phase === "drop" ? "animate-[gacha-pulse_0.5s_ease-in-out_infinite]" : ""}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(56,189,248,0.12),transparent_40%)]" />
              <div className="absolute inset-x-10 top-5 h-11 rounded-full border border-white/25 bg-white/10 backdrop-blur" />
              <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

              {marbles.map((marble) => (
                <span
                  key={marble.id}
                  className={`absolute rounded-full border border-white/50 shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.25),0_0_12px_rgba(255,255,255,0.15)] ${
                    RARITY_STYLE[marble.rarity].marble
                  } ${
                    phase === "spin"
                      ? "animate-[gacha-chaos_0.45s_ease-in-out_infinite]"
                      : phase === "drop"
                        ? "animate-[gacha-drain_0.7s_ease-in_forwards]"
                        : "animate-[gacha-float_3.2s_ease-in-out_infinite]"
                  }`}
                  style={{
                    left: `${marble.left}%`,
                    top: `${marble.top}%`,
                    width: marble.size,
                    height: marble.size,
                    animationDelay: `${marble.delay}s`,
                  }}
                />
              ))}

              {(phase === "drop" || phase === "burst") && lastPull && (
                <span
                  className={`absolute left-1/2 top-[58%] h-11 w-11 -translate-x-1/2 rounded-full border-2 border-white/70 ${
                    RARITY_STYLE[lastPull.pulledCard.rarity].marble
                  } animate-[gacha-marble-drop_0.7s_cubic-bezier(0.2,0.8,0.2,1)_forwards]`}
                />
              )}

              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-5 left-1/2 h-12 w-[4.5rem] -translate-x-1/2 overflow-hidden rounded-b-2xl border border-white/30 bg-gradient-to-b from-white/20 to-black/40">
                <div
                  className={`absolute inset-x-2 top-1 h-2 rounded-full bg-white/30 ${
                    phase === "drop" ? "animate-[gacha-chute_0.6s_ease-in-out_infinite]" : ""
                  }`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onPull}
              disabled={busy || profile.points < 1}
              className="relative overflow-hidden rounded-full bg-accent px-8 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <span className="relative z-10">
                {busy
                ? phaseLabel(phase)
                : profile.points < 1
                  ? "포인트 부족"
                  : selectedRarity === "RANDOM"
                    ? "1포인트로 뽑기"
                    : `${RARITY_STYLE[selectedRarity].label} 뽑기`}
              </span>
              {busy && <span className="absolute inset-0 animate-[gacha-button-shine_1.1s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />}
            </button>

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
                ? "아직 카드가 없습니다. 구슬을 뽑아 컬렉션을 시작하세요."
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

      {(phase === "burst" || phase === "reveal") && lastPull && revealStyle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            onClick={phase === "reveal" ? closeReveal : undefined}
          />
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={`absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r ${revealStyle.burst} ${
                phase === "burst" ? "animate-[gacha-ring_0.9s_ease-out_forwards]" : "opacity-40"
              }`}
            />
            {sparks.map((spark) => (
              <span
                key={spark.id}
                className={`absolute top-1/2 h-2 w-2 rounded-full ${revealStyle.marble} ${
                  phase === "burst" ? "animate-[gacha-spark_0.9s_ease-out_forwards]" : "opacity-0"
                }`}
                style={{
                  left: `${spark.left}%`,
                  animationDelay: `${spark.delay}s`,
                  animationDuration: `${spark.duration}s`,
                }}
              />
            ))}
          </div>

          <div
            className={`relative z-10 w-full max-w-md rounded-[2rem] border border-white/20 bg-slate-950/80 p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${
              phase === "reveal" ? "animate-[gacha-reveal_0.55s_cubic-bezier(0.2,0.9,0.2,1)_forwards]" : "scale-90 opacity-0"
            }`}
          >
            <p className={`text-sm tracking-[0.2em] uppercase ${revealStyle.title}`}>
              {lastPull.duplicate ? "Duplicate Pull" : "New Card"}
            </p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">
              {revealStyle.label} 등장!
            </h3>
            <div className="mx-auto mt-6 max-w-xs text-left">
              <GachaCardView card={lastPull.pulledCard} featured />
            </div>
            <p className="mt-5 text-sm text-white/70">남은 포인트 {lastPull.remainingPoints}</p>
            {phase === "reveal" && (
              <button
                type="button"
                onClick={closeReveal}
                className="pointer-events-auto mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft"
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

function GachaCardView({ card, featured = false }: { card: GachaCard; featured?: boolean }) {
  const style = RARITY_STYLE[card.rarity];
  const isGoat = card.rarity === "GOAT";
  const imageUrl = resolveGachaImageUrl(card);

  return (
    <article
      className={`relative overflow-hidden rounded-[1.4rem] border-2 p-3 ${style.frame} ${style.glow} ${
        featured ? "animate-[gacha-card-pop_0.6s_cubic-bezier(0.2,0.9,0.2,1)_forwards]" : ""
      }`}
    >
      {featured && (
        <div className="pointer-events-none absolute -left-10 top-0 h-full w-16 rotate-12 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[gacha-button-shine_1.4s_linear_infinite]" />
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
      return "구슬이 뒤섞이는 중...";
    case "drop":
      return "한 알이 떨어지는 중...";
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
