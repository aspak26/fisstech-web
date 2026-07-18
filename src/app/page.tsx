import { redirect } from "next/navigation";

// proxy.ts already redirects unauthenticated requests to /login before this
// ever renders, so any request that reaches here has a valid session.
export default function RootPage() {
  redirect("/dashboard");
}
