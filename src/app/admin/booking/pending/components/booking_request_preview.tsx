"use client";
import { BookingRequest } from "@/app/admin/booking/view/[booking_id]/page";
import AuthGuard from "@/components/AuthGuard";

interface DisplayBookingProps {
  request: BookingRequest;
}

export default function BookingRequestPreview({
  request,
}: DisplayBookingProps) {
  if (request == null) return <div>No pending booking...</div>;
  return (
    <AuthGuard>
      <div className="flex-col border-2 p-6 flex justify-center gap-4 items-start ">
        <div className="flex-col">
          <p className="text-xl">Booking #: {request.booking_number}</p>
          <p>Booking_ID: {request.booking_id}</p>

          <p>Created at: {new Date(request.created_at).toLocaleString()}</p>
        </div>
        <div className="flex-col">
          <p>First Name: {request.first_name}</p>
          <p>Last Name: {request.last_name}</p>
          <p>Phone: {request.phone}</p>
          <p>Email: {request.email}</p>
        </div>
        <div className="flex-col text-xl">
          Categories:{" "}
          {request.categories?.map((category: any) => (
            <span key={category}>{category}, </span>
          ))}
          <p>Comments: {request.comments}</p>
        </div>
      </div>
    </AuthGuard>
  );
}
