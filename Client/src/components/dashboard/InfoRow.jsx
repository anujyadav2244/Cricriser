export default function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium break-all">
        {value ?? "—"}
      </span>
    </div>
  );
}
