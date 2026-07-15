import { AuthForm } from "@/components/auth-form";

export default function VerifyEmailPage() {
  return (
    <AuthForm
      action="verify-email"
      fields={["token"]}
      heading="Verify your email"
      submitLabel="Verify email"
      successMessage="Your email address has been verified."
    />
  );
}
