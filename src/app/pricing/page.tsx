import Link from "next/link";

export default function Pricing() {
  return (
    <>
      <div className="flex">
        <div className="flex-col text-right pl-[3vw] sm:pl-[6vw] ">
          <h1 className="">PRICING</h1>
          <h2 className="text-xl font-maison-galliard sm:text-3xl">
            and Information
          </h2>
        </div>
      </div>

      <div className="flex flex-col justify-center my-30  px-20 ">
        <div className="flex flex-col  justify-center">
          <h2 className="underline">Booking Category Details</h2>
          <ul className=" pl-8">
            <li>
              Portraiture: Environmental and/or Studio, Fashion, Headshots, Pets
            </li>
            <li>Real Estate: Residential, Commercial, Indoor, Outdoor</li>
            <li>Automotive: Cars, Motorcycles </li>
            <li>Event: Wedding, Concert, Sports, Corporate, Social etc.</li>
            <li>Product: Detail, Lifestyle (In-Use), Clothing, Packaging </li>
            <li>Other: Your vision doesn't quite fit the above </li>
          </ul>
        </div>
        <span className="mt-20"></span>
        <div className="flex flex-col justify-center   items-start ">
          <h2 className="underline">Pricing</h2>
          <p>At the moment, pricing will be negotiated on a per-shoot basis.</p>
          <p className="mt-2"> Some combination of:</p>
          <ul className="list-disc pl-8">
            <li>
              $25-$60/hour of shooting, resulting in 4+ final edited photos
            </li>
            <li>Flat fee of $10-$30 per final edited photo</li>
            <li>Additional fee for advanced retouching services</li>
          </ul>
          <p className="mt-2">
            Please{" "}
            <Link href="/#contact" className="underline!">
              contact me
            </Link>{" "}
            for more information on pricing and availability.
          </p>
        </div>
      </div>
    </>
  );
}
