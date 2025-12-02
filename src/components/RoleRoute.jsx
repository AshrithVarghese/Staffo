import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export default function RoleRoute({ children, allow }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setOk(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setOk(false);
      } else {
        setOk(allow.includes(profile.role));
      }

      setLoading(false);
    };

    check();
  }, [allow]);

  if (loading) return null;
  if (!ok) return <Navigate to="/dashboard" replace />;

  return children;
}
