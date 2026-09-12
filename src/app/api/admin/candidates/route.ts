import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ candidates });
}
