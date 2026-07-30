"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GachaGame } from "@/components/GachaGame";
import { getGachaServiceSetting } from "@/lib/api";
import { getAccessToken, getLoginId, isGuestLoginId, isSuperAdmin } from "@/lib/auth";

export default function GachaPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [closedMessage, setClosedMessage] = useState<string | null>(null);

  useEffect(() => {
    const loginId = getLoginId();
    const accessToken = getAccessToken();

    if (!loginId || !accessToken) {
      router.replace("/login?redirect=/gacha");
      return;
    }
    if (isGuestLoginId(loginId)) {
      setClosedMessage("게스트는 가챠를 이용할 수 없습니다. 회원 로그인 후 이용해 주세요.");
      return;
    }
    if (isSuperAdmin(loginId)) {
      setAllowed(true);
      return;
    }

    getGachaServiceSetting()
      .then((setting) => {
        if (!setting.enabled) {
          setClosedMessage("가챠 서비스가 아직 오픈되지 않았습니다.");
          return;
        }
        setAllowed(true);
      })
      .catch(() => setClosedMessage("가챠 상태를 확인하지 못했습니다."));
  }, [router]);

  if (closedMessage) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-muted">{closedMessage}</p>
        <Link href="/board" className="mt-4 inline-flex text-sm text-accent hover:underline">
          게시판으로
        </Link>
      </main>
    );
  }

  if (!allowed) {
    return <main className="mx-auto max-w-3xl p-6 text-sm text-muted">확인 중...</main>;
  }

  return (
    <main>
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Capsule Vault</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
            가챠
          </h1>
          <p className="mt-2 text-sm text-muted">카드를 모아 순위에 도전하세요</p>
        </div>
        <Link
          href="/board"
          className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          게시판으로
        </Link>
      </header>
      <GachaGame />
    </main>
  );
}
