import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase.js";
import toast from "react-hot-toast";

export default function Login() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error")) {
      toast.error("Only @jecc.ac.in emails are allowed");
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/login",
        queryParams: { hd: "jecc.ac.in" }, // Google domain hint
      },
    });

    if (error) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">

      <img
        src="/staffo.png"
        alt="Staffo Logo"
        className="w-28 h-28 mb-6 rounded-full drop-shadow"
      />

      <h1 className="text-3xl font-bold">Welcome to Staffo</h1>
      <p className="text-gray-500 mt-1">Sign in with your JECC account</p>

      <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-6 mt-8">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

      </div>
    </div>
  );
}

