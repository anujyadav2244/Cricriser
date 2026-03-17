import ForgotPasswordOtpForm from "@/components/auth/VerifyForgotOtpForm";

export default function PlayerForgotPasswordOtp() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <VerifyForgotOtpForm role="PLAYER" />
    </div>
  );
}
