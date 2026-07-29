import Link from "next/link";

export default function NotFound() {
  return (
    <main className="rounded-3xl border border-line bg-bg-elevated px-8 py-16 text-center shadow-[var(--shadow)]">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">게시글을 찾을 수 없습니다</h1>
      <p className="mt-3 text-muted">삭제되었거나 잘못된 주소일 수 있습니다.</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
      >
        목록으로
      </Link>
    </main>
  );
}
