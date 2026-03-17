import VerifySignupOtpForm from "@/components/auth/VerifySignupOtpForm";
export default function AdminVerifySignupOtp() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <VerifySignupOtpForm role="ADMIN" />
    </div>
  );
}
