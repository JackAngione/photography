import { API_URL } from "@/_utilities/API_UTILS";

interface DisplayPhotosProps {
  category: string;
  photos: Array<string>;
}

export default function DisplayPhotos({
  category,
  photos,
}: DisplayPhotosProps) {
  return (
    <div className="grid gap-1 grid-cols-2 [@media(min-aspect-ratio:1/1)]:grid-cols-3">
      {photos.map((photo: string, index: number) => (
        <div
          key={index}
          className="w-[38vw] h-[38vw] [@media(min-aspect-ratio:1/1)]:w-[25vw] [@media(min-aspect-ratio:1/1)]:h-[25vw] overflow-hidden rounded-sm "
        >
          <a
            target="_blank"
            className=""
            href={`${API_URL}/photo/${category}/high/${photo}`}
          >
            {/*TODO: switch the thumbnails back to /low/photo */}
            <img
              src={`${API_URL}/photo/${category}/low/${photo}`}
              alt={`photo`}
              className={"w-full h-full object-cover "}
            />
          </a>
        </div>
      ))}
    </div>
  );
}
