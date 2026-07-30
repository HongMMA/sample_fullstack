"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GachaGame } from "@/components/GachaGame";
import { getLoginId, isSuperAdmin } from "@/lib/auth";

export default function GachaPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const loginId = getLoginId();
    if (!isSuperAdmin(loginId)) {
      router.replace("/board");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return <main className="mx-auto max-w-3xl p-6 text-sm text-muted">확인 중...</main>;
  }

  return (
    <main>
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Secret Lab</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
            가챠
          </h1>
          <p className="mt-2 text-sm text-muted">superadmin 전용 프리뷰 · 일반 사용자에게는 비공개</p>
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
