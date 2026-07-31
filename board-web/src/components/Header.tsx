"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getGachaCharacterUploadSetting, getGachaServiceSetting, getPostWriteSetting } from "@/lib/api";
import { getLoginId, isGuestLoginId, isSuperAdmin } from "@/lib/auth";

type HeaderProps = {
  actionHref?: string;
  actionLabel?: string;
};

export function Header({ actionHref = "/board/new", actionLabel = "글쓰기" }: HeaderProps) {
  const [loginId, setLoginId] = useState<string | null>(null);
  const [postWriteEnabled, setPostWriteEnabled] = useState(true);
  const [gachaEnabled, setGachaEnabled] = useState(false);
  const [characterUploadEnabled, setCharacterUploadEnabled] = useState(false);
  const isWriteAction = actionHref === "/board/new" && actionLabel === "글쓰기";

  useEffect(() => {
    setLoginId(getLoginId());
    getPostWriteSetting()
      .then((setting) => setPostWriteEnabled(setting.enabled))
      .catch(() => setPostWriteEnabled(true));
    Promise.all([getGachaServiceSetting(), getGachaCharacterUploadSetting()])
      .then(([gachaSetting, uploadSetting]) => {
        setGachaEnabled(gachaSetting.enabled);
        setCharacterUploadEnabled(uploadSetting.enabled);
      })
      .catch(() => {
        setGachaEnabled(false);
        setCharacterUploadEnabled(false);
      });
  }, []);

  const isGuest = isGuestLoginId(loginId);
  const canWrite = !isGuest && (postWriteEnabled || isSuperAdmin(loginId));
  const canSeeGacha =
    Boolean(loginId) &&
    !isGuest &&
    (gachaEnabled || characterUploadEnabled || isSuperAdmin(loginId));

  return (
    <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
      <div>
        <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Local Board</p>
        <Link href="/board" className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
          게시판
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {isSuperAdmin(loginId) && (
          <Link
            href="/admin"
            className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
          >
            관리
          </Link>
        )}
        {canSeeGacha && (
          <Link
            href="/gacha"
            className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
          >
            가챠
          </Link>
        )}
        <Link
          href="/login"
          className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          회원가입
        </Link>
        <Link
          href="/game"
          className="inline-flex items-center rounded-full border border-line bg-bg-elevated px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          게임
        </Link>
        {isWriteAction && !canWrite ? (
          <span className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-muted">
            {isGuest ? "회원만 글쓰기" : "글쓰기 중지됨"}
          </span>
        ) : (
          <Link
            href={actionHref}
            className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
          >
            {actionLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
