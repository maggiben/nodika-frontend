import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StaffMessagingForm } from "@/components/staff-messaging-form";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function StaffPage({
  params,
}: Readonly<{
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const authenticated = Boolean(
    (await cookies()).get(CORE_ACCESS_COOKIE)?.value,
  );

  if (!authenticated) {
    redirect(`/${locale}/login`);
  }

  return <StaffMessagingForm />;
}
