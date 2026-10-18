"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// One cache for the whole app. Pages arrive server-rendered; this keeps what they showed, so moving
// between pages is instant and the data refreshes quietly in the background.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, gcTime: 10 * 60_000, refetchOnWindowFocus: true, retry: 1 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
