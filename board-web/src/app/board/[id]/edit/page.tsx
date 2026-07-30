import { notFound } from "next/navigation";
import { EditPostGuard } from "@/components/EditPostGuard";
import { ApiError, getPost } from "@/lib/api";

type EditPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    notFound();
  }

  let post;
  try {
    post = await getPost(postId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <main>
      <EditPostGuard post={post} />
    </main>
  );
}
