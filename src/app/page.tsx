import Image from "next/image";
import bgImage from "../../public/images/website_background.jpg";
import AnimatedButton from "@/components/ui/animatedButton";

export default function Home() {
  return (
    <>
      <div className="flex-col items-center justify-start">
        <div className="scale-x-65 origin-left">
          <h1 className="!font-matisse">JACK</h1>
          <h1 className=" !font-matisse">ANGIONE</h1>
        </div>

        <h1 className="!text-8xl ">PHOTOGRAPHY</h1>
      </div>
      <div>
        <AnimatedButton text="GALLERY" />
      </div>
    </>
  );
}
