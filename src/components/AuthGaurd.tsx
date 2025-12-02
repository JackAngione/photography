"use client";
import { useAuth } from "@/components/AuthContext";
import React from "react";

export default function AuthGaurd({ children }: { children: React.ReactNode }) {
  const authenticated = useAuth().authorized;
  if (!authenticated) {
    return <div></div>;
  } else {
    return <>{children}</>;
  }
}
