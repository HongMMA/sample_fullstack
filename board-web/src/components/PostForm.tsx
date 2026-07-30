"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { ApiError, createPost, updatePost } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { Post } from "@/lib/types";

type Mode = "create" | "edit";

type PostFormProps = {
  mode: Mode;
  post?: Post;
};

type FormState = {
  title: string;
  content: string;
};

export function PostForm({ mode, post }: PostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<FormState>({
    title: post?.title ?? "",
    content: post?.content ?? "",
  });

  function onChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const accessToken = getAccessToken();
    if (!accessToken) {
      router.replace("/login?redirect=/board");
      return;
    }

    startTransition(async () => {
      try {
        if (mode === "create") {
          const created = await createPost(form, accessToken);
          router.push(`/board/${created.id}`);
          router.refresh();
          return;
        }

        if (!post) {
          throw new Error("수정할 게시글이 없습니다.");
        }

        await updatePost(
          post.id,
          {
            title: form.title,
            content: form.content,
          },
          accessToken
        );
        router.push(`/board/${post.id}`);
        router.refresh();
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
          setFieldErrors(
            Object.fromEntries(err.fieldErrors.map((item) => [item.field, item.message]))
          );
          return;
        }
        setError("저장 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-line bg-bg-elevated p-6 shadow-[var(--shadow)] md:p-8">
      <label className="block">
        <span className="mb-2 block text-sm text-muted">제목</span>
        <input
          value={form.title}
          onChange={(e) => onChange("title", e.target.value)}
          className="w-full rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          placeholder="제목을 입력하세요"
          maxLength={200}
          required
        />
        {fieldErrors.title && <p className="mt-2 text-sm text-danger">{fieldErrors.title}</p>}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-muted">내용</span>
        <textarea
          value={form.content}
          onChange={(e) => onChange("content", e.target.value)}
          className="min-h-56 w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 outline-none transition focus:border-accent"
          placeholder="내용을 입력하세요"
          required
        />
        {fieldErrors.content && <p className="mt-2 text-sm text-danger">{fieldErrors.content}</p>}
      </label>

      {error && (
        <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "저장 중..." : mode === "create" ? "등록" : "수정 완료"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-full border border-line bg-white px-5 py-2.5 text-sm text-ink transition hover:bg-accent-soft/50"
        >
          취소
        </button>
      </div>
    </form>
  );
}
