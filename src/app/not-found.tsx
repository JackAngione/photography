import SpiralButton from "@/components/ui/marbledbutton";
import MarbledGradientButton from "@/components/ui/marbledbutton";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl ">404</h1>
      <p className="text-lg">Page not found.</p>
      <Link href="/" className="mt-4 underline">
        <MarbledGradientButton text="Go Home"></MarbledGradientButton>
      </Link>
    </div>
  );
}
