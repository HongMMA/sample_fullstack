"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, signup } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await signup({ loginId, password, passwordConfirm });
      setAuthSession(result.accessToken, result.loginId);
      router.replace("/board");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl">
      <header className="mb-10 border-b border-line pb-6">
        <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Local Board</p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
          회원가입
        </h1>
        <p className="mt-3 text-sm text-muted">아이디와 비밀번호만으로 간단하게 가입할 수 있습니다.</p>
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
              placeholder="새 아이디"
              autoComplete="username"
              maxLength={30}
              required
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
              placeholder="비밀번호"
              autoComplete="new-password"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label htmlFor="passwordConfirm" className="mb-2 block text-sm font-medium text-ink">
              비밀번호 확인
            </label>
            <input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none ring-accent focus:ring-2"
              placeholder="비밀번호 다시 입력"
              autoComplete="new-password"
              maxLength={100}
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? "가입 중..." : "가입하기"}
            </button>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
            >
              로그인으로
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
