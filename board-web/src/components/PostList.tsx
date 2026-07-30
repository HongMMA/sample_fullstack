"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPostWriteSetting } from "@/lib/api";
import { getLoginId, isGuestLoginId, isSuperAdmin } from "@/lib/auth";
import type { Post } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

type PostListProps = {
  posts: Post[];
};

export function PostList({ posts }: PostListProps) {
  const [canWrite, setCanWrite] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loginId = getLoginId();
    const admin = isSuperAdmin(loginId);
    const guest = isGuestLoginId(loginId);
    setIsAdmin(admin);
    setIsGuest(guest);
    getPostWriteSetting()
      .then((setting) => setCanWrite(!guest && (setting.enabled || admin)))
      .catch(() => setCanWrite(!guest));
  }, []);

  if (posts.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-bg-elevated/70 px-8 py-16 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl text-ink">아직 글이 없습니다</p>
        <p className="mt-3 text-muted">
          {isGuest
            ? "게스트는 글을 작성할 수 없습니다. 로그인 후 이용해 주세요."
            : canWrite
              ? "첫 게시글을 작성해 보세요."
              : "현재 글쓰기가 비활성화되어 있습니다."}
        </p>
        {canWrite && (
          <Link
            href="/board/new"
            className="mt-8 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            글쓰기
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-3xl border border-line bg-bg-elevated shadow-[var(--shadow)]">
      {posts.map((post, index) => (
        <li key={post.id} className={index === 0 ? "" : "border-t border-line"}>
          <Link
            href={`/board/${post.id}`}
            className="group block px-6 py-5 transition hover:bg-accent-soft/40 md:px-8"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-medium text-ink transition group-hover:text-accent md:text-xl">
                    {post.title}
                  </h2>
                  {isAdmin && post.hidden && (
                    <span className="shrink-0 rounded-full border border-line bg-white px-2 py-0.5 text-xs text-muted">
                      숨김
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-muted">{post.content}</p>
                <p className="mt-2 text-xs text-muted">
                  댓글 {post.commentCount} · 조회 {post.viewCount} · 좋아요 {post.likeCount}
                </p>
              </div>
              <div className="shrink-0 text-sm text-muted md:text-right">
                <p>{post.author}</p>
                <p className="mt-1">{formatDateTime(post.createdAt)}</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
