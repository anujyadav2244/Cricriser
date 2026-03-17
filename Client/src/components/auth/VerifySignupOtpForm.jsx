import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AUTH_API, ROLE_ROUTES } from "@/api/authMap";

export default function VerifySignupOtpForm({ role }) {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const api = AUTH_API[role];
  const routes = ROLE_ROUTES[role];

  if (!api || !routes) {
    throw new Error(
      `Invalid role provided to VerifySignupOtpForm: ${role}`
    );
  }

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!email) {
    navigate(routes.signup);
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    try {
      setLoading(true);

      await api.verifySignupOtp({
        email,
        otp,
      });

      // ✅ OTP verified → redirect to role-based login
      navigate(routes.login);
    } catch (err) {
      setError(
        err.response?.data?.error || "Invalid or expired OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            Verify OTP
          </h1>
          <p className="text-slate-500 text-sm">
            Enter the 6-digit OTP sent to
          </p>
          <p className="text-slate-700 text-sm font-medium">
            {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={setOtp}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <p className="text-xs text-slate-500 text-center">
            OTP is valid for{" "}
            <span className="font-medium">10 minutes</span>
          </p>

          {error && (
            <p className="text-sm text-red-500 text-center">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Didn&apos;t receive the OTP?{" "}
          <span className="text-slate-400">
            Please check spam or try again
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
