"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PostForm } from "@/components/PostForm";
import { getPostWriteSetting } from "@/lib/api";
import { getLoginId, isSuperAdmin } from "@/lib/auth";

export default function NewPostPage() {
  const [canWrite, setCanWrite] = useState<boolean | null>(null);

  useEffect(() => {
    const admin = isSuperAdmin(getLoginId());
    getPostWriteSetting()
      .then((setting) => setCanWrite(setting.enabled || admin))
      .catch(() => setCanWrite(true));
  }, []);

  return (
    <main>
      <Header actionHref="/board" actionLabel="목록으로" />
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-ink">새 글 작성</h1>
        <p className="mt-2 text-muted">제목과 내용을 입력해 게시글을 등록합니다.</p>
      </div>
      {canWrite === null ? (
        <p className="text-sm text-muted">글쓰기 상태를 확인하는 중...</p>
      ) : canWrite ? (
        <PostForm mode="create" />
      ) : (
        <div className="rounded-3xl border border-danger/20 bg-danger-soft px-6 py-5 text-danger">
          현재 글쓰기가 비활성화되어 있습니다.
        </div>
      )}
      <div className="mt-6">
        <Link href="/board" className="text-sm text-muted underline-offset-4 hover:text-accent hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
