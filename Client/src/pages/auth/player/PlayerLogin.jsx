import { LoginForm } from "@/components/auth/LoginForm";

export default function PlayerLogin() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <LoginForm role="PLAYER" />
    </div>
  );
}
