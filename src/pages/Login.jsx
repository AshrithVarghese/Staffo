import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import toast from "react-hot-toast";

export default function Login() {
  const [googleLoading, setGoogleLoading] = useState(false);

<<<<<<< HEAD
  // ---------------------------
  // Get role from profiles table
  // ---------------------------
=======
  // --------------------------
  // Fetch role
  // --------------------------
>>>>>>> bd6cebc2a762412a46b50419ef3b30cdced6e2e9
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

<<<<<<< HEAD
  // ---------------------------
  // Redirect based on role
  // ---------------------------
=======
  // --------------------------
  // Redirect
  // --------------------------
>>>>>>> bd6cebc2a762412a46b50419ef3b30cdced6e2e9
  const redirectByRole = (role) => {
    if (role === "staff") window.location.href = "/staffdashboard";
    else window.location.href = "/dashboard";
  };

<<<<<<< HEAD
  // ---------------------------
  // OAuth callback handler
  // ---------------------------
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Supabase will automatically extract the hash (#access_token...)
      const { data: sessionData } = await supabase.auth.getSession();

      // If user isn't logged in yet → do nothing
      if (!sessionData?.session) return;

      const user = sessionData.session.user;
      if (!user) return;

      // Now fetch the role
      const role = await fetchUserRole(user.id);

      // Redirect dashboards
      redirectByRole(role);
    };

    handleOAuthCallback();
=======
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
>>>>>>> bd6cebc2a762412a46b50419ef3b30cdced6e2e9
  }, []);

  // ---------------------------
  // Google Sign In
  // ---------------------------
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
<<<<<<< HEAD
        redirectTo: `${window.location.origin}/login`, // very important
        queryParams: { hd: "jecc.ac.in" },              // restrict domain
=======
        redirectTo: `${window.location.origin}/login?redirect=1`,
        queryParams: { hd: "jecc.ac.in" }, // restrict to domain
>>>>>>> bd6cebc2a762412a46b50419ef3b30cdced6e2e9
      },
    });

    if (error) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setGoogleLoading(false);
    }
  };

<<<<<<< HEAD
  // ---------------------------
  // UI
  // ---------------------------
=======
>>>>>>> bd6cebc2a762412a46b50419ef3b30cdced6e2e9
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
              alt="google"
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