"use client";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

export default function BookingRequests() {
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">Booking Requests </h1>
      </div>
      <div className="flex-col flex mt-30 px-8 justify-center gap-5 items-center">
        <Link className="border-2 p-1.5" href="/admin/booking/pending">
          Pending
        </Link>
        <Link className="border-2 p-1.5" href="/admin/booking/find">
          Find
        </Link>
      </div>
    </AuthGuard>
  );
}
