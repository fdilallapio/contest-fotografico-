import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.contestConfig.findFirst();
  if (!config) {
    return NextResponse.json({ error: "Contest non configurato" }, { status: 404 });
  }
  return NextResponse.json({
    config: {
      uploadStart: config.uploadStart.toISOString(),
      uploadEnd: config.uploadEnd.toISOString(),
      votingEnd: config.votingEnd.toISOString(),
      eventDate: config.eventDate ? config.eventDate.toISOString() : null,
      eventLocation: config.eventLocation,
    },
  });
}
