import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AUTH_API, ROLE_ROUTES } from "@/api/authMap";
import { Eye, EyeOff } from "lucide-react";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export function RegisterForm({ role }) {
  const navigate = useNavigate();
  const api = AUTH_API[role];
  const routes = ROLE_ROUTES[role];

  if (!api || !routes) {
    throw new Error(`Invalid role provided to RegisterForm: ${role}`);
  }

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 🔒 Frontend validations
    if (role !== "PLAYER" && name.trim() === "") {
      setError("Name is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const payload =
        role === "PLAYER"
          ? { email, password }
          : { name: name.trim(), email, password };

      // ✅ FIX HERE
      await api.signup(payload);

      // ✅ Use navigate instead of window.location.href
      navigate(`${routes.verifySignupOtp}?email=${encodeURIComponent(email)}`);

    } catch (err) {
      const status = err.response?.status;
      const message = getApiErrorMessage(err, "Registration failed. Please try again.");

      if (status === 409) {
        setError("This Email already exists");
      } else if (status === 400) {
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }

  };

  return (
    <Card className="w-full max-w-md bg-white">
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Create {routes.label} Account
          </h1>
          <p className="text-slate-500 text-sm">
            Get started with Cricriser
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {role !== "PLAYER" && (
            <Input
              placeholder="Full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              onClick={() => setShowPassword(p => !p)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              onClick={() => setShowConfirm(p => !p)}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <a
            href={routes.login}
            className="text-orange-500 font-medium hover:underline"
          >
            Login
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
