"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type DeleteButtonProps = {
  postId: number;
};

export function DeleteButton({ postId }: DeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    const ok = window.confirm("이 게시글을 삭제할까요?");
    if (!ok) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/board");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deletePost(postId, accessToken);
        router.push("/board");
        router.refresh();
      } catch {
        setError("삭제에 실패했습니다.");
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={onDelete}
        disabled={isPending}
        className="rounded-full border border-danger/30 bg-danger-soft px-4 py-2 text-sm text-danger transition hover:brightness-95 disabled:opacity-60"
      >
        {isPending ? "삭제 중..." : "삭제"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
