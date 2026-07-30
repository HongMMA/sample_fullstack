"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Header } from "@/components/Header";
import { getPostWriteSetting, updatePostWriteSetting } from "@/lib/api";
import { getAccessToken, getLoginId, isSuperAdmin } from "@/lib/auth";

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [enabled, setEnabled] = useState(true);
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
    getPostWriteSetting()
      .then((setting) => setEnabled(setting.enabled))
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
        <p className="mt-2 text-sm text-muted">superadmin만 글쓰기 API를 켜거나 끌 수 있습니다.</p>

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

        {message && <p className="mt-4 text-sm text-ink">{message}</p>}
        {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      </section>
    </main>
  );
}
