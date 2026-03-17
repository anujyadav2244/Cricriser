import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardSectionCard({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-2">
        {children}
      </CardContent>
    </Card>
  );
}
