import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display mb-8 block text-lg font-semibold">
          ProtoLab
        </Link>
        {children}
      </div>
    </main>
  );
}
