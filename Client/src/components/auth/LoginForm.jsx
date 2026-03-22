import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useNavigate, Link } from "react-router-dom";
import { ROLE_ROUTES } from "@/api/authMap";
import BASE_URL from "@/api/config";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function LoginForm({ role }) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const routes = ROLE_ROUTES[role];

  if (!routes) {
    throw new Error(`Invalid role provided to LoginForm: ${role}`);
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("Logging In for ", role)
      // 🔥 CHANGED: fetch with headers + role
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST", // 🔥 CHANGED
        headers: {
          "Content-Type": "application/json", // 🔥 CHANGED
        },
        body: JSON.stringify({
          email,
          password,
          role, // 🔥 CHANGED: role sent to backend
        }),
      });

      const data = await res.json(); // 🔥 CHANGED

      if (!res.ok) {
        throw { response: { data }, message: "Login failed" };
      }


      // 🔥 CHANGED: store auth data
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setAuth(data.token, {
        email: data.email,
        role: data.role,
      });

      console.log("Login Successful")
      // 🔥 CHANGED: redirect based on role from backend
      const redirectRoute = ROLE_ROUTES[data.role]?.dashboard;
      console.log(redirectRoute )
      navigate(redirectRoute || "/", { replace: true });

    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      setError("Please enter your email first");
      return;
    }

    try {
      navigate(
        `${routes.forgotPassword}?email=${encodeURIComponent(email)}`
      );
    } catch {
      setError("Failed to send OTP");
    }
  };

  return (
    <Card className="w-full max-w-md bg-white">
      <CardContent className="p-6 space-y-4">
        <h1 className="text-xl font-bold text-center">
          {routes.label} Login
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShow((p) => !p)}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">
              {error}
            </p>
          )}

          <button
            type="button"
            className="text-sm text-right w-full underline"
            onClick={handleForgot}
          >
            Forgot password?
          </button>

          <Button className="w-full bg-orange-500" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-sm">
          New {routes.label}?{" "}
          <Link to={routes.signup} className="text-orange-500">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
