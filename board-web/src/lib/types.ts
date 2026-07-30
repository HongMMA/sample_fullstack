export type Post = {
  id: number;
  title: string;
  content: string;
  author: string;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostCreateInput = {
  title: string;
  content: string;
};

export type PostUpdateInput = {
  title: string;
  content: string;
};

export type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
};

export type CommentCreateInput = {
  content: string;
  parentId?: number | null;
};

export type CommentUpdateInput = {
  content: string;
};

export type FieldError = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: FieldError[];
};

export type GameScore = {
  id: number;
  playerName: string;
  finalRound: number;
  rank: number;
  createdAt: string;
};

export type GameScoreCreateInput = {
  finalRound: number;
};

export type LoginInput = {
  loginId: string;
  password: string;
};

export type SignupInput = {
  loginId: string;
  password: string;
  passwordConfirm: string;
};

export type LoginResponse = {
  accessToken: string;
  loginId: string;
};

export type Me = {
  id: number;
  loginId: string;
};

export type PostWriteSetting = {
  enabled: boolean;
};
