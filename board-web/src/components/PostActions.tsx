"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { getLoginId, isGuestLoginId } from "@/lib/auth";

type PostActionsProps = {
  postId: number;
  author: string;
};

export function PostActions({ postId, author }: PostActionsProps) {
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const loginId = getLoginId();
    setCanEdit(Boolean(loginId) && !isGuestLoginId(author) && loginId === author);
  }, [author]);

  if (!canEdit) {
    return null;
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      <Link
        href={`/board/${postId}/edit`}
        className="rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:bg-accent-soft/50"
      >
        수정
      </Link>
      <DeleteButton postId={postId} />
    </div>
  );
}
