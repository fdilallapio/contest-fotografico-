import { PrismaClient } from "@prisma/client";
import { THEME_UNLOCK_SCHEDULE } from "../src/lib/contest-phase";

const prisma = new PrismaClient();

const THEMES: { slug: string; name: string; unlockDay: 1 | 2 | 3 }[] = [
  { slug: "sanita", name: "Sanità", unlockDay: 1 },
  { slug: "urbanistica", name: "Urbanistica", unlockDay: 1 },
  { slug: "agricoltura", name: "Agricoltura", unlockDay: 2 },
  { slug: "rigenerazione-urbana", name: "Rigenerazione Urbana", unlockDay: 2 },
  { slug: "sport", name: "Sport", unlockDay: 3 },
  { slug: "lavoro", name: "Lavoro", unlockDay: 3 },
];

async function main() {
  // sanity check: seed themes must match the unlock schedule in contest-phase.ts
  for (const [day, slugs] of Object.entries(THEME_UNLOCK_SCHEDULE)) {
    for (const slug of slugs) {
      const t = THEMES.find((t) => t.slug === slug);
      if (!t || t.unlockDay !== Number(day)) {
        throw new Error(`Theme schedule mismatch for "${slug}" on day ${day}`);
      }
    }
  }

  for (const [i, theme] of THEMES.entries()) {
    await prisma.theme.upsert({
      where: { slug: theme.slug },
      update: { name: theme.name, unlockDay: theme.unlockDay, order: i },
      create: { ...theme, order: i },
    });
  }

  const existingConfig = await prisma.contestConfig.findFirst();
  if (!existingConfig) {
    const now = new Date();
    const uploadStart = now;
    const uploadEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const votingEnd = new Date(uploadEnd.getTime() + 3 * 24 * 60 * 60 * 1000);

    await prisma.contestConfig.create({
      data: {
        uploadStart,
        uploadEnd,
        votingEnd,
        eventDate: null,
        eventLocation: null,
      },
    });
    console.log("Created default ContestConfig: upload window starts now, 10 days upload + 3 days voting.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
