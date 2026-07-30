"use client";

const TOKEN_KEY = "board_auth_token";
const LOGIN_ID_KEY = "board_login_id";
const COOKIE_NAME = "board_auth_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getLoginId() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(LOGIN_ID_KEY);
}

export function setAuthSession(accessToken: string, loginId: string) {
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(LOGIN_ID_KEY, loginId);
  document.cookie = `${COOKIE_NAME}=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LOGIN_ID_KEY);
  }
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function isGuestLoginId(loginId: string | null | undefined) {
  return Boolean(loginId?.startsWith("guest"));
}
