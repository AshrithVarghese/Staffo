import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import toast from "react-hot-toast";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);

  // --------------------------
  // Fetch role
  // --------------------------
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Profile fetch error:", error);
      return null;
    }

    return data?.role ?? null;
  };

  // --------------------------
  // Redirect
  // --------------------------
  const redirectByRole = (role) => {
    if (role === "staff") {
      window.location.href = "/staffdashboard";
    } else {
      window.location.href = "/dashboard";
    }
  };

  // --------------------------
  // OAuth callback
  // --------------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Supabase sends ?error=access_denied etc
    if (params.get("error")) {
      toast.error("Only @jecc.ac.in emails are allowed");
      return;
    }

    // When returning from Google OAuth
    if (params.get("redirect") === "1") {
      supabase.auth.getUser().then(async ({ data, error }) => {
        if (error || !data?.user) return;

        const role = await fetchUserRole(data.user.id);
        redirectByRole(role);
      });
    }
  }, []);

  // --------------------------
  // Google Login
  // --------------------------
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login?redirect=1`,
        queryParams: { hd: "jecc.ac.in" }, // restrict to domain
      },
    });

    if (error) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 relative">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center">
          <img
            src="/staffo.png"
            alt="Staffo Logo"
            className="w-50 rounded-full absolute top-45"
          />
          <h2 className="text-2xl font-semibold mt-1">Welcome to Staffo</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white mt-6 shadow-md rounded-2xl p-6">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-3 bg-white hover:shadow transition disabled:opacity-60"
          >
            <img
              src="https://www.w3schools.com/whatis/img_google.jpg"
              alt="google"
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">
              {googleLoading ? "Please wait..." : "Continue with Google"}
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          *Sign in with your JECC account
        </p>
      </div>
    </div>
  );
}