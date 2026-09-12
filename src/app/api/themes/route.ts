import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const themes = await prisma.theme.findMany({
    select: { slug: true, name: true, unlockDay: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ themes });
}
