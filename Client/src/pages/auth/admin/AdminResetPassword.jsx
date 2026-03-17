import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function AdminResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <ResetPasswordForm role="ADMIN" />
    </div>
  );
}
