import { AuthForm } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return (
    <AuthForm
      action="reset-password"
      fields={["token", "password"]}
      heading="Choose a new password"
      submitLabel="Reset password"
      successMessage="Your password has been reset. You can now sign in."
    />
  );
}
