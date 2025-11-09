import CategorySelection from "@/app/gallery/_components/categoryselection";
import PixelGrid from "@/components/pixelatedGrid";
import Link from "next/link";
import MarbledGradientButton from "@/components/ui/marbledbutton";
import ContactPage from "@/app/contact/page";

export default function Home() {
  return (
    <>
      <div className="flex-col  items-center justify-start pl-[3vw] md:pl-[10vw]">
        <div className="scale-x-65 origin-left ">
          <h1 className="!font-matisse ">JACK</h1>
          <h1 className=" !font-matisse">ANGIONE</h1>
        </div>

        <h1 className="">PHOTOGRAPHY</h1>
      </div>

      <div className="flex flex-col my-30 p-10 justify-center text-center items-center">
        <CategorySelection />
      </div>

      <div className="relative mt-[20vh]">
        <PixelGrid />
        {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/gallery" className="">
            <MarbledGradientButton text="GALLERY" />
          </Link>
        </div>*/}
      </div>
      <div className="my-30">
        <ContactPage />
      </div>
    </>
  );
}
