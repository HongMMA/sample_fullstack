import Link from "next/link";
import { Header } from "@/components/Header";
import { PostForm } from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <main>
      <Header actionHref="/" actionLabel="목록으로" />
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">새 글 작성</h1>
        <p className="mt-2 text-muted">제목과 내용을 입력해 게시글을 등록합니다.</p>
      </div>
      <PostForm mode="create" />
      <div className="mt-6">
        <Link href="/" className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
