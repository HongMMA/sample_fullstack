"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DeleteButton } from "@/components/DeleteButton";
import { HidePostButton } from "@/components/HidePostButton";
import { getLoginId, isGuestLoginId, isSuperAdmin } from "@/lib/auth";

type PostActionsProps = {
  postId: number;
  author: string;
  hidden: boolean;
};

export function PostActions({ postId, author, hidden }: PostActionsProps) {
  const [canEdit, setCanEdit] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loginId = getLoginId();
    setCanEdit(Boolean(loginId) && !isGuestLoginId(author) && loginId === author);
    setIsAdmin(isSuperAdmin(loginId));
  }, [author]);

  if (!canEdit && !isAdmin) {
    return null;
  }

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-6">
      {canEdit && (
        <>
          <Link
            href={`/board/${postId}/edit`}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:bg-accent-soft/50"
          >
            수정
          </Link>
          <DeleteButton postId={postId} />
        </>
      )}
      {isAdmin && <HidePostButton postId={postId} hidden={hidden} />}
    </div>
  );
}
