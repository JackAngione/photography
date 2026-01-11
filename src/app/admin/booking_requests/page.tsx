"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/_utilities/API_UTILS";
import DisplayBookingRequest from "@/app/admin/booking_requests/components/view_booking_request";

export interface BookingRequest {
  first_name: string;
  last_name: string;
  booking_id: string;
  created_at: string;
  phone: string | null;
  email: string | null;
  categories: string[] | null;
  comments: string | null;
  request?: unknown;
}

export default function PendingBookingsPage() {
  //retrieve all pending bookings from the database
  const { data: bookings } = useQuery({
    queryKey: ["pending_bookings"],
    queryFn: async () => {
      const response = await fetch(API_URL + "/pending_bookings", {
        // This ensures cookies/authorization headers are sent
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      return response.json();
    },
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBooking = bookings?.[activeIndex];
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">Booking </h1>
        <h1>Requests</h1>
      </div>
      <div className="flex mt-30  px-8 justify-center gap-5 items-start">
        <div className="flex-col mt-10 flex">
          <button
            className="outline-2 "
            onClick={() => {
              setActiveIndex((activeIndex + 1) % bookings?.length);
            }}
          >
            Next
          </button>
          <button
            className="outline-2 mt-4"
            onClick={() => {
              if (activeIndex !== 0) {
                setActiveIndex(activeIndex - 1);
              } else {
                setActiveIndex(bookings?.length - 1);
              }
            }}
          >
            Prev
          </button>
          <button className="outline-2 mt-8" onClick={() => {}}>
            Edit Invoice
          </button>
        </div>

        <div className="w-[80vw]">
          <DisplayBookingRequest request={activeBooking} />
        </div>
      </div>
      <p className="flex mt-4 justify-center items-center">
        {activeIndex + 1} of {bookings?.length} bookings
      </p>
    </AuthGuard>
  );
}
