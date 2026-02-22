"use client";
import useSWR from "swr";
import Link from "next/link";
import { Square } from "ldrs/react";
import "ldrs/react/Square.css";
import { API_URL, SWR_fetcher } from "@/_utilities/API_UTILS";
import PopupHint from "@/app/gallery/_components/popup_hint";

export default function CategorySelection() {
  const { data, error, isLoading } = useSWR(
    API_URL + "/getPhotoCategories",
    SWR_fetcher,
  );
  if (isLoading) {
    return (
      <div className="flex p-40 flex-col gap-12 justify-center items-center">
        <Square
          size="60"
          stroke="2"
          strokeLength="0.25"
          bgOpacity="0.1"
          speed="1.4"
          color="white"
        />
        <h2 className="">LOADING CATEGORIES...</h2>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex p-40 flex-col gap-12 justify-center items-center">
        <h2 className="">Error loading categories :(</h2>
      </div>
    );
  }
  return (
    <>
      <div className="flex-col flex ">
        <div className="mb-4">
          <PopupHint />
        </div>

        {data.map((category: string, index: number) => (
          <Link href={`/gallery/${category}`} key={index} className="text-4xl">
            {category}
          </Link>
        ))}
      </div>
    </>
  );
}
