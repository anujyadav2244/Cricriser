import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function PlayerForgotPassword() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <ForgotPasswordForm role="PLAYER" />
    </div>
  );
}