import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return <AuthForm action="register" fields={["email", "password"]} />;
}
