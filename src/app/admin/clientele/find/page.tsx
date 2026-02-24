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
  const [rows, setRows] = useState<[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [toggleName, setToggleName] = useState(false);
  const [toggleEmail, setToggleEmail] = useState(false);
  const [togglePhone, setTogglePhone] = useState(false);
  const [toggleClient_ID, setToggleClient_ID] = useState(false);
  //SEARCH INPUTS
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [client_ID, setClient_ID] = useState("");
  //DEBOUNCED
  const debouncedFirstName = useDebouncedValue(firstName, 200);
  const debouncedLastName = useDebouncedValue(lastName, 200);
  const debouncedEmail = useDebouncedValue(email, 200);
  const debouncedPhone = useDebouncedValue(phone, 200);
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
        firstName.trim() === "" &&
        lastName.trim() === "" &&
        email.trim() === "" &&
        phone.trim() === "" &&
        client_ID.trim() === ""
      ) {
        return () => ac.abort();
      }
      const params = new URLSearchParams(
        Object.entries({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          client_id: client_ID.trim(),
        }).filter(([, v]) => v !== ""),
      );
      console.log("sending: ", params.toString());
      const res = await fetch(
        API_URL + `/clientele/find?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
        },
      )
        .then((res) => res.json())
        .then((json) => {
          //console.log(json);
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
    debouncedClient_ID,
  ]);

  return (
    <AuthGuard>
      <div className="flex items-start pl-[3vw] sm:pl-[6vw] flex-col">
        <h1 className="">FIND CLIENT </h1>
      </div>
      <div className="flex justify-center items-center flex-col gap-2 mt-30 px-8">
        <div className="flex w-[80vw] flex-wrap justify-center  gap-2">
          <button
            className={`border-2 p-1.5 ${toggleName ? "text-accent" : "text-foreground"} `}
            onClick={() => {
              if (toggleName) {
                setFirstName("");
                setLastName("");
              }
              setToggleName(!toggleName);
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
          {toggleName && (
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name..."
              className="  border px-3 py-2"
            />
          )}
          {toggleName && (
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
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

          {toggleClient_ID && (
            <input
              value={client_ID}
              onChange={(e) => setClient_ID(e.target.value)}
              placeholder="Client_ID..."
              className="  border px-3 py-2"
            />
          )}
        </div>
        {/*DISPLAY FOUND CLIENTS*/}
        <div className="mt-6 flex flex-col divide-y border-2">
          {rows.map(
            (r: {
              client_id: string;
              first_name: string;
              last_name: string;
            }) => (
              <div key={r.client_id} className="p-4">
                <Link href={`/admin/clientele/view/${r.client_id}`}>
                  {r.first_name} {r.last_name} {r.client_id}
                </Link>
              </div>
            ),
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
