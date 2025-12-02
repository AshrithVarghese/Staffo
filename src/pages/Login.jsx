import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import toast from "react-hot-toast";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);

  // ---------------------------
  // Fetch user's role
  // ---------------------------
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching role:", error);
      return null;
    }

    return data?.role ?? null;
  };

  // ---------------------------
  // Redirect by role
  // ---------------------------
  const redirectByRole = (role) => {
    if (role === "staff") window.location.href = "/staffdashboard";
    else window.location.href = "/dashboard";
  };

  // ---------------------------
  // OAuth callback handler
  // ---------------------------
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      // Not logged in yet (first page load)
      if (!session) return;

      const user = session.user;
      if (!user) return;

      // Validate domain
      if (!user.email.endsWith("@jecc.ac.in")) {
        await supabase.auth.signOut();
        toast.error("Only @jecc.ac.in emails are allowed");
        return;
      }

      // Fetch role → redirect
      const role = await fetchUserRole(user.id);
      redirectByRole(role);
    };

    handleOAuthCallback();
  }, []);

  // ---------------------------
  // Google Login
  // ---------------------------
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/login`, // correct callback
        queryParams: { hd: "jecc.ac.in" },
      },
    });

    if (error) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setGoogleLoading(false);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------
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
          <p className="text-gray-500 text-sm mt-1">Sign in with your JECC account</p>
        </div>

        <div className="bg-white mt-6 shadow-md rounded-2xl p-6">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-3 bg-white hover:shadow transition disabled:opacity-60"
          >
            <img
              src="https://www.w3schools.com/whatis/img_google.jpg"
              alt="Google Logo"
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">
              {googleLoading ? "Please wait…" : "Continue with Google"}
            </span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          * Only @jecc.ac.in accounts are accepted
        </p>
      </div>
    </div>
  );
}
