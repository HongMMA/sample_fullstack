"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Header } from "@/components/Header";
import {
  getAdminGachaThemes,
  getPostWriteSetting,
  updateAdminGachaTheme,
  updatePostWriteSetting,
} from "@/lib/api";
import { getAccessToken, getLoginId, isSuperAdmin } from "@/lib/auth";
import type { GachaThemeOption } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [themes, setThemes] = useState<GachaThemeOption[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const loginId = getLoginId();
    if (!isSuperAdmin(loginId)) {
      router.replace("/board");
      return;
    }
    setAllowed(true);

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/admin");
      return;
    }

    Promise.all([getPostWriteSetting(), getAdminGachaThemes(accessToken)])
      .then(([setting, themeOptions]) => {
        setEnabled(setting.enabled);
        setThemes(themeOptions);
        setSelectedTheme(themeOptions.find((item) => item.active)?.themeCode ?? themeOptions[0]?.themeCode ?? "");
      })
      .catch(() => setError("설정을 불러오지 못했습니다."));
  }, [router]);

  const toggle = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/admin");
      return;
    }

    setError(null);
    setMessage(null);
    const next = !enabled;

    startTransition(async () => {
      try {
        const setting = await updatePostWriteSetting(next, accessToken);
        setEnabled(setting.enabled);
        setMessage(setting.enabled ? "글쓰기가 활성화되었습니다." : "글쓰기가 비활성화되었습니다.");
      } catch {
        setError("설정 변경에 실패했습니다.");
      }
    });
  };

  const switchTheme = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/admin");
      return;
    }
    if (!selectedTheme) {
      return;
    }

    const current = themes.find((item) => item.active);
    if (current?.themeCode === selectedTheme) {
      setMessage("이미 선택된 테마입니다.");
      return;
    }

    const confirmed = window.confirm(
      "뽑기 테마만 바뀝니다. 이미 보유한 카드는 그대로 유지됩니다. 계속할까요?"
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const updated = await updateAdminGachaTheme(selectedTheme, accessToken);
        const nextThemes = await getAdminGachaThemes(accessToken);
        setThemes(nextThemes);
        setSelectedTheme(updated.themeCode);
        setMessage(`가챠 테마가 '${updated.displayName}'(으)로 변경되었습니다. (카드 ${updated.cardCount}장)`);
      } catch {
        setError("테마 변경에 실패했습니다.");
      }
    });
  };

  if (!allowed) {
    return (
      <main>
        <p className="text-sm text-muted">관리자 권한을 확인하는 중...</p>
      </main>
    );
  }

  return (
    <main>
      <Header actionHref="/board" actionLabel="게시판으로" />
      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">관리 설정</h1>
        <p className="mt-2 text-sm text-muted">superadmin 전용 설정입니다.</p>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
          <div>
            <p className="font-medium text-ink">게시판 글쓰기</p>
            <p className="mt-1 text-sm text-muted">
              현재 상태: {enabled ? "활성화" : "비활성화"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {isPending ? "변경 중..." : enabled ? "글쓰기 끄기" : "글쓰기 켜기"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">가챠 테마</p>
              <p className="mt-1 text-sm text-muted">
                포켓몬 / DKT 등 캐릭터 세트를 교체합니다. 변경 시 인벤토리가 초기화됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={switchTheme}
              disabled={isPending || !selectedTheme}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? "적용 중..." : "테마 적용"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {themes.map((theme) => (
              <label
                key={theme.themeCode}
                className={`cursor-pointer rounded-2xl border px-4 py-3 transition ${
                  selectedTheme === theme.themeCode
                    ? "border-accent bg-accent-soft/40"
                    : "border-line bg-bg-elevated/50 hover:border-accent/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="gacha-theme"
                    className="mt-1"
                    checked={selectedTheme === theme.themeCode}
                    onChange={() => setSelectedTheme(theme.themeCode)}
                    disabled={isPending}
                  />
                  <div>
                    <p className="font-medium text-ink">
                      {theme.displayName}
                      {theme.active ? <span className="ml-2 text-xs text-accent">사용 중</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      code: {theme.themeCode} · 카드 {theme.cardCount}장
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            DKT 캐릭터/이미지는 `board-api/src/main/resources/gacha/dkt-characters.json` 과
            `board-web/public/gacha/dkt/` 에 추가하면 됩니다. 각 캐릭터는 자동으로 전 등급 카드가 생성됩니다.
          </p>
        </div>

        {message && <p className="mt-4 text-sm text-ink">{message}</p>}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </section>
    </main>
  );
}
