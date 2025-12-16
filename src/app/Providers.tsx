"use client"; // Mark as a Client Component for App Router

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React, { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient()); // Use useState to ensure a single instance per component lifecycle

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} />  Optional dev tools */}
    </QueryClientProvider>
  );
}
