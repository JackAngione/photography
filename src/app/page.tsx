import CategorySelection from "@/app/gallery/_components/categoryselection";
import PixelGrid from "@/components/pixelatedGrid";
import MarbledGradientButton from "@/components/ui/marbledbutton";
import ContactPage from "@/app/contact/page";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="flex ">
        {/*<Image src="/icons/AA_LOGO.svg" alt="logo" width={600} height={200} />*/}
        <div className="flex-col pl-[3vw] sm:pl-[6vw] ">
          <h1 className="text-right">ALEXANDER</h1>
          <h1 className="text-right">ANGIONE</h1>
        </div>

        {/*<h1 className="origin-left">PHOTOGRAPHY</h1>*/}
      </div>

      <div className="flex flex-col my-30 p-10 justify-center text-center items-center">
        <CategorySelection />
      </div>

      <PixelGrid />
      {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/gallery" className="">
            <MarbledGradientButton text="GALLERY" />
          </Link>
        </div>*/}

      <div className="my-30" id="contact">
        <ContactPage />
      </div>
      {/*<footer className="flex justify-center">
        NextJS | Axum | PostgreSQL
      </footer>*/}
    </>
  );
}
