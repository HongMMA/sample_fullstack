"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PostForm } from "@/components/PostForm";
import { getLoginId, isGuestLoginId } from "@/lib/auth";
import type { Post } from "@/lib/types";

type EditPostGuardProps = {
  post: Post;
};

export function EditPostGuard({ post }: EditPostGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const loginId = getLoginId();
    if (!loginId || isGuestLoginId(post.author) || loginId !== post.author) {
      router.replace(`/board/${post.id}`);
      return;
    }
    setAllowed(true);
  }, [post.author, post.id, router]);

  if (!allowed) {
    return <p className="text-sm text-muted">수정 권한을 확인하는 중...</p>;
  }

  return (
    <>
      <Header actionHref={`/board/${post.id}`} actionLabel="상세로" />
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">글 수정</h1>
        <p className="mt-2 text-muted">제목과 내용을 수정합니다.</p>
      </div>
      <PostForm mode="edit" post={post} />
    </>
  );
}
