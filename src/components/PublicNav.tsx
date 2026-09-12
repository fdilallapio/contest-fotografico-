"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/candidati", label: "Candidati" },
  { href: "/votazioni", label: "Votazioni" },
  { href: "/info-e-contatti", label: "Info e contatti" },
];

export default function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-comunita.jpeg"
            alt="ComUnità"
            width={1689}
            height={608}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>
        <div className="flex gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
                pathname === link.href ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
