import { notFound } from "next/navigation";
import { CommentSection } from "@/components/CommentSection";
import { Header } from "@/components/Header";
import { PostActions } from "@/components/PostActions";
import { PostViewTracker } from "@/components/PostViewTracker";
import { ApiError, getComments, getPost } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { getServerAccessToken } from "@/lib/server-auth";

type PostDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  const accessToken = await getServerAccessToken();
  let post;
  let comments;
  try {
    [post, comments] = await Promise.all([
      getPost(postId, accessToken),
      getComments(postId, accessToken),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main>
      <Header actionHref="/board" actionLabel="목록으로" />
      <PostViewTracker postId={post.id} author={post.author} />
      <article className="rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
        <p className="text-sm text-muted">
          {post.author} · {formatDateTime(post.createdAt)}
          {post.hidden && <span className="ml-2 text-danger">· 숨김 처리됨</span>}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight text-ink md:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-muted">
          댓글 {post.commentCount} · 조회 {post.viewCount} · 좋아요 {post.likeCount}
        </p>
        <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-ink/90">
          {post.content}
        </div>
        <PostActions
          postId={post.id}
          author={post.author}
          hidden={post.hidden}
          likeCount={post.likeCount}
          likedByMe={post.likedByMe}
        />
      </article>
      <CommentSection postId={post.id} initialComments={comments} />
    </main>
  );
}
