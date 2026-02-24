"use client";
import AuthGuard from "@/components/AuthGuard";
import { API_URL } from "@/_utilities/API_UTILS";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { parsePhoneNumberWithError } from "libphonenumber-js";

import React from "react";
import Link from "next/link";

export type Client = {
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address_street: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_country: string | null;
  client_id: string;
  created_at: string;
};

export default function ViewClient() {
  const params = useParams<{ client_id: string }>();
  const client_id = params.client_id;
  //retrieve get invoice from the database in the structure Invoice{invoice: Invoice, invoice_items: InvoiceItem[]}
  const {
    data: client,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["client"],
    queryFn: async () => {
      const response = await fetch(API_URL + `/clientele/view/${client_id}`, {
        // This ensures cookies/authorization headers are sent
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      return response.json();
    },
  });
  const created_at = new Date(client?.created_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

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
          Could not find Client
        </div>
      </div>
    );
  return (
    <AuthGuard>
      <>
        <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
          <h1>CLIENT {client?.client_id}</h1>

          <Link href={`/admin/clientele/edit/${client_id}`} passHref>
            <button className="border-2">EDIT</button>
          </Link>
        </div>

        <div className="flex  justify-center  mx-10  mb-80 p-6 border-2 items-center mt-30 flex-col ">
          <div className="flex flex-col">
            <p>First Name: {client?.first_name}</p>
            <p>Last Name: {client.last_name}</p>
            <span className="h-6" />
            <p>
              Phone:{" "}
              <span>
                {(() => {
                  try {
                    return parsePhoneNumberWithError(
                      client?.phone,
                    ).formatNational();
                  } catch {
                    return (
                      "*INVALID PHONE NUMBER: " + '"' + client?.phone + '"'
                    );
                  }
                })()}
              </span>
            </p>
            <p>Email: {client?.email}</p>
            <span className="h-6" />
            <h2 className="underline">ADDRESS</h2>
            Street: {client?.address_street}
            <p>City: {client?.address_city}</p>
            <p>State: {client?.address_state}</p>
            <p>Zip: {client?.address_zip}</p>
            <p>Country: {client?.address_country}</p>
            <span className="h-6" />
            <h2>Client_ID: {client?.client_id}</h2>
            <h2>Created at: {created_at}</h2>
          </div>
        </div>
      </>
    </AuthGuard>
  );
}
