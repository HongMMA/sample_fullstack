"use client";

import { useEffect, useState, useTransition } from "react";
import { ApiError, getGachaCharacters, uploadGachaCharacter } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { resolveGachaMediaUrl } from "@/lib/gacha-theme";
import type { GachaCharacter } from "@/lib/types";

type Props = {
  enabled: boolean;
};

export function GachaCharacterUploadPanel({ enabled }: Props) {
  const [characters, setCharacters] = useState<GachaCharacter[]>([]);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }
    getGachaCharacters(accessToken)
      .then(setCharacters)
      .catch(() => setError("캐릭터 목록을 불러오지 못했습니다."));
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const onUpload = () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError("로그인이 필요합니다.");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("캐릭터 이름을 입력하세요.");
      return;
    }
    if (!image) {
      setError("캐릭터 이미지를 선택하세요.");
      return;
    }

    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const created = await uploadGachaCharacter(trimmed, image, accessToken);
        const next = await getGachaCharacters(accessToken);
        setCharacters(next);
        setName("");
        setImage(null);
        setFileKey((value) => value + 1);
        setMessage(`'${created.name}' 등록 완료 (희귀도 6종 자동 생성)`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "캐릭터 업로드에 실패했습니다.");
      }
    });
  };

  return (
    <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
      <div>
        <p className="text-sm tracking-[0.16em] text-muted uppercase">Character Studio</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink">DKT 캐릭터 등록</h2>
        <p className="mt-2 text-sm text-muted">
          이름과 이미지를 올리면 희귀도 6종 카드가 자동으로 추가됩니다.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="캐릭터 이름"
          maxLength={40}
          className="min-w-[10rem] flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-accent"
        />
        <input
          key={fileKey}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="min-w-[12rem] flex-1 rounded-full border border-line bg-white px-4 py-2 text-sm text-ink file:mr-3 file:rounded-full file:border-0 file:bg-accent-soft file:px-3 file:py-1 file:text-xs file:text-accent"
        />
        <button
          type="button"
          onClick={onUpload}
          disabled={isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "등록 중..." : "캐릭터 등록"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-ink">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((character) => {
          const imageSrc = resolveGachaMediaUrl(character.imageUrl);
          return (
            <div
              key={character.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-white px-3 py-3"
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={character.name} className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-elevated text-xs text-muted">
                  N/A
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{character.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  #{character.serialNo} · {character.source}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
