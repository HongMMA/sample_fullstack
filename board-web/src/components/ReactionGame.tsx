"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createGameScore, getGameScores, getMe } from "@/lib/api";
import { clearAuthSession, getAccessToken } from "@/lib/auth";
import type { GameScore, Me } from "@/lib/types";

const GRID_SIZE = 10;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const BASE_TIME_MS = 3000;
const TIME_STEP_MS = 200;
const MIN_TIME_MS = 200;

type Phase = "idle" | "playing" | "gameover";

function timeLimitForRound(round: number) {
  return Math.max(MIN_TIME_MS, BASE_TIME_MS - (round - 1) * TIME_STEP_MS);
}

function pickTarget(exclude: number | null) {
  let next = Math.floor(Math.random() * CELL_COUNT);
  if (exclude === null || CELL_COUNT <= 1) {
    return next;
  }
  while (next === exclude) {
    next = Math.floor(Math.random() * CELL_COUNT);
  }
  return next;
}

export function ReactionGame() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState(1);
  const [target, setTarget] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(BASE_TIME_MS);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ranking, setRanking] = useState<GameScore[]>([]);
  const [rankingError, setRankingError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const deadlineRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const roundRef = useRef(1);
  const targetRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>("idle");

  const loadRanking = useCallback(async () => {
    try {
      const scores = await getGameScores();
      setRanking(scores);
      setRankingError(null);
    } catch {
      setRankingError("랭킹을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadRanking();
  }, [loadRanking]);

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      clearAuthSession();
      router.replace("/login?redirect=/game");
      return;
    }

    void (async () => {
      try {
        const currentUser = await getMe(accessToken);
        setMe(currentUser);
      } catch {
        clearAuthSession();
        router.replace("/login?redirect=/game");
      } finally {
        setAuthLoading(false);
      }
    })();
  }, [router]);

  const clearTimer = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const endGame = useCallback(() => {
    clearTimer();
    phaseRef.current = "gameover";
    setPhase("gameover");
    setTarget(null);
    targetRef.current = null;
    setSaved(false);
    setSaveError(null);
  }, [clearTimer]);

  const tick = useCallback(() => {
    const left = deadlineRef.current - performance.now();
    if (left <= 0) {
      setRemainingMs(0);
      endGame();
      return;
    }
    setRemainingMs(left);
    rafRef.current = requestAnimationFrame(tick);
  }, [endGame]);

  const startRound = useCallback(
    (nextRound: number, previousTarget: number | null) => {
      const limit = timeLimitForRound(nextRound);
      const nextTarget = pickTarget(previousTarget);

      roundRef.current = nextRound;
      targetRef.current = nextTarget;
      phaseRef.current = "playing";

      setRound(nextRound);
      setTarget(nextTarget);
      setRemainingMs(limit);
      setPhase("playing");

      clearTimer();
      deadlineRef.current = performance.now() + limit;
      rafRef.current = requestAnimationFrame(tick);
    },
    [clearTimer, tick]
  );

  const startGame = () => {
    setSaved(false);
    setSaveError(null);
    startRound(1, null);
  };

  const handleHit = (index: number) => {
    if (phaseRef.current !== "playing") return;
    if (targetRef.current !== index) return;
    clearTimer();
    startRound(roundRef.current + 1, index);
  };

  useEffect(() => () => clearTimer(), [clearTimer]);

  const handleSave = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      clearAuthSession();
      router.replace("/login?redirect=/game");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await createGameScore({ finalRound: round }, accessToken);
      setSaved(true);
      await loadRanking();
    } catch {
      setSaveError("점수 저장에 실패했습니다. 다시 로그인 후 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const limitMs = timeLimitForRound(round);
  const progress = phase === "playing" ? Math.max(0, remainingMs / limitMs) : 0;
  const secondsLabel = (remainingMs / 1000).toFixed(1);

  if (authLoading) {
    return (
      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <p className="text-sm text-muted">로그인 정보를 확인하고 있습니다...</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm tracking-[0.16em] text-muted uppercase">Reaction Grid</p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-ink">불빛 따라잡기</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              10×10 격자 중 불이 켜진 칸으로 마우스를 옮기세요. 제한 시간 안에 닿지 못하면 게임 오버입니다.
            </p>
            {me && <p className="mt-2 text-sm text-accent">현재 로그인: {me.loginId}</p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent-soft px-4 py-3 text-center">
              <p className="text-xs tracking-wide text-muted uppercase">Round</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-ink">{round}</p>
            </div>
            <div className="rounded-2xl bg-accent-soft px-4 py-3 text-center min-w-24">
              <p className="text-xs tracking-wide text-muted uppercase">Time</p>
              <p className="font-[family-name:var(--font-display)] text-2xl text-ink">
                {phase === "playing" ? `${secondsLabel}s` : `${(limitMs / 1000).toFixed(1)}s`}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-line/60">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-75 ease-linear"
            style={{ width: phase === "playing" ? `${progress * 100}%` : "100%" }}
          />
        </div>

        <div
          className="mx-auto grid aspect-square w-full max-w-[440px] gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
          onContextMenu={(event) => event.preventDefault()}
        >
          {Array.from({ length: CELL_COUNT }, (_, index) => {
            const lit = target === index && phase === "playing";
            return (
              <button
                key={index}
                type="button"
                aria-label={lit ? "목표 칸" : `칸 ${index + 1}`}
                tabIndex={-1}
                onMouseEnter={() => handleHit(index)}
                className={[
                  "aspect-square rounded-md border transition duration-150",
                  lit
                    ? "scale-105 border-accent bg-accent shadow-[0_0_18px_rgba(31,107,74,0.45)]"
                    : "border-line/80 bg-[#e7eee8] hover:bg-[#dfe8e1]",
                ].join(" ")}
              />
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {phase === "idle" && (
            <p className="text-sm text-muted">준비가 되면 시작을 눌러 주세요. 1라운드 제한 시간은 3초입니다.</p>
          )}
          {phase === "playing" && (
            <p className="text-sm text-muted">불이 켜진 칸으로 커서를 옮기세요. 클릭은 필요 없습니다.</p>
          )}
          {phase === "gameover" && (
            <p className="text-sm text-danger">게임 오버 · 최종 라운드 {round}</p>
          )}

          {phase !== "playing" && (
            <button
              type="button"
              onClick={startGame}
              className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              {phase === "idle" ? "게임 시작" : "다시 하기"}
            </button>
          )}
        </div>

        {phase === "gameover" && (
          <div className="mt-6 rounded-2xl border border-line bg-white/70 p-5">
            <p className="text-sm text-ink">기록은 로그인한 계정 ID로 자동 저장됩니다.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saved || saving}
                className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saved ? "저장 완료" : saving ? "저장 중..." : "점수 저장"}
              </button>
              {me && <span className="text-sm text-muted">저장 계정: {me.loginId}</span>}
            </div>
            {saveError && <p className="mt-2 text-sm text-danger">{saveError}</p>}
            {saved && (
              <p className="mt-2 text-sm text-accent">
                {me?.loginId} 님의 {round}라운드 기록이 랭킹에 반영되었습니다.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm tracking-[0.16em] text-muted uppercase">Leaderboard</p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">랭킹 TOP 10</h2>
          </div>
          <button
            type="button"
            onClick={() => void loadRanking()}
            className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
          >
            새로고침
          </button>
        </div>

        {rankingError ? (
          <p className="text-sm text-danger">{rankingError}</p>
        ) : ranking.length === 0 ? (
          <p className="text-sm text-muted">아직 기록이 없습니다. 첫 랭커가 되어 보세요.</p>
        ) : (
          <ol className="divide-y divide-line/70">
            {ranking.map((score) => (
              <li key={score.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                    {score.rank}
                  </span>
                  <span className="truncate font-medium text-ink">{score.playerName}</span>
                </div>
                <span className="shrink-0 text-sm text-muted">{score.finalRound} 라운드</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
