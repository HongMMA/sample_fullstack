import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PostForm } from "@/components/PostForm";
import { ApiError, getPost } from "@/lib/api";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  let post;
  try {
    post = await getPost(postId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main>
      <Header actionHref={`/posts/${post.id}`} actionLabel="상세로" />
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">글 수정</h1>
        <p className="mt-2 text-muted">제목과 내용을 수정합니다.</p>
      </div>
      <PostForm mode="edit" post={post} />
    </main>
  );
}
