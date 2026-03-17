import { RegisterForm } from "@/components/auth/RegisterForm";

export default function PlayerRegister() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <RegisterForm role="PLAYER" />
    </div>
  );
}
