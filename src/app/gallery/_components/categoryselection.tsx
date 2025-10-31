import Image from "next/image";
import useSWR from "swr";
import Link from "next/link";
import { Square } from "ldrs/react";
import "ldrs/react/Square.css";
import { API_URL, SWR_fetcher } from "@/_utilities/API_UTILS";

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
      <div className="flex pt-20 flex-col  justify-start items-start">
        <div className="flex-col flex pl-40">
          {data.map((category: string, index: number) => (
            <Link
              href={`/gallery/${category}`}
              key={index}
              className="text-4xl"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
