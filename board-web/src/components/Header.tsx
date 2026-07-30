import Link from "next/link";

type HeaderProps = {
  actionHref?: string;
  actionLabel?: string;
};

export function Header({ actionHref = "/board/new", actionLabel = "글쓰기" }: HeaderProps) {
  return (
    <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
      <div>
        <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Local Board</p>
        <Link href="/board" className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
          게시판
        </Link>
      </div>
      <div className="flex items-center gap-3">
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
        <Link
          href={actionHref}
          className="inline-flex items-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
        >
          {actionLabel}
        </Link>
      </div>
    </header>
  );
}
