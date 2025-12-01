import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase.js";
import toast from "react-hot-toast";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginAsStaff, setLoginAsStaff] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("error")) {
      toast.error("Only @jecc.ac.in emails are allowed");
      window.history.replaceState({}, document.title, "/login");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
        queryParams: { hd: "jecc.ac.in" }, // domain hint
      },
    });

    if (error) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error("Email and password are required");
      setLoading(false);
      return;
    }

    // optional: enforce jecc domain on email
    if (!email.endsWith("@jecc.ac.in")) {
      toast.error("Only @jecc.ac.in emails are allowed");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Login failed");
      setLoading(false);
      return;
    }

    toast.success("Signed in");
    setLoading(false);
    // optionally redirect here
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
            className=" w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-3 bg-white hover:shadow transition disabled:opacity-60"
          >
            <img src="https://www.w3schools.com/whatis/img_google.jpg" alt="google" className="w-5 h-5" />
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
