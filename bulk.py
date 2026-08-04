import os
import re
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from openpyxl import load_workbook

# ================= LOAD ENV =================
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# ================= CONFIG =================
FILE = "cse.xlsx"
BUCKET = "avatars"
DEPT = "CSE"

DAY_MAP = {
    "M": "monday",
    "T": "tuesday",
    "W": "wednesday",
    "Th": "thursday",
    "F": "friday",
    "Sa": "saturday",
}

# 1. UPDATED: Now creates 8 slots per day (indices 0 to 7)
def empty_week():
    return {day: [None] * 8 for day in DAY_MAP.values()}

# ================= LOAD AUTH USERS =================
print("📦 Loading auth users...")
auth_res = supabase.auth.admin.list_users(per_page=1000)
auth_users = {u.email: u for u in auth_res}

# ================= EXTRACT IMAGES =================
print("🖼 Extracting images from Excel...")
wb = load_workbook(FILE)
ws = wb.active

row_images = {}
for img in ws._images:
    excel_row = img.anchor._from.row + 1
    row_images[excel_row] = img._data()

# ================= LOAD EXCEL DATA =================
df = pd.read_excel(FILE)

# ================= MAIN LOOP =================
for index, row in df.iterrows():
    excel_row = index + 2  # header offset
    email = str(row.get("Mail id", "")).strip()
    name = str(row.get("Staff Name", "")).strip()

    if not email or email.lower() == "nan":
        continue

    print(f"\n▶ Processing {email}")

    # ---------- AUTH (CREATE OR UPDATE) ----------
    user = auth_users.get(email)

    if not user:
        res = supabase.auth.admin.create_user({
            "email": email,
            "email_confirm": True,
            "user_metadata": {"full_name": name},
        })
        user = res.user
        auth_users[email] = user
        print("👤 Auth user created")
    else:
        supabase.auth.admin.update_user_by_id(
            user.id,
            {"user_metadata": {"full_name": name}},
        )
        print("🔄 Auth user exists → metadata updated")

    user_id = user.id

    # ---------- STAFF UPSERT ----------
    staff_payload = {
        "profile_id": user_id,
        "dept": DEPT,
    }

    # ---------- IMAGE: DELETE → UPLOAD ----------
    if excel_row in row_images:
        file_path = f"{user_id}/profile.jpg"

        try:
            supabase.storage.from_(BUCKET).remove([file_path])
            print("🗑 Old photo removed (if existed)")
        except Exception:
            pass

        supabase.storage.from_(BUCKET).upload(
            file_path,
            row_images[excel_row],
            file_options={
                "content-type": "image/jpeg",
                "upsert": "false",
            },
        )

        staff_payload["photo_url"] = (
            f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{file_path}"
        )

        print("✔ Photo uploaded")

    supabase.table("staff").upsert(
        staff_payload,
        on_conflict="profile_id",
    ).execute()

    # Fetch staff_id safely
    staff_row = (
        supabase.table("staff")
        .select("id")
        .eq("profile_id", user_id)
        .single()
        .execute()
    )

    staff_id = staff_row.data["id"]
    print("✔ Staff upserted")

# ---------- TIMETABLE UPSERT (UPDATED LOGIC) ----------
    week = empty_week()

    for col in df.columns:
        match = re.match(r"^(M|T|W|Th|F|Sa)(\d)$", str(col))
        if match:
            day = DAY_MAP[match.group(1)]
            period_num = int(match.group(2))  # Period 1 to 7 from Excel
            value = row.get(col)

            if pd.notna(value) and str(value).strip():
                val_str = str(value).strip()

                if period_num in [1, 2, 3]:
                    # Periods 1, 2, 3 -> Indexes 0, 1, 2
                    week[day][period_num - 1] = val_str
                
                elif period_num == 4:
                    # FRIDAY EXCEPTION: No split lunch on Friday — everyone stays at index 3 (11:40 AM slot)
                    if day == "friday" or not re.search(r'\bS[12]\b', val_str.upper()):
                        week[day][3] = val_str  # Index 3 (Slot 4 -> 11:40 - 12:30)
                    else:
                        week[day][4] = val_str  # Index 4 (Slot 5 -> 12:30 - 1:20 for S1/S2)
                
                elif period_num in [5, 6, 7]:
                    # Periods 5, 6, 7 -> Indexes 5, 6, 7 (6th, 7th, 8th slots)
                    week[day][period_num] = val_str

    supabase.table("timetable").upsert(
        {"staff_id": staff_id, **week},
        on_conflict="staff_id",
    ).execute()

    print("✔ Timetable upserted")

print("\n🎉 IMPORT COMPLETED — SAFE TO RE-RUN")
