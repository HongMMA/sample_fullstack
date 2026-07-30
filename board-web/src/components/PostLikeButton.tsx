"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ApiError, togglePostLike } from "@/lib/api";
import { getAccessToken, getLoginId } from "@/lib/auth";

type PostLikeButtonProps = {
  postId: number;
  likeCount: number;
  likedByMe: boolean;
};

export function PostLikeButton({ postId, likeCount, likedByMe }: PostLikeButtonProps) {
  const router = useRouter();
  const [count, setCount] = useState(likeCount);
  const [liked, setLiked] = useState(likedByMe);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setCount(likeCount);
    setLiked(likedByMe);
  }, [likeCount, likedByMe]);

  useEffect(() => {
    setHasSession(Boolean(getAccessToken() && getLoginId()));
  }, []);

  function onToggle() {
    setError(null);
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace(`/login?redirect=/board/${postId}`);
      return;
    }

    startTransition(async () => {
      try {
        const updated = await togglePostLike(postId, accessToken);
        setCount(updated.likeCount);
        setLiked(updated.likedByMe);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("좋아요 처리에 실패했습니다.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={isPending}
        className={`rounded-full border px-4 py-2 text-sm transition disabled:opacity-60 ${
          liked
            ? "border-accent bg-accent text-white hover:brightness-110"
            : "border-line bg-white text-ink hover:bg-accent-soft/50"
        }`}
      >
        {isPending ? "처리 중..." : liked ? `좋아요 취소 · ${count}` : `좋아요 · ${count}`}
      </button>
      {!hasSession && <p className="text-xs text-muted">로그인 후 좋아요할 수 있습니다.</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
