"use client";

import { useEffect, useRef } from "react";
import { incrementPostView } from "@/lib/api";
import { getAccessToken, getLoginId } from "@/lib/auth";

type PostViewTrackerProps = {
  postId: number;
  author: string;
};

export function PostViewTracker({ postId, author }: PostViewTrackerProps) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) {
      return;
    }

    const accessToken = getAccessToken();
    const loginId = getLoginId();
    if (!accessToken || !loginId || loginId === author) {
      return;
    }

    trackedRef.current = true;
    incrementPostView(postId, accessToken).catch(() => {
      trackedRef.current = false;
    });
  }, [postId, author]);

  return null;
}
