import { prisma } from "@/lib/prisma";

export default async function AdminCandidatesPage() {
  const candidates = await prisma.candidate.findMany({
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Candidati</h1>
          <p className="mt-1 text-sm text-neutral-500">{candidates.length} candidature ricevute</p>
        </div>
        <a
          href="/api/admin/candidates/export"
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
        >
          Esporta CSV
        </a>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Cellulare</th>
              <th className="px-4 py-3 font-medium">Luogo</th>
              <th className="px-4 py-3 font-medium">Foto</th>
              <th className="px-4 py-3 font-medium">Candidatura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {candidates.map((c) => (
              <tr key={c.id} className="text-neutral-200">
                <td className="px-4 py-3">{c.firstName} {c.lastName}</td>
                <td className="px-4 py-3 text-neutral-400">{c.email}</td>
                <td className="px-4 py-3 text-neutral-400">{c.phone}</td>
                <td className="px-4 py-3 text-neutral-400">{c.location}</td>
                <td className="px-4 py-3">{c._count.photos}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {c.createdAt.toLocaleDateString("it-IT")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {candidates.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">Nessuna candidatura ancora.</p>
        )}
      </div>
    </div>
  );
}
