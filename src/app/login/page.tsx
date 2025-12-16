"use client";
import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export default function Page() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(true);
  async function adminLogin() {
    const api_url = process.env.NEXT_PUBLIC_API_URL;
    await fetch(api_url + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: "admin", password: password }),
      credentials: "include",
    })
      .then((r) => {
        window.location.reload();
      })
      .catch((err) => {
        console.error("Login failed", err);
      });
  }
  if (useAuth().authorized) {
    return (
      <div className="flex-col flex justify-center mt-30 items-center">
        <p>Logged in</p>
        <p>ദ്ദി( • ᴗ - ) ✧</p>
      </div>
    );
  } else {
    return (
      <div className="flex justify-center items-center flex-col gap-2 mt-30">
        <button onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <img src="/icons/eye.svg" width={20} alt="hide password toggle" />
          ) : (
            <img
              src="/icons/eyeslash.svg"
              width={20}
              alt="hide password toggle"
            />
          )}
        </button>
        <input
          type={showPassword ? "password" : "text"}
          className="border-2 outline-none focus:border-accent"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="border-2 !py-1" onClick={adminLogin}>
          login
        </button>
      </div>
    );
  }
}
