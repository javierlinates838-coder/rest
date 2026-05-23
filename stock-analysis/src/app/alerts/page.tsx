import { redirect } from "next/navigation";

/** Signal Wire removed from nav — redirect to Pulse Hub */
export default function AlertsPage() {
  redirect("/");
}
