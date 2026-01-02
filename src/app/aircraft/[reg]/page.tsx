import { redirect } from "next/navigation"

export default function AircraftDetailPage() {
  // Redirect to dashboard as all aircraft functionality is now in Dashboard
  redirect("/dashboard")
}
