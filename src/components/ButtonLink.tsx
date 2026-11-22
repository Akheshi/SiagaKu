import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "go" | "plain";

const base =
  "inline-flex min-h-[52px] items-center justify-center gap-2.5 border-2 px-[22px] text-[17px] leading-none font-semibold";

const variants: Record<Variant, string> = {
  go: "border-sign bg-sign text-white hover:border-sign-deep hover:bg-sign-deep",
  plain: "border-ink bg-white text-ink hover:bg-ink hover:text-white",
};

export function buttonClass(variant: Variant = "plain", extra = "") {
  return `${base} ${variants[variant]} ${extra}`.trim();
}

type Props = ComponentProps<typeof Link> & { variant?: Variant };

export function ButtonLink({ variant = "plain", className = "", ...props }: Props) {
  return <Link {...props} className={buttonClass(variant, className)} />;
}
