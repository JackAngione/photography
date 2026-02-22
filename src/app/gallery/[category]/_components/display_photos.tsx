"use client";
import { API_URL } from "@/_utilities/API_UTILS";
import { useState } from "react";

interface DisplayPhotosProps {
  category: string;
  photos: Array<string>;
}

export default function DisplayPhotos({
  category,
  photos,
}: DisplayPhotosProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("null");
  return (
    <div className="grid gap-0.5 grid-cols-2 [@media(min-aspect-ratio:1/1)]:grid-cols-3">
      {photos.map((photo: string, index: number) => (
        <div
          key={index}
          className="w-[38vw] h-[38vw] relative [@media(min-aspect-ratio:1/1)]:w-[25vw] [@media(min-aspect-ratio:1/1)]:h-[25vw] overflow-hidden "
        >
          {/*<a
            target="_blank"
            className=""
            href={`${API_URL}/photo/${category}/high/${photo}`}
          >*/}
          {/*TODO: switch the thumbnails back to /low/photo */}
          <img
            src={`${API_URL}/photo/${category}/low/${photo}`}
            alt={`photo`}
            loading="lazy"
            className={"w-full z-1 h-full object-cover "}
            onClick={() => {
              setShowPreview(true);
              setSelectedPhoto(photo);
            }}
            onLoad={() => {
              console.log(photo + " loaded");
            }}
          />
        </div>
      ))}
      {showPreview && (
        <div
          /*Blurs the rest of the site when the image is open*/
          className="fixed flex flex-col justify-center w-screen h-screen backdrop-blur-sm items-center top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          onClick={() => {
            //click anywhere to close the preview
            setShowPreview(false);
          }}
        >
          <img
            src={`${API_URL}/photo/${category}/high/${selectedPhoto}`}
            alt={`photo`}
            className={"max-w-[80vw] max-h-[80vh] z-0"}
          />
          <div className="flex gap-0.5">
            <a
              target="_blank"
              className=""
              href={`${API_URL}/photo/${category}/high/${selectedPhoto}`}
            >
              <button className="bg-background ">High-Res</button>
            </a>
            <button
              className="bg-background"
              onClick={() => {
                setShowPreview(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
