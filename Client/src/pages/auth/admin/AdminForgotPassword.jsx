import ForgotPasswordOtpForm from "@/components/auth/ForgotPasswordForm";

export default function AdminForgotPasswordOtp() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <ForgotPasswordOtpForm role="ADMIN" />
    </div>
  );
}
