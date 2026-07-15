import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StaffMessageFlowEditor } from "@/components/staff-message-flow-editor";
import { CORE_ACCESS_COOKIE } from "@/lib/core-auth";

export default async function StaffFlowsPage({
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

  return <StaffMessageFlowEditor />;
}
