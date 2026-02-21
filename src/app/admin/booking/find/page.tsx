"use client";
import React, { useEffect, useRef, useState } from "react";
import { API_URL } from "@/_utilities/API_UTILS";
import AuthGuard from "@/components/AuthGuard";
import Link from "next/link";

//sets a time delay for
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function FindBookingRequest() {
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
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + 5; // or whatever range you want

  const [rows, setRows] = useState<[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  //TOGGLES
  const [toggleClientName, setToggleClientName] = useState(false);
  const [toggleDate, setToggleDate] = useState(false);
  const [toggleBookingNumber, setToggleBookingNumber] = useState(false);
  const [toggleBooking_ID, setToggleBooking_ID] = useState(false);
  const [toggleEmail, setToggleEmail] = useState(false);
  const [togglePhone, setTogglePhone] = useState(false);
  //SEARCH INPUTS
  const [clientFirstName, setClientFirstName] = useState("");
  const [clientLastName, setClientLastName] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [bookingNumber, setBookingNumber] = useState("");
  const [booking_ID, setBooking_ID] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  //DEBOUNCED
  const debouncedFirstName = useDebouncedValue(clientFirstName, 200);
  const debouncedLastName = useDebouncedValue(clientLastName, 200);
  const debouncedYear = useDebouncedValue(year, 200);
  const debouncedMonth = useDebouncedValue(month, 200);
  const debouncedBookingNumber = useDebouncedValue(bookingNumber, 200);
  const debouncedBooking_ID = useDebouncedValue(booking_ID, 200);
  const debouncedEmail = useDebouncedValue(email, 200);
  const debouncedPhone = useDebouncedValue(phone, 200);
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
        bookingNumber.trim() === "" &&
        booking_ID.trim() === ""
      ) {
        return () => ac.abort();
      }
      const params = new URLSearchParams(
        Object.entries({
          first_name: clientFirstName.trim(),
          last_name: clientLastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          year: year.trim(),
          month: month.trim(),
          booking_number: bookingNumber.trim(),
          booking_id: booking_ID.trim(),
        }).filter(([, v]) => v !== ""),
      );
      console.log("sending: ", params.toString());
      await fetch(API_URL + `/booking/find?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => res.json())
        .then((json) => {
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
    debouncedBookingNumber,
    debouncedBooking_ID,
    debouncedEmail,
    debouncedPhone,
  ]);

  return (
    <AuthGuard>
      <div className="flex pl-[3vw] sm:pl-[6vw] flex-col">
        <h1 className="">FIND BOOKING REQUESTS </h1>
      </div>

      <div className="flex justify-center items-center flex-col gap-2 mt-30 px-8">
        <div className="flex  w-[80vw] flex-wrap justify-center gap-2">
          {/*search by creation date, */}
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
            Name
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
            className={`border-2 p-1.5 ${toggleBookingNumber ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleBookingNumber) {
                setBookingNumber("");
              }
              setToggleBookingNumber(!toggleBookingNumber);
            }}
          >
            Booking #
          </button>
          <button
            className={`border-2 p-1.5 ${toggleBooking_ID ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleBooking_ID) {
                setBooking_ID("");
              }
              setToggleBooking_ID(!toggleBooking_ID);
            }}
          >
            Booking_ID
          </button>
        </div>
        {/*input fields*/}
        <div className="flex mt-12 w-[80vw] flex-wrap justify-center gap-2">
          {toggleClientName && (
            <input
              value={clientFirstName}
              onChange={(e) => setClientFirstName(e.target.value)}
              placeholder="First Name..."
              className="border px-3 py-2"
            />
          )}
          {toggleClientName && (
            <input
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              placeholder="Last Name..."
              className="border px-3 py-2"
            />
          )}
          {toggleEmail && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email..."
              className="border px-3 py-2"
            />
          )}
          {togglePhone && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone..."
              className="border px-3 py-2"
            />
          )}
          {/*YEAR*/}
          {toggleDate && (
            <select
              className=" border px-3 py-2"
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
              className="border-2 focus:outlrounded  px-3 py-2"
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

          {toggleBookingNumber && (
            <input
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
              placeholder="Invoice Number..."
              className="border px-3 py-2"
            />
          )}
          {toggleBooking_ID && (
            <input
              value={booking_ID}
              onChange={(e) => setBooking_ID(e.target.value)}
              placeholder="Booking_ID..."
              className="border px-3 py-2"
            />
          )}
        </div>

        <div className="mt-6 flex flex-col divide-y rounded border-2">
          {rows.map((r: { booking_id: string; booking_number: number }) => (
            <div key={r.booking_id} className="p-4">
              <Link href={`/admin/booking/view/${r.booking_id}`}>
                #{r.booking_number}, {r.booking_id}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AuthGuard>
  );
}
