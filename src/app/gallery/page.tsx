import CategorySelection from "@/app/gallery/_components/categoryselection";
import PopupHint from "@/app/gallery/_components/popup_hint";

export default function Page() {
  return (
    <div>
      <div className="flex items-start flex-col  ">
        <div className="flex flex-col justify-center items-center pl-[3vw] md:pl-[10vw]">
          <h1 className="">GALLERY</h1>
          <PopupHint />
        </div>
      </div>

      <div className="flex justify-center text-center items-center">
        <CategorySelection />
      </div>
    </div>
  );
}
