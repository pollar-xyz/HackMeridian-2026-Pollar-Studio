import Image from "next/image";
import logoLight from "@/public/brand/logo-light.png";
import logoDark from "@/public/brand/logo-dark.png";
import mark from "@/public/brand/mark.png";
import markDark from "@/public/brand/mark-dark.png";

const HEIGHTS = { sm: 22, md: 28, lg: 36 } as const;

// Horizontal wordmark. Blue on light surfaces, white on dark surfaces and in dark mode.
// `light` forces the white version, for blue backgrounds in any theme.
export function Logo({ size = "md", light = false }: { size?: "sm" | "md" | "lg"; light?: boolean }) {
  const height = HEIGHTS[size];
  const width = Math.round((height * logoLight.width) / logoLight.height);
  const style = { height, width: "auto", maxWidth: "none" } as const;
  if (light) {
    return <Image src={logoDark} alt="Pollar" height={height} width={width} priority={size !== "sm"} className="shrink-0" style={style} />;
  }
  return (
    <>
      <Image src={logoLight} alt="Pollar" height={height} width={width} priority={size !== "sm"} className="shrink-0 dark:hidden" style={style} />
      <Image src={logoDark} alt="Pollar" height={height} width={width} priority={size !== "sm"} className="hidden shrink-0 dark:block" style={style} />
    </>
  );
}

// The polar bear mark alone, for tight spots. Same theme rule as the wordmark.
export function Mark({ size = 24, light = false, className = "" }: { size?: number; light?: boolean; className?: string }) {
  if (light) return <Image src={markDark} alt="" aria-hidden width={size} height={size} className={`shrink-0 ${className}`} />;
  return (
    <>
      <Image src={mark} alt="" aria-hidden width={size} height={size} className={`shrink-0 dark:hidden ${className}`} />
      <Image src={markDark} alt="" aria-hidden width={size} height={size} className={`hidden shrink-0 dark:block ${className}`} />
    </>
  );
}
