import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

function isSafeSegment(value: string) {
  return Boolean(value) && !value.includes("..") && !value.includes("/") && !value.includes("\\");
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ themeCode: string; fileName: string }> }
) {
  const { themeCode, fileName } = await context.params;
  if (!isSafeSegment(themeCode) || !isSafeSegment(fileName)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const upstreamUrl = `${API_URL}/api/gacha/media/${encodeURIComponent(themeCode)}/${encodeURIComponent(fileName)}`;
  const upstream = await fetch(upstreamUrl, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
