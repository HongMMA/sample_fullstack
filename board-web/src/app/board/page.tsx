import { Header } from "@/components/Header";
import { PostList } from "@/components/PostList";
import { getPosts } from "@/lib/api";
import { getServerAccessToken } from "@/lib/server-auth";
import type { Post } from "@/lib/types";

export default async function BoardPage() {
  let posts: Post[] = [];
  let error: string | null = null;
  const accessToken = await getServerAccessToken();

  try {
    posts = await getPosts(accessToken);
  } catch {
    error = "게시글 목록을 불러오지 못했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.";
  }

  return (
    <main>
      <Header />
      {error ? (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft px-6 py-5 text-danger">
          {error}
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </main>
  );
}
