"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/_utilities/API_UTILS";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function SearchBox() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const startYear = 2025;
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 5; // or whatever range you want

  const [rows, setRows] = useState<[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [toggleClientName, setToggleClientName] = useState(false);
  const [toggleDate, setToggleDate] = useState(false);
  const [toggleInvoiceNumber, setToggleInvoiceNumber] = useState(false);
  const [toggleInvoice_ID, setToggleInvoice_ID] = useState(false);
  const [toggleClient_ID, setToggleClient_ID] = useState(false);
  //SEARCH INPUTS
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoice_ID, setInvoice_ID] = useState("");
  const [client_ID, setClient_ID] = useState("");
  //DEBOUNCED
  const debouncedFirstName = useDebouncedValue(clientFirstName, 200);
  const debouncedLastName = useDebouncedValue(clientLastName, 200);
  const debouncedYear = useDebouncedValue(year, 200);
  const debouncedMonth = useDebouncedValue(month, 200);
  const debouncedInvoiceNumber = useDebouncedValue(invoiceNumber, 200);
  const debouncedInvoice_ID = useDebouncedValue(invoice_ID, 200);
  const debouncedClient_ID = useDebouncedValue(client_ID, 200);
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setRows([]);
    (async () => {
      setLoading(true);
      setErr(null);

      const params = new URLSearchParams(
        Object.entries({
          client_first_name: clientFirstName.trim(),
          client_last_name: clientLastName.trim(),
          year: year.trim(),
          month: month.trim(),
          invoice_number: invoiceNumber.trim(),
          invoice_id: invoice_ID.trim(),
          client_id: client_ID.trim(),
        }).filter(([, v]) => v !== ""),
      );
      console.log("sending: ", params.toString());
      const res = await fetch(
        API_URL + `/invoicing/find?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      )
        .then((res) => res.json())
        .then((json) => {
          console.log(json);
          setRows(json);
        })
        .catch((err) => alert("ERROR: " + err.message));
    })();

    return () => ac.abort();
  }, [
    debouncedFirstName,
    debouncedLastName,
    debouncedYear,
    debouncedMonth,
    debouncedInvoiceNumber,
    debouncedInvoice_ID,
    debouncedClient_ID,
  ]);

  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] md:pl-[10vw] flex-col">
        <h1 className="">FIND INVOICE </h1>
      </div>
      <div className="flex justify-center items-center flex-col gap-2 mt-30 px-8">
        <div className="flex  justify-center items-center gap-2">
          {/*search by client name, email, or phone number*/}

          {/*TODO search created_at by year -> by month -> by day*/}
          <button
            className={`border-2 p-1.5 ${toggleClientName ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleClientName) {
                setClientFirstName("");
                setClientLastName("");
              }
              setToggleClientName(!toggleClientName);
            }}
          >
            By Client Name
          </button>

          {/*TODO search created_at by year -> by month -> by day*/}
          <button
            className={`border-2 p-1.5 ${toggleDate ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleDate) {
                setYear("");
                setMonth("");
              }
              setToggleDate(!toggleDate);
            }}
          >
            By Date
          </button>

          <button
            className={`border-2 p-1.5 ${toggleInvoiceNumber ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleInvoiceNumber) {
                setInvoiceNumber("");
              }
              setToggleInvoiceNumber(!toggleInvoiceNumber);
            }}
          >
            Invoice Number
          </button>
          <button
            className={`border-2 p-1.5 ${toggleInvoice_ID ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleInvoice_ID) {
                setInvoice_ID("");
              }
              setToggleInvoice_ID(!toggleInvoice_ID);
            }}
          >
            Invoice_ID
          </button>
          <button
            className={`border-2 p-1.5 ${toggleClient_ID ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleClient_ID) {
                setClient_ID("");
              }
              setToggleClient_ID(!toggleClient_ID);
            }}
          >
            Client_ID
          </button>
        </div>
        <div className="flex justify-center items-center gap-2">
          {toggleClientName && (
            <input
              value={clientFirstName}
              onChange={(e) => setClientFirstName(e.target.value)}
              placeholder="First Name..."
              className="w-full rounded border px-3 py-2"
            />
          )}
          {toggleClientName && (
            <input
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Last Name..."
              className="w-full rounded border px-3 py-2"
            />
          )}
          {/*YEAR*/}
          {toggleDate && (
            <select
              className="w-full rounded-md border px-3 py-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select year</option>
              {Array.from(
                { length: endYear - startYear + 1 },
                (_, i) => startYear + i,
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
          {/*MONTH*/}
          {toggleDate && (
            <select
              className="border-2 rounded focus:outlrounded  px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Select month</option>
              {months.map((month, i) => (
                <option key={month} value={i + 1}>
                  {month}
                </option>
              ))}
            </select>
          )}

          {toggleInvoiceNumber && (
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="Invoice Number..."
              className="w-full rounded border px-3 py-2"
            />
          )}
          {toggleInvoice_ID && (
            <input
              value={invoice_ID}
              onChange={(e) => setInvoice_ID(e.target.value)}
              placeholder="Invoice_ID..."
              className="w-full rounded border px-3 py-2"
            />
          )}
          {toggleClient_ID && (
            <input
              value={client_ID}
              onChange={(e) => setClient_ID(e.target.value)}
              placeholder="Client_ID..."
              className="w-full rounded border px-3 py-2"
            />
          )}
        </div>

        <div className="mt-3 flex flex-col   divide-y rounded border-2">
          {rows.map((r) => (
            <div key={r} className="p-4">
              <Link href={`/admin/invoicing/view/${r}`}>{r}</Link>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
