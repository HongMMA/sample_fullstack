import Link from "next/link";
import { ReactionGame } from "@/components/ReactionGame";

export default function GamePage() {
  return (
    <main>
      <header className="mb-10 flex items-end justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="mb-2 text-sm tracking-[0.18em] text-muted uppercase">Local Board</p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink md:text-5xl">
            반응 속도 게임
          </h1>
        </div>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-line bg-bg-elevated px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
        >
          게시판으로
        </Link>
      </header>
      <ReactionGame />
    </main>
  );
}
