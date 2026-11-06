import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-7xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">This page is off the record</h1>
      <p className="max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/home">Back to home</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/booking/new">Book a session</Link>
        </Button>
      </div>
    </section>
  );
}
