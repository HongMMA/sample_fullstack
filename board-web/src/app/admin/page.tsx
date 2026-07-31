"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Header } from "@/components/Header";
import {
  ApiError,
  getAdminGachaCharacters,
  getAdminGachaPlayerPoints,
  getAdminGachaThemes,
  getGachaCharacterUploadSetting,
  getGachaServiceSetting,
  getPostWriteSetting,
  updateAdminGachaPlayerPoints,
  updateAdminGachaTheme,
  updateGachaCharacterUploadSetting,
  updateGachaServiceSetting,
  updatePostWriteSetting,
  uploadAdminGachaCharacter,
} from "@/lib/api";
import { getAccessToken, getLoginId, isSuperAdmin } from "@/lib/auth";
import { resolveGachaMediaUrl } from "@/lib/gacha-theme";
import type { GachaCharacter, GachaPlayerPoints, GachaThemeOption } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [gachaEnabled, setGachaEnabled] = useState(false);
  const [characterUploadEnabled, setCharacterUploadEnabled] = useState(false);
  const [themes, setThemes] = useState<GachaThemeOption[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const [pointsLoginId, setPointsLoginId] = useState("");
  const [pointsAmount, setPointsAmount] = useState("10");
  const [playerPoints, setPlayerPoints] = useState<GachaPlayerPoints | null>(null);
  const [characters, setCharacters] = useState<GachaCharacter[]>([]);
  const [characterName, setCharacterName] = useState("");
  const [characterImage, setCharacterImage] = useState<File | null>(null);
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

    Promise.all([
      getPostWriteSetting(),
      getGachaServiceSetting(),
      getGachaCharacterUploadSetting(),
      getAdminGachaThemes(accessToken),
      getAdminGachaCharacters(accessToken),
    ])
      .then(([setting, gachaSetting, uploadSetting, themeOptions, characterList]) => {
        setEnabled(setting.enabled);
        setGachaEnabled(gachaSetting.enabled);
        setCharacterUploadEnabled(uploadSetting.enabled);
        setThemes(themeOptions);
        setSelectedTheme(
          themeOptions.find((item) => item.active)?.themeCode ?? themeOptions[0]?.themeCode ?? ""
        );
        setCharacters(characterList);
      })
      .catch(() => setError("설정을 불러오지 못했습니다."));
  }, [router]);

  const requireToken = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/admin");
      return null;
    }
    return accessToken;
  };

  const toggle = () => {
    const accessToken = requireToken();
    if (!accessToken) {
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

  const toggleGacha = () => {
    const accessToken = requireToken();
    if (!accessToken) {
      return;
    }

    setError(null);
    setMessage(null);
    const next = !gachaEnabled;

    startTransition(async () => {
      try {
        const setting = await updateGachaServiceSetting(next, accessToken);
        setGachaEnabled(setting.enabled);
        setMessage(setting.enabled ? "가챠 서비스가 오픈되었습니다." : "가챠 서비스가 종료되었습니다.");
      } catch {
        setError("가챠 오픈 상태 변경에 실패했습니다.");
      }
    });
  };

  const toggleCharacterUpload = () => {
    const accessToken = requireToken();
    if (!accessToken) {
      return;
    }

    setError(null);
    setMessage(null);
    const next = !characterUploadEnabled;

    startTransition(async () => {
      try {
        const setting = await updateGachaCharacterUploadSetting(next, accessToken);
        setCharacterUploadEnabled(setting.enabled);
        setMessage(
          setting.enabled
            ? "일반 회원 캐릭터 업로드가 오픈되었습니다."
            : "일반 회원 캐릭터 업로드가 종료되었습니다."
        );
      } catch {
        setError("캐릭터 업로드 오픈 상태 변경에 실패했습니다.");
      }
    });
  };

  const switchTheme = () => {
    const accessToken = requireToken();
    if (!accessToken || !selectedTheme) {
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

  const lookupPoints = () => {
    const accessToken = requireToken();
    if (!accessToken) {
      return;
    }
    const loginId = pointsLoginId.trim();
    if (!loginId) {
      setError("조회할 아이디를 입력하세요.");
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await getAdminGachaPlayerPoints(loginId, accessToken);
        setPlayerPoints(result);
        setMessage(`${result.loginId} 현재 포인트: ${result.points}`);
      } catch {
        setPlayerPoints(null);
        setError("사용자를 찾지 못했거나 조회에 실패했습니다.");
      }
    });
  };

  const adjustPoints = (sign: 1 | -1) => {
    const accessToken = requireToken();
    if (!accessToken) {
      return;
    }
    const loginId = pointsLoginId.trim();
    const amount = Number(pointsAmount);
    if (!loginId) {
      setError("아이디를 입력하세요.");
      return;
    }
    if (!Number.isInteger(amount) || amount <= 0) {
      setError("포인트는 1 이상의 정수여야 합니다.");
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateAdminGachaPlayerPoints(loginId, sign * amount, accessToken);
        setPlayerPoints(result);
        setMessage(
          sign > 0
            ? `${result.loginId}에게 ${amount}포인트 지급 → 현재 ${result.points}`
            : `${result.loginId}에서 ${amount}포인트 차감 → 현재 ${result.points}`
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "포인트 변경에 실패했습니다.");
      }
    });
  };

  const uploadCharacter = () => {
    const accessToken = requireToken();
    if (!accessToken) {
      return;
    }
    const name = characterName.trim();
    if (!name) {
      setError("캐릭터 이름을 입력하세요.");
      return;
    }
    if (!characterImage) {
      setError("캐릭터 이미지를 선택하세요.");
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const created = await uploadAdminGachaCharacter(name, characterImage, accessToken);
        const [nextCharacters, nextThemes] = await Promise.all([
          getAdminGachaCharacters(accessToken),
          getAdminGachaThemes(accessToken),
        ]);
        setCharacters(nextCharacters);
        setThemes(nextThemes);
        setCharacterName("");
        setCharacterImage(null);
        setMessage(
          `DKT 캐릭터 '${created.name}' 등록 완료 (희귀도 6종 자동 생성, serial ${created.serialNo})`
        );
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "캐릭터 업로드에 실패했습니다.");
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
            <p className="mt-1 text-sm text-muted">현재 상태: {enabled ? "활성화" : "비활성화"}</p>
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
          <div>
            <p className="font-medium text-ink">가챠 서비스 오픈</p>
            <p className="mt-1 text-sm text-muted">
              현재 상태: {gachaEnabled ? "오픈 (일반 회원 이용 가능)" : "종료 (superadmin만 이용)"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleGacha}
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {isPending ? "변경 중..." : gachaEnabled ? "가챠 종료" : "가챠 오픈"}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4">
          <div>
            <p className="font-medium text-ink">DKT 캐릭터 업로드 오픈</p>
            <p className="mt-1 text-sm text-muted">
              현재 상태:{" "}
              {characterUploadEnabled
                ? "오픈 (일반 회원도 가챠 페이지에서 업로드 가능)"
                : "종료 (관리자만 업로드)"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleCharacterUpload}
            disabled={isPending}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {isPending
              ? "변경 중..."
              : characterUploadEnabled
                ? "회원 업로드 종료"
                : "회원 업로드 오픈"}
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">가챠 포인트 관리</p>
              <p className="mt-1 text-sm text-muted">회원 아이디로 포인트를 조회·지급·차감합니다.</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={pointsLoginId}
              onChange={(event) => setPointsLoginId(event.target.value)}
              placeholder="회원 아이디"
              className="min-w-[10rem] flex-1 rounded-full border border-line bg-bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <input
              type="number"
              min={1}
              step={1}
              value={pointsAmount}
              onChange={(event) => setPointsAmount(event.target.value)}
              placeholder="포인트"
              className="w-28 rounded-full border border-line bg-bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={lookupPoints}
              disabled={isPending}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              조회
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(1)}
              disabled={isPending}
              className="rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              지급
            </button>
            <button
              type="button"
              onClick={() => adjustPoints(-1)}
              disabled={isPending}
              className="rounded-full border border-danger/30 bg-danger-soft px-4 py-2.5 text-sm font-medium text-danger transition hover:brightness-105 disabled:opacity-60"
            >
              차감
            </button>
          </div>

          {playerPoints && (
            <p className="mt-3 text-sm text-ink">
              <span className="font-medium">{playerPoints.loginId}</span> · 현재{" "}
              <span className="text-accent">{playerPoints.points}</span> 포인트
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium text-ink">가챠 테마</p>
              <p className="mt-1 text-sm text-muted">
                포켓몬 / DKT 등 캐릭터 세트를 교체합니다. 보유 카드는 테마별로 유지됩니다.
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
        </div>

        <div className="mt-6 rounded-2xl border border-line bg-white px-5 py-4">
          <div>
            <p className="font-medium text-ink">DKT 캐릭터 등록</p>
            <p className="mt-1 text-sm text-muted">
              이름과 이미지를 올리면 희귀도 6종 카드가 자동 생성됩니다. 이미지는 API에 저장됩니다.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <input
              type="text"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder="캐릭터 이름"
              maxLength={40}
              className="min-w-[10rem] flex-1 rounded-full border border-line bg-bg-elevated px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setCharacterImage(event.target.files?.[0] ?? null)}
              className="min-w-[12rem] flex-1 rounded-full border border-line bg-bg-elevated px-4 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-xs file:text-accent"
            />
            <button
              type="button"
              onClick={uploadCharacter}
              disabled={isPending}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? "등록 중..." : "캐릭터 등록"}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map((character) => {
              const imageSrc = resolveGachaMediaUrl(character.imageUrl);
              return (
                <div
                  key={character.id}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-bg-elevated/50 px-3 py-3"
                >
                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={character.name}
                      className="h-14 w-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-xs text-muted">
                      N/A
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{character.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      #{character.serialNo} · {character.artKey} · {character.source}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-ink">{message}</p>}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </section>
    </main>
  );
}
