import { supabase } from "./supabase";

export const logStaffActivity = async (staffId, actionType, details = {}) => {
  if (!staffId) return;

  try {
    // 1. Fetch current history
    const { data: existing } = await supabase
      .from("staff_activity")
      .select("log_history")
      .eq("staff_id", staffId)
      .maybeSingle();

    const newLog = {
      timestamp: new Date().toISOString(),
      action: actionType,
      ...details
    };

    // 2. Append and Limit
    let history = existing?.log_history || [];
    if (!Array.isArray(history)) history = [];
    history = [newLog, ...history].slice(0, 50); // Keep last 50

    // 3. Upsert (Now works with the Unique constraint)
    const { error } = await supabase
      .from("staff_activity")
      .upsert({ 
        staff_id: staffId, 
        log_history: history,
        created_at: new Date().toISOString() 
      }, { onConflict: 'staff_id' });

    if (error) throw error;
  } catch (err) {
    console.error("Logging Error:", err.message);
  }
};
