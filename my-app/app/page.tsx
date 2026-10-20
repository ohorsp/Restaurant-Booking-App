import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold tracking-tight">Big Al&apos;s Pizza</h1>
      <nav className="flex flex-col gap-3" aria-label="Guest tasks">
        <Button
          size="lg"
          className="h-12 w-full text-base"
          nativeButton={false}
          render={<Link href="/menu" />}
        >
          View menu
        </Button>
        <Button
          size="lg"
          className="h-12 w-full text-base"
          nativeButton={false}
          render={<Link href="/reserve" />}
        >
          Make a reservation
        </Button>
        <Button size="lg" className="h-12 w-full text-base">
          Takeaway order
        </Button>
      </nav>
    </main>
  );
}
