import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { PostActions } from "@/components/PostActions";
import { ApiError, getPost } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
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
      <Header actionHref="/board" actionLabel="목록으로" />
      <article className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <p className="text-sm text-muted">
          {post.author} · {formatDateTime(post.createdAt)}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-ink md:text-4xl">
          {post.title}
        </h1>
        <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-ink/90">
          {post.content}
        </div>
        <PostActions postId={post.id} author={post.author} />
      </article>
    </main>
  );
}
