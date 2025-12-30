import os
import time
from dotenv import load_dotenv
from openpyxl import load_workbook
from supabase import create_client
import requests

# ---------------- CONFIG ----------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

FILE = "college.xlsx"
AVATAR_BUCKET = "avatars"

DAY_MAP = {
    "M": "monday",
    "T": "tuesday",
    "W": "wednesday",
    "Th": "thursday",
    "F": "friday",
    "Sa": "saturday",
}

def empty_week():
    return {
        "monday": [None]*7,
        "tuesday": [None]*7,
        "wednesday": [None]*7,
        "thursday": [None]*7,
        "friday": [None]*7,
        "saturday": [None]*7,
    }

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------- LOAD EXCEL ----------------
wb = load_workbook(FILE)
ws = wb.active

headers = [cell.value for cell in ws[1]]
rows = list(ws.iter_rows(min_row=2))

# ---------------- IMAGE MAP (ROW INDEX → IMAGE) ----------------
image_map = {}
for image in ws._images:
    row = image.anchor._from.row + 1  # 1-based
    image_map[row] = image

# ---------------- MAIN ----------------
for idx, row in enumerate(rows, start=2):
    row_data = dict(zip(headers, [c.value for c in row]))

    email = row_data.get("Mail id")
    name = row_data.get("Staff Name")

    if not email or not name:
        print("⏭ Skipping row", idx)
        continue

    print(f"\n▶ Processing {email}")

    # ---------- 1. CREATE / FETCH AUTH ----------
    user = supabase.auth.admin.get_user_by_email(email).user

    if not user:
        res = supabase.auth.admin.create_user({
            "email": email,
            "email_confirm": True,
            "user_metadata": {"full_name": name}
        })
        user_id = res.user.id
        print("✔ Auth user created")
    else:
        user_id = user.id
        print("ℹ Auth user exists")

    # ---------- 2. WAIT FOR STAFF ROW ----------
    staff_id = None
    for _ in range(10):
        staff = (
            supabase.table("staff")
            .select("id")
            .eq("profile_id", user_id)
            .execute()
        )
        if staff.data:
            staff_id = staff.data[0]["id"]
            break
        time.sleep(0.5)

    if not staff_id:
        print("❌ Staff row missing")
        continue

    # ---------- 3. UPLOAD PHOTO ----------
    photo_url = None
    if idx in image_map:
        image = image_map[idx]
        img_bytes = image._data()
        ext = image.path.split(".")[-1]
        filename = f"{user_id}/profile.{ext}"

        supabase.storage.from_(AVATAR_BUCKET).upload(
            filename,
            img_bytes,
            {"content-type": f"image/{ext}", "upsert": True}
        )

        photo_url = (
            f"{SUPABASE_URL}/storage/v1/object/public/"
            f"{AVATAR_BUCKET}/{filename}"
        )

        supabase.table("staff").update({
            "photo_url": photo_url
        }).eq("id", staff_id).execute()

        print("✔ Photo uploaded")

    # ---------- 4. BUILD TIMETABLE ----------
    week = empty_week()
    for k, v in row_data.items():
        if not v:
            continue
        import re
        m = re.match(r"^(M|T|W|Th|F|Sa)(\d)$", k)
        if not m:
            continue
        day = DAY_MAP[m.group(1)]
        period = int(m.group(2)) - 1
        week[day][period] = str(v)

    # ---------- 5. UPSERT TIMETABLE ----------
    supabase.table("timetable").upsert({
        "staff_id": staff_id,
        **week
    }, on_conflict="staff_id").execute()

    print("✔ Timetable saved")

print("\n🎉 IMPORT COMPLETED SUCCESSFULLY")

