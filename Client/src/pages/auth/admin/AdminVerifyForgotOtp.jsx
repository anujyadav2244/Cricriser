import ForgotPasswordOtpForm from "@/components/auth/ForgotPasswordForm"
import VerifyForgotOtpForm from "@/components/auth/VerifyForgotOtpForm"

export default function AdminVerifyForgotOtp() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <VerifyForgotOtpForm role="ADMIN" />
    </div>
  )
}
