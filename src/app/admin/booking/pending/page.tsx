"use client";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/_utilities/API_UTILS";
import BookingRequestPreview from "@/app/admin/booking/pending/components/booking_request_preview";

export default function PendingBookingsPage() {
  //retrieve all pending bookings from the database
  const { data: bookings } = useQuery({
    queryKey: ["pending_bookings"],
    queryFn: async () => {
      const response = await fetch(API_URL + "/booking/get_pending", {
        // This ensures cookies/authorization headers are sent
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      return response.json();
    },
  });
  async function markCompleted() {
    const res = await fetch(
      API_URL + "/booking/change_completion/" + activeBooking?.booking_id,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: true }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      alert("Error marking Booking as completed: " + data.message);
    } else {
      alert("Booking marked as completed!");
      window.location.reload();
    }
  }
  const [activeIndex, setActiveIndex] = useState(0);
  const activeBooking = bookings?.[activeIndex];
  return (
    <AuthGuard>
      <div className="flex flex-col  pl-[3vw] sm:pl-[6vw] 2xl:flex-row ">
        <h1 className="mr-6">PENDING</h1>
        <h1 className="mr-6">BOOKING </h1>
        <h1 className="mr-6">REQUESTS</h1>
      </div>
      <div className="flex mt-30  px-8 justify-center gap-5 items-start">
        <div className="flex-col mt-10 flex">
          <button
            className="border-2 "
            onClick={() => {
              setActiveIndex((activeIndex + 1) % bookings?.length);
            }}
          >
            Next
          </button>
          <button
            className="border-2 mt-4"
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
          <span className="h-4" />

          <button
            className="border-2 mt-8"
            onClick={() => {
              const confirmed = window.confirm(
                "Mark Current Booking as Complete?",
              );
              if (confirmed) {
                markCompleted().then(() => {});
              }
            }}
          >
            Mark As Complete
          </button>
        </div>

        <div className="w-[80vw]">
          <BookingRequestPreview request={activeBooking} />
        </div>
      </div>
      <p className="flex mt-4 justify-center items-center">
        {activeIndex + 1} of {bookings?.length} bookings
      </p>
      <p className="mb-20" />
    </AuthGuard>
  );
}
