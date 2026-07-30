"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { login } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/game";
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await login({ loginId, password });
      setAuthSession(result.accessToken, result.loginId);
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl">
      <header className="mb-10 border-b border-line pb-6">
        <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Local Board</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
          로그인
        </h1>
        <p className="mt-3 text-sm text-muted">
          `/game` 페이지는 로그인 후 접근할 수 있습니다.<br />데모 계정은 `player1 / 1234`, `player2 / 1234` 입니다.
        </p>
      </header>

      <section className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="loginId" className="mb-2 block text-sm font-medium text-ink">
              아이디
            </label>
            <input
              id="loginId"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-accent focus:ring-2"
              placeholder="player1"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-accent focus:ring-2"
              placeholder="1234"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "로그인 중..." : "로그인"}
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              게시판으로
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl p-6 text-muted">로그인 페이지 로딩 중...</main>}>
      <LoginForm />
    </Suspense>
  );
}
