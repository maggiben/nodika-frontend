import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StaffOrgChartEditor } from "@/components/staff-org-chart-editor";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function StaffOrgChartPage({
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

  return <StaffOrgChartEditor contactId={contactId} />;
}
