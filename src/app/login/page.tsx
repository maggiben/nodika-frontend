import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      action="login"
      fields={["email", "password"]}
      heading="Sign in"
      submitLabel="Sign in"
      successMessage=""
    />
  );
}
