import { AuthForm } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return <AuthForm action="reset-password" fields={["token", "password"]} />;
}
