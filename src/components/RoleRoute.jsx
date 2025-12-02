import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export default function RoleRoute({ children, allow }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (!profile) {
        setAllowed(false);
      } else {
        setAllowed(allow.includes(profile.role));
      }

      setLoading(false);
    };

    check();
  }, [allow]);

  if (loading) return null;

  if (!allowed) return <Navigate to="/dashboard" replace />;

  return children;
}

