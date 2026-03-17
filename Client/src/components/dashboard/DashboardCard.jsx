import { Card } from "../ui/card";
import { CardHeader } from "../ui/card";
import { CardTitle } from "../ui/card";
import { CardContent } from "../ui/card";

export default function DashboardCard({ title, children }) {
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