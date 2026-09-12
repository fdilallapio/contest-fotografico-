import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminNav from "@/components/admin/AdminNav";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
