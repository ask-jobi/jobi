import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  href?: string;
}
export function Logo({ 
  size = "md", 
  className,
  href = "/",
}: LogoProps) {
  const logoElement = (
    <div className="flex items-center overflow-visible px-2">
      <Image
        src="/jobi-logo/vector/default.svg"
        alt="Jobi Logo"
        width={size === "sm" ? 40 : size === "md" ? 64 : 96}
        height={size === "sm" ? 40 : size === "md" ? 64 : 96}
        className={cn("object-contain scale-150", className)}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity;">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
} 