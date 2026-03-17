import DeleteAccount from "@/components/auth/DeleteAccountForm";

export default function AdminDeleteAccount() {
  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <DeleteAccount role="TEAM_OWNER" />
    </div>
  );
}
