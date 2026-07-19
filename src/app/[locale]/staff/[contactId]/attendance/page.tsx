import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StaffAttendanceSheet } from "@/components/staff-attendance-sheet";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function StaffAttendancePage({
  params,
}: Readonly<{
  params: Promise<{ locale: string; contactId: string }>;
}>) {
  const { locale, contactId } = await params;
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  if (!authenticated) {
    redirect(`/${locale}/login`);
  }

  return <StaffAttendanceSheet contactId={contactId} />;
}
