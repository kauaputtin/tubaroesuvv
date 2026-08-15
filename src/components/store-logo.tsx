import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function StoreLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)} aria-label="Tubarões UVV — início">
      <Image
        src="/assets/logo-tubaroes.png"
        alt="Logo oficial da Atlética Tubarões UVV"
        width={72}
        height={72}
        priority
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      />
      <span className="hidden leading-none sm:block">
        <strong className="block text-lg font-black tracking-tight text-white">TUBARÕES</strong>
        <span className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-sky-300">Loja oficial UVV</span>
      </span>
    </Link>
  );
}

