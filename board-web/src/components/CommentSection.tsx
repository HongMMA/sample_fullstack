"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createComment, deleteComment, updateComment } from "@/lib/api";
import { getAccessToken, getLoginId, isGuestLoginId } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Comment } from "@/lib/types";

type CommentSectionProps = {
  postId: number;
  initialComments: Comment[];
};

export function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [loginId, setLoginId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    setLoginId(getLoginId());
  }, []);

  function refresh() {
    router.refresh();
  }

  function onSubmitRoot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace(`/login?redirect=/board/${postId}`);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createComment(postId, { content: trimmed }, accessToken);
        setContent("");
        refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("댓글 등록에 실패했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-ink">
        댓글 {countComments(comments)}
      </h2>

      <form onSubmit={onSubmitRoot} className="mt-6 space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-24 w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          placeholder="댓글을 입력하세요"
          maxLength={2000}
          required
        />
        {error && (
          <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "등록 중..." : "댓글 등록"}
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {comments.length === 0 ? (
          <li className="text-sm text-muted">아직 댓글이 없습니다. 첫 댓글을 남겨 보세요.</li>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              loginId={loginId}
              depth={0}
              onChanged={refresh}
            />
          ))
        )}
      </ul>
    </section>
  );
}

type CommentItemProps = {
  comment: Comment;
  postId: number;
  loginId: string | null;
  depth: number;
  onChanged: () => void;
};

function CommentItem({ comment, postId, loginId, depth, onChanged }: CommentItemProps) {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [editContent, setEditContent] = useState(comment.content);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage =
    Boolean(loginId) && !isGuestLoginId(comment.author) && loginId === comment.author;

  function requireToken() {
    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace(`/login?redirect=/board/${postId}`);
      return null;
    }
    return accessToken;
  }

  function onReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const accessToken = requireToken();
    if (!accessToken) return;

    const trimmed = replyContent.trim();
    if (!trimmed) {
      setError("답글 내용을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await createComment(
          postId,
          { content: trimmed, parentId: comment.id },
          accessToken
        );
        setReplyContent("");
        setIsReplying(false);
        onChanged();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("답글 등록에 실패했습니다.");
      }
    });
  }

  function onEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const accessToken = requireToken();
    if (!accessToken) return;

    const trimmed = editContent.trim();
    if (!trimmed) {
      setError("댓글 내용을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      try {
        await updateComment(comment.id, { content: trimmed }, accessToken);
        setIsEditing(false);
        onChanged();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("댓글 수정에 실패했습니다.");
      }
    });
  }

  function onDelete() {
    if (!window.confirm("이 댓글을 삭제할까요? 답글도 함께 삭제됩니다.")) {
      return;
    }
    setError(null);
    const accessToken = requireToken();
    if (!accessToken) return;

    startTransition(async () => {
      try {
        await deleteComment(comment.id, accessToken);
        onChanged();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          return;
        }
        setError("댓글 삭제에 실패했습니다.");
      }
    });
  }

  return (
    <li className={depth > 0 ? "ml-4 border-l border-line pl-4 md:ml-6 md:pl-6" : undefined}>
      <article className="rounded-2xl border border-line/70 bg-white/70 px-4 py-4">
        <p className="text-sm text-muted">
          {comment.author} · {formatDateTime(comment.createdAt)}
        </p>

        {isEditing ? (
          <form onSubmit={onEdit} className="mt-3 space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-20 w-full resize-y rounded-2xl border border-line bg-white px-3 py-2 outline-none transition focus:border-accent"
              maxLength={2000}
              required
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "저장 중..." : "저장"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                  setError(null);
                }}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm transition hover:bg-accent-soft/50"
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-ink/90">{comment.content}</p>
        )}

        {!isEditing && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setIsReplying((prev) => !prev);
                setError(null);
              }}
              className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink transition hover:bg-accent-soft/50"
            >
              답글
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setIsReplying(false);
                    setEditContent(comment.content);
                    setError(null);
                  }}
                  className="rounded-full border border-line bg-white px-3 py-1 text-xs text-ink transition hover:bg-accent-soft/50"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={isPending}
                  className="rounded-full border border-danger/30 bg-white px-3 py-1 text-xs text-danger transition hover:bg-danger-soft disabled:opacity-60"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}

        {isReplying && (
          <form onSubmit={onReply} className="mt-3 space-y-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-20 w-full resize-y rounded-2xl border border-line bg-white px-3 py-2 outline-none transition focus:border-accent"
              placeholder="답글을 입력하세요"
              maxLength={2000}
              required
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "등록 중..." : "답글 등록"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsReplying(false);
                  setReplyContent("");
                  setError(null);
                }}
                className="rounded-full border border-line bg-white px-4 py-1.5 text-sm transition hover:bg-accent-soft/50"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-3 rounded-2xl border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
      </article>

      {comment.replies.length > 0 && (
        <ul className="mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              loginId={loginId}
              depth={depth + 1}
              onChanged={onChanged}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function countComments(comments: Comment[]): number {
  return comments.reduce((sum, comment) => sum + 1 + countComments(comment.replies), 0);
}
