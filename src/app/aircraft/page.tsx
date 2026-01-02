import { redirect } from "next/navigation"

export default function AircraftPage() {
  // Redirect to dashboard as all aircraft functionality is now in Dashboard
  redirect("/dashboard")
}
