"use client";
import AuthGuard from "@/components/AuthGuard";
import { API_URL } from "@/_utilities/API_UTILS";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import React from "react";

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
  booking_number: number;
}

type PageProps = {
  params: Promise<{
    booking_id: string;
  }>;
};

export default function ViewBookingRequest() {
  const params = useParams<{ booking_id: string }>();
  const booking_id = params.booking_id;
  //retrieve get booking request from the database
  const {
    data: booking_request,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["booking_request"],
    queryFn: async () => {
      const response = await fetch(API_URL + `/booking/view/${booking_id}`, {
        // This ensures cookies/authorization headers are sent
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      return response.json();
    },
  });
  const created_at = new Date(booking_request?.created_at).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  async function changeCompletionStatus(status: boolean) {
    const res = await fetch(
      API_URL + "/booking/change_completion/" + booking_request?.booking_id,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: status }),
      },
    );
    const data = await res.json();
    if (!res.ok) {
      alert("Error changing Booking completion status: " + data.message);
    } else {
      alert("Completion Status Changed!");
      window.location.reload();
    }
  }
  if (isLoading)
    return (
      <div className="flex justify-center mt-30 items-center">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4">Loading...</div>
        </div>
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center items-center mt-30">
        <div className="animate-pulse flex space-x-4">
          Could not find booking request
        </div>
      </div>
    );
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1>BOOKING </h1>
        <h1>REQUEST #{booking_request?.booking_number}</h1>
        {booking_request?.completed ? (
          <button
            className=" border-2"
            onClick={() => {
              changeCompletionStatus(false).then((r) => {});
            }}
          >
            Mark Uncompleted
          </button>
        ) : (
          <button
            className="border-2"
            onClick={() => {
              changeCompletionStatus(true).then((r) => {});
            }}
          >
            Mark Completed
          </button>
        )}
      </div>

      {/*  "flex justify-center mx-10 mb-80 p-6 border-2 items-center mt-30 flex-col*/}
      <div className="flex-col border-2 p-6 flex justify-center gap-4 mx-10 mt-30 items-center ">
        <div className="flex-col flex justify-center items-center">
          <p>Booking_ID: {booking_request.booking_id}</p>
          <p>
            Created at: {new Date(booking_request.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex-col border-1 p-4 flex justify-center items-center">
          <p>First Name: {booking_request.first_name}</p>
          <p>Last Name: {booking_request.last_name}</p>
          <p>Phone: {booking_request.phone}</p>
          <p>Email: {booking_request.email}</p>
        </div>
        <div className="">
          Categories:{" "}
          {booking_request.categories?.map((category: any) => (
            <span key={category}>{category}, </span>
          ))}
        </div>
        <p>Comments: {booking_request?.comments}</p>
        <p>Completed: {booking_request?.completed.toString()}</p>
      </div>
    </AuthGuard>
  );
}
