import { cookies } from "next/headers";

const AUTH_COOKIE_NAME = "board_auth_token";

export async function getServerAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
