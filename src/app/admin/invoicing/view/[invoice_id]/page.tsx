"use client";
import AuthGuard from "@/components/AuthGuard";
import { API_URL } from "@/_utilities/API_UTILS";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { parsePhoneNumberWithError } from "libphonenumber-js";

import React from "react";
import Link from "next/link";
export type InvoiceItem = {
  invoice_id: string;
  invoice_item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
};
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
export type Invoice = {
  client_id: string;
  created_at: string;
  amount_subtotal: number;
  payment_method: number;
  notes: string;
  amount_tax: number;
  amount_total: number;
  booking_id: string;
  invoice_id: string;
  due_date: string;
  payment_completed: boolean;
  paid_at: string;
  invoice_number: number;
  invoiceItems: InvoiceItem[];
};

type PageProps = {
  params: Promise<{
    invoice_id: string;
  }>;
};

export default function ViewInvoice() {
  const params = useParams<{ invoice_id: string }>();
  const invoice_id = params.invoice_id;
  //retrieve get invoice from the database in the structure Invoice{invoice: Invoice, invoice_items: InvoiceItem[]}
  const {
    data: invoice,
    isLoading,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["invoice"],
    queryFn: async () => {
      const response = await fetch(API_URL + `/invoicing/view/${invoice_id}`, {
        // This ensures cookies/authorization headers are sent
        credentials: "include",
      });

      if (!response.ok) throw new Error("Network response was not ok");

      return response.json();
    },
  });
  const created_at = new Date(invoice?.invoice.created_at).toLocaleString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
  const due_date = new Date(invoice?.invoice.due_date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  let payment_date = "N/A";
  if (invoice?.invoice.payment_completed) {
    payment_date = new Date(invoice?.invoice.paid_at).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  //prints out the current invoice
  async function print_invoice(invoice_id: string) {
    const response = await fetch(API_URL + `/invoicing/print/${invoice_id}`, {
      // This ensures cookies/authorization headers are sent
      credentials: "include",
    });

    if (!response.ok) throw new Error("Network response was not ok");

    console.log(response);
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
          Could not find invoice
        </div>
      </div>
    );
  return (
    <AuthGuard>
      <>
        <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
          <h1>INVOICE #{invoice?.invoice.invoice_number}</h1>
          <div className="flex gap-4">
            <Link href={`/admin/invoicing/edit/${invoice_id}`} passHref>
              <button className="border-2">EDIT</button>
            </Link>
            <button
              className="border-2"
              onClick={() => {
                window.open(API_URL + `/invoicing/print/${invoice_id}`);
                //print_invoice(invoice?.invoice.invoice_id);
              }}
            >
              PRINT
            </button>
          </div>
        </div>

        <div className="flex justify-center  mx-10  mb-80 p-6 border-2 items-center mt-30 flex-col ">
          <h2>Created at: {created_at}</h2>
          <span className="h-6" />
          <h2>CLIENT INFO</h2>
          <div className="border-2 p-2">
            <p>
              Name: {invoice?.client.first_name} {invoice?.client.last_name}
            </p>
            <p>
              Address: {invoice.client.address_street}
              {", "}
              {invoice.client.address_city}, {invoice?.client.address_state}
              {", "}
              {invoice.client.address_zip}, {invoice?.client.address_country}
            </p>
            <p>
              Phone:{" "}
              <span>
                {(() => {
                  try {
                    return parsePhoneNumberWithError(
                      invoice?.client.phone,
                    ).formatNational();
                  } catch {
                    return (
                      "*INVALID PHONE NUMBER: " +
                      '"' +
                      invoice?.client.phone +
                      '"'
                    );
                  }
                })()}
              </span>
            </p>
            <p>Email: {invoice.client.email}</p>
            <h2>client_id: {invoice?.invoice.client_id}</h2>
          </div>
          <span className="h-6" />
          <h2>INVOICE ITEMS</h2>
          <table className="table-auto border-separate border-spacing-4 border-2 ">
            <thead>
              <tr>
                <th> Item </th>
                <th>Quantity</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody className="">
              {invoice?.invoice_items?.map(
                (item: InvoiceItem, index: number) => (
                  <tr className="text-center" key={item.invoice_item_id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>${item.unit_price}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          <h2 className="">Subtotal: {invoice?.invoice.amount_subtotal}</h2>
          <h2 className="">Tax: {invoice?.invoice.amount_tax * 100}%</h2>
          <span className="h-6" />
          <h2>Due Date: {due_date}</h2>
          <span className="h-6" />
          <p>
            Payment Status:{" "}
            {invoice?.invoice.payment_completed ? (
              <span>Paid</span>
            ) : (
              <span>Unpaid</span>
            )}
          </p>
          <h2>Payment Date: {payment_date}</h2>
          <h2>Invoice_ID: {invoice?.invoice.invoice_id}</h2>
        </div>
      </>
    </AuthGuard>
  );
}
