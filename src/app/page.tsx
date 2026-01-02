import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to dashboard as home page
  redirect("/dashboard")
}

