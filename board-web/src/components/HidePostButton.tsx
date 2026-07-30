"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { ApiError, updatePostHidden } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type HidePostButtonProps = {
  postId: number;
  hidden: boolean;
};

export function HidePostButton({ postId, hidden }: HidePostButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onToggle() {
    setError(null);
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/board");
      return;
    }

    const nextHidden = !hidden;
    const confirmMessage = nextHidden
      ? "이 게시글을 일반 사용자에게 숨길까요?"
      : "이 게시글을 다시 공개할까요?";
    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      try {
        await updatePostHidden(postId, nextHidden, accessToken);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("숨김 처리에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:bg-accent-soft/50 disabled:opacity-60"
      >
        {isPending ? "처리 중..." : hidden ? "게시글 공개" : "게시글 숨기기"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
