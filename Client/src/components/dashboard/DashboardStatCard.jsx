import { Card, CardContent } from "@/components/ui/card";

export default function DashboardStatCard({ title, value, icon, onClick }) {
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition ${
        onClick ? "hover:border-orange-500" : ""
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>

        {icon && (
          <div className="text-orange-500">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
