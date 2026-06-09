import { redirect } from "next/navigation";

// Analytics has been merged into the Reports & Analytics page.
export default function AnalyticsPage() {
  redirect("/admin/reports");
}
