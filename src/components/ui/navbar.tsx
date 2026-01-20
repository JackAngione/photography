"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import Invoicing from "@/app/admin/invoicing/page";

export default function Navbar() {
  const { logout } = useAuth();
  return (
    <div className="flex justify-between">
      <AuthGuard>
        <nav className="flex flex-col justify-center items-start pl-8">
          <div className="flex gap-10">
            <Link className="hover:text-accent" href="/admin/booking">
              Booking
            </Link>
            <Link className="hover:text-accent" href="/admin/invoicing">
              Invoicing
            </Link>
          </div>

          <button className="hover:text-accent " onClick={logout}>
            Logout
          </button>
        </nav>
      </AuthGuard>
      <nav className="flex flex-col items-end pr-8">
        <Link className="hover:text-accent " href="/">
          HOME
        </Link>
        <Link className="hover:text-accent" href="/pricing">
          PRICING
        </Link>
        <Link className="hover:text-accent" href="/booking_form">
          BOOKING
        </Link>
      </nav>
    </div>
  );
}
