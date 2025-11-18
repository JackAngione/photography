import SpiralButton from "@/components/ui/marbledbutton";
import MarbledGradientButton from "@/components/ui/marbledbutton";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl ">404</h1>
      <p className="text-lg">Page not found.</p>
      <Link href="/" className="mt-4 underline">
        <MarbledGradientButton width={300} height={150}>
          <span className="absolute inset-0 flex items-center justify-center font-matisse text-center mix-blend-difference text-white text-[3.75rem] wrap-anywhere ">
            Go Home
          </span>
        </MarbledGradientButton>
      </Link>
    </div>
  );
}
