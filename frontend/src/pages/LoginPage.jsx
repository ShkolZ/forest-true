import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { authApi } from "../api/auth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import "./LoginPage.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.login(username, password);
      const token = res.data.token;
      login(typeof token === "string" ? token : JSON.stringify(token));
      navigate("/products", { replace: true });
    } catch (err) {
      const msg = err.response?.data || err.message || "Login failed";
      setError(typeof msg === "string" ? msg : "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__ambient login-page__ambient--1" />
      <div className="login-page__ambient login-page__ambient--2" />
      <div className="login-page__ambient login-page__ambient--3" />

      <div className="login-card animate-scale-in">
        <div className="login-card__header">
          <div className="login-card__logo">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v10l9 5 9-5V7l-9-5z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="hsla(152, 60%, 45%, 0.15)"
              />
              <path
                d="M12 2v20M3 7l9 5 9-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="login-card__title">Forest True</h1>
          <p className="login-card__subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && (
            <div className="login-card__error animate-fade-in">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 5v3M8 10h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          <Input
            id="login-username"
            label="Username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="login-card__footer">
          <p>Furniture management platform</p>
        </div>
      </div>
    </div>
  );
}
