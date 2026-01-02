import { redirect } from "next/navigation"

export default function ReportsPage() {
  // Redirect to dashboard as all reports functionality is now in Dashboard
  redirect("/dashboard")
}
