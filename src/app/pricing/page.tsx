import Link from "next/link";

export default function Pricing() {
  return (
    <>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">PRICING</h1>
        <h2 className="text-xl md:text-3xl">and Information</h2>
      </div>
      <div className="flex flex-col justify-center items-center ">
        <div className="flex flex-col justify-center my-30 p-10 items-start ">
          <p>At the moment, pricing will be negotiated on a per-shoot basis.</p>
          <p className="mt-2"> Some combination of:</p>
          <ul className="list-disc pl-8">
            <li>
              $25-$60/hour of shooting, resulting in 4+ final edited photos
            </li>
            <li>Flat fee of $10-$30 per final edited photo</li>
          </ul>
          <p className="mt-2">
            Please{" "}
            <Link href="/#contact" className="!underline">
              contact me
            </Link>{" "}
            for more information on pricing and availability.
          </p>
        </div>
      </div>
    </>
  );
}
