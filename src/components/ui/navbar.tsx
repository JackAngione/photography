"use client";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import AuthGaurd from "@/components/AuthGaurd";

export default function Navbar() {
  const { logout } = useAuth();
  return (
    <div className="flex justify-between">
      <AuthGaurd>
        <nav className="flex flex-col justify-center items-start pl-8">
          <Link className="hover:text-accent" href="/pending_bookings">
            ADMIN PANEL
          </Link>
          <button className="hover:text-accent " onClick={logout}>
            Logout
          </button>
        </nav>
      </AuthGaurd>
      <nav className="flex flex-col items-end pr-8">
        <Link className="hover:text-accent " href="/">
          HOME
        </Link>
        <Link className="hover:text-accent" href="/pricing">
          PRICING
        </Link>
        <Link className="hover:text-accent" href="/booking">
          BOOKING
        </Link>
      </nav>
    </div>
  );
}
