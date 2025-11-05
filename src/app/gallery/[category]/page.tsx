import { Metadata } from "next";
import { API_URL } from "@/_utilities/API_UTILS";
import DisplayPhotos from "@/app/gallery/[category]/_components/display_photos";

/*export async function generateStaticParams() {
  const categories = ["landscapes", "portraits", "weddings", "commercial"];

  return categories.map((category) => ({
    category: category,
  }));
}*/

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `${category} Gallery`,
    description: `View ${category} photos`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  //returns list of photo files in category
  const getPhotos = await fetch(API_URL + "/category/" + category);
  console.log(getPhotos);
  const photos = await getPhotos.json();
  return (
    <>
      <h1 className="uppercase pl-[3vw] pb-20 md:pl-[10vw]">{category}</h1>
      <div className="flex justify-center items-center pb-20">
        <DisplayPhotos category={category} photos={photos}></DisplayPhotos>
      </div>
    </>
  );
}
