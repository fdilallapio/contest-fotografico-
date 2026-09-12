import { prisma } from "@/lib/prisma";
import PhotoModerationGrid from "@/components/admin/PhotoModerationGrid";

export default async function AdminPhotosPage() {
  const themes = await prisma.theme.findMany({
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Moderazione foto</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Approva o rigetta le candidature prima della fase di voto.
        </p>
      </div>
      <PhotoModerationGrid themes={themes} />
    </div>
  );
}
