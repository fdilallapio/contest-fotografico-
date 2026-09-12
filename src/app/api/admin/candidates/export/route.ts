import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });

  const header = ["Nome", "Cognome", "Email", "Cellulare", "Luogo", "Foto caricate", "Consenso GDPR", "Data candidatura"];
  const rows = candidates.map((c) => [
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.location,
    String(c._count.photos),
    c.gdprConsent ? "Sì" : "No",
    c.createdAt.toISOString(),
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidati-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
