import PublicNav from "@/components/PublicNav";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <PublicNav />
      {children}
    </div>
  );
}
