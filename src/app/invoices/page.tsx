"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { API_URL } from "@/_utilities/API_UTILS";
import Link from "next/link";

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

export default function Invoices() {
  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">INVOICES </h1>
      </div>
      <div className="flex-col flex mt-30 px-8 justify-center gap-5 items-center">
        <Link className="border-2 p-1.5" href="/invoices/create">
          Create Invoice
        </Link>
        <Link className="border-2 p-1.5" href="/invoices/view">
          View/Find Invoices
        </Link>
      </div>
    </AuthGuard>
  );
}
