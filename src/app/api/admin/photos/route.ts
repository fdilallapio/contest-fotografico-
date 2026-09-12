import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const themeSlug = req.nextUrl.searchParams.get("theme");

  const photos = await prisma.photo.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(themeSlug ? { theme: { slug: themeSlug } } : {}),
    },
    include: {
      theme: { select: { slug: true, name: true } },
      candidate: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ photos });
}
