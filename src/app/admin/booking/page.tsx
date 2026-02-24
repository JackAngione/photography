"use client";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

export default function BookingRequests() {
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] sm:pl-[6vw] flex-col">
        <h1 className="">BOOKING REQUESTS </h1>
      </div>
      <div className="flex-col flex mt-30 px-8 justify-center gap-5 items-center">
        <Link className="border-2 p-1.5" href="/admin/booking/pending">
          PENDING
        </Link>
        <Link className="border-2 p-1.5" href="/admin/booking/find">
          FIND
        </Link>
      </div>
    </AuthGuard>
  );
}
