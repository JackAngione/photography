import MarbledGradientButton from "@/components/ui/marbledbutton";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex-col items-center justify-start pl-[3vw] md:pl-[10vw]">
        <div className="scale-x-65 origin-left ">
          <h1 className="!font-matisse">JACK</h1>
          <h1 className=" !font-matisse">ANGIONE</h1>
        </div>

        <h1 className="!text-8xl ">PHOTOGRAPHY</h1>
      </div>
      <div className="relative flex justify-center">
        <Link href="/gallery">
          <MarbledGradientButton text="GALLERY" />
        </Link>
      </div>
    </>
  );
}
