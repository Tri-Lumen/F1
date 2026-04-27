import { Suspense } from "react";
import Nav from "@/components/Nav";
import NavSessionLoader from "@/components/NavSessionLoader";

export default function StandardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionPill = (
    <Suspense fallback={null}>
      <NavSessionLoader />
    </Suspense>
  );

  return (
    <>
      <Nav sessionPill={sessionPill} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </>
  );
}
