import Link from "next/link";
import { Bot, GitBranch, Rocket, Sparkles } from "lucide-react";

const integrations = [
  { label: "Gemini planning", Icon: Bot },
  { label: "GitHub integration", Icon: GitBranch },
  { label: "Prototype milestones", Icon: Sparkles },
  { label: "Ship-ready demos", Icon: Rocket },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-8">
      <div className="landing-ambient" aria-hidden="true" />
      <div className="grid w-full max-w-5xl overflow-visible md:min-h-[560px] md:grid-cols-[0.98fr_0.86fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden rounded-[1.5rem] bg-foreground p-8 text-primary-foreground md:flex">
          <div className="absolute inset-0 opacity-20 [background:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px)_0_0/100%_36px]" />
          <div className="absolute -left-20 top-12 h-60 w-60 rounded-full border border-accent/40" />
          <div className="absolute bottom-10 right-10 h-44 w-44 rounded-full border border-primary-foreground/20" />

          <div className="relative">
            <Link href="/" className="font-display text-xl font-semibold">
              ProtoLab
            </Link>
            <p className="mt-7 max-w-lg font-display text-4xl font-semibold leading-[1.05]">
              Build real demo projects and ship them with your stack.
            </p>
            <p className="mt-5 max-w-sm text-xs leading-6 text-primary-foreground/72">
              Turn coursework into prototypes, documentation, GitHub milestones, and lecturer-ready
              demos with connected AI and repository workflows.
            </p>
          </div>

          <div className="relative grid gap-2.5">
            {integrations.map(({ label, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-primary-foreground/12 bg-primary-foreground/8 px-3.5 py-2.5 text-xs text-primary-foreground/84"
              >
                <Icon aria-hidden="true" className="size-3.5 text-accent" />
                {label}
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[560px] items-center justify-center px-5 py-8 sm:px-10 md:pl-14">
          <div className="w-full max-w-sm">
            <Link href="/" className="font-display mb-7 block text-center text-lg font-semibold md:hidden">
              ProtoLab
            </Link>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
