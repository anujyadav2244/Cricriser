import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DashboardLayout({
  title,
  subtitle,
  children,
  backTo,
}) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
          )}

          <h1 className="text-2xl font-bold text-white">
            {title}
          </h1>
        </div>

        {subtitle && (
          <p className="text-sm text-slate-400">
            {subtitle}
          </p>
        )}
      </div>

      {/* CONTENT */}
      <div>
        {children}
      </div>
    </div>
  );
}
