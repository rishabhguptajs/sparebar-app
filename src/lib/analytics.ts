import "server-only";
import { after } from "next/server";

// Product events sent from the server, keyed on the user id. These record what happened in the service
// (a generation, a payment), not how someone browsed. With no key set nothing is sent.
const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

type Props = Record<string, string | number | boolean | null | undefined>;

export function track(userId: string, event: string, properties: Props = {}) {
  if (!KEY) return;
  const send = () =>
    fetch(`${HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: KEY, event, distinct_id: userId, properties: { ...properties, source: "server" } }),
    }).catch(() => {});
  // after() keeps the request alive until the event is sent. Outside a request it throws, so send directly.
  try {
    after(send);
  } catch {
    void send();
  }
}
