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
  const [toggleEmail, setToggleEmail] = useState(false);
  const [togglePhone, setTogglePhone] = useState(false);
  const [toggleDate, setToggleDate] = useState(false);
  const [toggleInvoiceNumber, setToggleInvoiceNumber] = useState(false);
  const [toggleInvoice_ID, setToggleInvoice_ID] = useState(false);
  const [toggleClient_ID, setToggleClient_ID] = useState(false);
  //SEARCH INPUTS
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoice_ID, setInvoice_ID] = useState("");
  const [client_ID, setClient_ID] = useState("");
  //DEBOUNCED
  const debouncedFirstName = useDebouncedValue(clientFirstName, 200);
  const debouncedLastName = useDebouncedValue(clientLastName, 200);
  const debouncedEmail = useDebouncedValue(email, 200);
  const debouncedPhone = useDebouncedValue(phone, 200);
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
      //reduces backend requests by aborting if all fields are blank
      if (
        clientFirstName.trim() === "" &&
        clientLastName.trim() === "" &&
        email.trim() === "" &&
        phone.trim() === "" &&
        year.trim() === "" &&
        month.trim() === "" &&
        invoiceNumber.trim() === "" &&
        invoice_ID.trim() === "" &&
        client_ID.trim() === ""
      ) {
        return () => ac.abort();
      }
      const params = new URLSearchParams(
        Object.entries({
          client_first_name: clientFirstName.trim(),
          client_last_name: clientLastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
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
    debouncedEmail,
    debouncedPhone,
    debouncedYear,
    debouncedMonth,
    debouncedInvoiceNumber,
    debouncedInvoice_ID,
    debouncedClient_ID,
  ]);

  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] sm:pl-[6vw] flex-col">
        <h1 className="">FIND INVOICE </h1>
      </div>
      <div className="flex justify-center items-center flex-col gap-2 mt-30 px-8">
        <div className="flex w-[80vw] flex-wrap justify-center  gap-2">
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
            Client Name
          </button>
          <button
            className={`border-2 p-1.5 ${toggleEmail ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleEmail) {
                setEmail("");
              }
              setToggleEmail(!toggleEmail);
            }}
          >
            Email
          </button>
          <button
            className={`border-2 p-1.5 ${togglePhone ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (togglePhone) {
                setPhone("");
              }
              setTogglePhone(!togglePhone);
            }}
          >
            Phone
          </button>
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
            Date
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
        <div className="flex mt-12 w-[80vw] flex-wrap justify-center  gap-2">
          {toggleClientName && (
            <input
              value={clientFirstName}
              onChange={(e) => setClientFirstName(e.target.value)}
              placeholder="First Name..."
              className="  border px-3 py-2"
            />
          )}
          {toggleClientName && (
            <input
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Last Name..."
              className="  border px-3 py-2"
            />
          )}
          {toggleEmail && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email..."
              className="  border px-3 py-2"
            />
          )}
          {togglePhone && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone..."
              className="  border px-3 py-2"
            />
          )}
          {/*YEAR*/}
          {toggleDate && (
            <select
              className="  border px-3 py-2"
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
              className="border  focus:outlrounded  px-3 py-2"
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
              className="  border px-3 py-2"
            />
          )}
          {toggleInvoice_ID && (
            <input
              value={invoice_ID}
              onChange={(e) => setInvoice_ID(e.target.value)}
              placeholder="Invoice_ID..."
              className="  border px-3 py-2"
            />
          )}
          {toggleClient_ID && (
            <input
              value={client_ID}
              onChange={(e) => setClient_ID(e.target.value)}
              placeholder="Client_ID..."
              className="  border px-3 py-2"
            />
          )}
        </div>

        <div className="mt-6 flex flex-col divide-y border-2">
          {rows.map((r: { invoice_id: string; invoice_number: number }) => (
            <div key={r.invoice_id} className="p-4">
              <Link href={`/admin/invoicing/view/${r.invoice_id}`}>
                #{r.invoice_number}, {r.invoice_id}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
