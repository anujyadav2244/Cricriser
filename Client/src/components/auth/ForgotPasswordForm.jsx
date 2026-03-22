import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AUTH_API } from "@/api/authMap";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export default function ForgotPasswordOtpForm({ role }) {
  const navigate = useNavigate();
  const api = AUTH_API[role];

  if (!api) {
    throw new Error(`Invalid role: ${role}`);
  }

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const { data } = await api.forgotPassword(email);

      const otpQuery = data?.otp ? `&otp=${encodeURIComponent(data.otp)}` : "";

      navigate(
        `/${role.toLowerCase().replace("_", "-")}/verify-forgot-otp?email=${encodeURIComponent(email)}${otpQuery}`
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white">
      <CardContent className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">
          Forgot Password
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Input
            type="email"
            placeholder="Enter registered email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
