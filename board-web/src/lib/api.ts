import type {
  ApiErrorBody,
  Comment,
  CommentCreateInput,
  CommentUpdateInput,
  GameScore,
  GameScoreCreateInput,
  LoginInput,
  LoginResponse,
  Me,
  Post,
  PostCreateInput,
  PostUpdateInput,
  PostWriteSetting,
  SignupInput,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  fieldErrors: { field: string; message: string }[];

  constructor(status: number, message: string, fieldErrors: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = RequestInit & {
  accessToken?: string | null;
};

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(init?.accessToken ? { Authorization: `Bearer ${init.accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: init?.signal ?? AbortSignal.timeout(5000),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    throw new ApiError(
      response.status,
      body.message ?? "요청에 실패했습니다.",
      body.fieldErrors ?? []
    );
  }

  return data as T;
}

export function getPosts(accessToken?: string | null) {
  return request<Post[]>("/api/posts", { accessToken });
}

export function getPost(id: number, accessToken?: string | null) {
  return request<Post>(`/api/posts/${id}`, { accessToken });
}

export function createPost(input: PostCreateInput, accessToken: string) {
  return request<Post>("/api/posts", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updatePost(id: number, input: PostUpdateInput, accessToken: string) {
  return request<Post>(`/api/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updatePostHidden(id: number, hidden: boolean, accessToken: string) {
  return request<Post>(`/api/posts/${id}/hidden`, {
    method: "PUT",
    body: JSON.stringify({ hidden }),
    accessToken,
  });
}

export function deletePost(id: number, accessToken: string) {
  return request<void>(`/api/posts/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export function getComments(postId: number, accessToken?: string | null) {
  return request<Comment[]>(`/api/posts/${postId}/comments`, { accessToken });
}

export function createComment(postId: number, input: CommentCreateInput, accessToken: string) {
  return request<Comment>(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function updateComment(id: number, input: CommentUpdateInput, accessToken: string) {
  return request<Comment>(`/api/comments/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function deleteComment(id: number, accessToken: string) {
  return request<void>(`/api/comments/${id}`, {
    method: "DELETE",
    accessToken,
  });
}

export function getGameScores() {
  return request<GameScore[]>("/api/game/scores");
}

export function createGameScore(input: GameScoreCreateInput, accessToken: string) {
  return request<GameScore>("/api/game/scores", {
    method: "POST",
    body: JSON.stringify(input),
    accessToken,
  });
}

export function signup(input: SignupInput) {
  return request<LoginResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: LoginInput) {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginAsGuest() {
  return request<LoginResponse>("/api/auth/guest", {
    method: "POST",
  });
}

export function getMe(accessToken: string) {
  return request<Me>("/api/auth/me", {
    accessToken,
  });
}

export function getPostWriteSetting() {
  return request<PostWriteSetting>("/api/admin/settings/post-write");
}

export function updatePostWriteSetting(enabled: boolean, accessToken: string) {
  return request<PostWriteSetting>("/api/admin/settings/post-write", {
    method: "PUT",
    body: JSON.stringify({ enabled }),
    accessToken,
  });
}
