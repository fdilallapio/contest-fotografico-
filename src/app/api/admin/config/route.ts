import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

const ConfigSchema = z.object({
  uploadStart: z.string().datetime(),
  uploadEnd: z.string().datetime(),
  votingEnd: z.string().datetime(),
  eventDate: z.string().datetime().nullable(),
  eventLocation: z.string().max(300).nullable(),
});

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const config = await prisma.contestConfig.findFirst();
  return NextResponse.json({ config });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ConfigSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  if (new Date(data.uploadEnd) <= new Date(data.uploadStart)) {
    return NextResponse.json({ error: "uploadEnd deve essere dopo uploadStart" }, { status: 400 });
  }
  if (new Date(data.votingEnd) <= new Date(data.uploadEnd)) {
    return NextResponse.json({ error: "votingEnd deve essere dopo uploadEnd" }, { status: 400 });
  }

  const existing = await prisma.contestConfig.findFirst();
  const config = existing
    ? await prisma.contestConfig.update({
        where: { id: existing.id },
        data: {
          uploadStart: new Date(data.uploadStart),
          uploadEnd: new Date(data.uploadEnd),
          votingEnd: new Date(data.votingEnd),
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          eventLocation: data.eventLocation,
        },
      })
    : await prisma.contestConfig.create({
        data: {
          uploadStart: new Date(data.uploadStart),
          uploadEnd: new Date(data.uploadEnd),
          votingEnd: new Date(data.votingEnd),
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          eventLocation: data.eventLocation,
        },
      });

  return NextResponse.json({ config });
}
