import { AuthForm } from "@/components/auth-form";

export default function VerifyEmailPage() {
  return <AuthForm action="verify-email" fields={["token"]} />;
}
