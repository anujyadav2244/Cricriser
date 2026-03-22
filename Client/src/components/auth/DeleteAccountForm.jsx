import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AUTH_API, ROLE_ROUTES } from "@/api/authMap";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function DeleteAccount({ role }) {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const api = AUTH_API[role];
  const routes = ROLE_ROUTES[role];

  if (!api || !routes) {
    throw new Error(`Invalid role passed to DeleteAccount: ${role}`);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    setError(null);

    try {
      setLoading(true);

      // 🔥 API MUST EXIST PER ROLE
      await api.deleteAccount();

      // ✅ Clear auth completely
      logout();

      // ✅ Redirect to role login
      navigate(routes.login, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete account"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white border border-red-200">
      <CardContent className="p-6 space-y-5">
        <h1 className="text-xl font-bold text-red-600 text-center">
          Delete Account
        </h1>

        <p className="text-sm text-slate-600 text-center">
          This action is <strong>permanent</strong> and cannot be undone.
        </p>

        {error && (
          <p className="text-sm text-red-500 text-center">
            {error}
          </p>
        )}

        {!confirm ? (
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setConfirm(true)}
          >
            I want to delete my account
          </Button>
        ) : (
          <div className="space-y-3">
            <Button
              variant="destructive"
              className="w-full"
              disabled={loading}
              onClick={handleDelete}
            >
              {loading ? "Deleting..." : "Yes, delete permanently"}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
