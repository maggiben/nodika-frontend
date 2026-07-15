import { AuthForm } from "@/components/auth-form";

export default function ForgotPasswordPage() {
  return (
    <AuthForm
      action="forgot-password"
      fields={["email"]}
      heading="Reset your password"
      submitLabel="Send reset instructions"
      successMessage="If an account exists for this email address, reset instructions have been sent."
    />
  );
}
