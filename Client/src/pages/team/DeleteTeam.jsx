import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import axios from "@/api/axios";

export default function DeleteTeam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDelete = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      toast.error("Unauthorized");
      return;
    }

    try {
      await axios.delete(`/api/teams/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Team deleted successfully");
      navigate("/team-owner/dashboard");
    } catch (e) {
      toast.error(e.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <h1 className="text-xl font-semibold text-red-600">
            Delete Team
          </h1>

          <Separator />

          <p className="text-sm text-slate-600">
            This action is <b>permanent</b>. All players will be unassigned
            and the team data will be permanently deleted.
          </p>

          <div className="flex gap-3">
            <Button variant="destructive" onClick={handleDelete}>
              Yes, Delete Team
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
