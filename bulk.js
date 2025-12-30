import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- CONFIG --------------------
const FILE = './college.xlsx';
const PHOTO_DIR = './photos'; // local photo folder
const STAFF_SHEET = 'Sheet1';

const DAY_MAP = {
  M: 'monday',
  T: 'tuesday',
  W: 'wednesday',
  Th: 'thursday',
  F: 'friday',
  Sa: 'saturday',
};

function emptyWeek() {
  return {
    monday: Array(7).fill(null),
    tuesday: Array(7).fill(null),
    wednesday: Array(7).fill(null),
    thursday: Array(7).fill(null),
    friday: Array(7).fill(null),
    saturday: Array(7).fill(null),
  };
}
// -------------------- LOAD EXCEL --------------------
const workbook = XLSX.readFile(FILE);
const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[STAFF_SHEET]);

if (!sheet.length) {
  throw new Error('Excel sheet empty or wrong sheet name');
}

// -------------------- HELPERS --------------------
async function uploadPhoto(photoValue, staffId) {
  if (!photoValue) return null;

  let buffer;
  let ext = 'jpg';

  // CASE 1: URL
  if (photoValue.startsWith('http')) {
    const res = await fetch(photoValue);
    if (!res.ok) throw new Error('Failed to fetch photo URL');
    buffer = Buffer.from(await res.arrayBuffer());
    ext = photoValue.split('.').pop().split('?')[0];
  }

  // CASE 2: Local file
  else {
    const filePath = path.join(PHOTO_DIR, photoValue);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Photo file not found: ${photoValue}`);
    }
    buffer = fs.readFileSync(filePath);
    ext = path.extname(photoValue).replace('.', '');
  }

  const storagePath = `${staffId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: `image/${ext}`,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

// -------------------- MAIN --------------------
async function run() {
  for (const row of sheet) {
    const email = row['Mail id']?.trim();
    const name = row['Staff Name']?.trim();
    const photo = row['Photo']; // NEW COLUMN

    if (!email || !name) {
      console.warn('⏭ Skipping row (missing email/name)');
      continue;
    }

    console.log(`\n▶ Processing ${email}`);

    // -----------------------------------
    // 1. CREATE OR FETCH AUTH USER
    // -----------------------------------
    let userId;

    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing.users.find(u => u.email === email);

    if (found) {
      userId = found.id;
      console.log('ℹ Auth user exists');
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name },
      });

      if (error) {
        console.error('❌ Auth error:', error.message);
        continue;
      }

      userId = data.user.id;
      console.log('✔ Auth user created');
    }

    // -----------------------------------
    // 2. WAIT FOR STAFF TRIGGER
    // -----------------------------------
    let staffId = null;
    for (let i = 0; i < 10; i++) {
      const { data } = await supabase
        .from('staff')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (data?.id) {
        staffId = data.id;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    if (!staffId) {
      console.error('❌ Staff row not found for', email);
      continue;
    }

    // -----------------------------------
    // 3. UPLOAD PHOTO (NEW)
    // -----------------------------------
    try {
      const photoUrl = await uploadPhoto(photo, staffId);
      if (photoUrl) {
        await supabase
          .from('staff')
          .update({ photo_url: photoUrl })
          .eq('id', staffId);

        console.log('✔ Photo uploaded');
      }
    } catch (e) {
      console.warn(`⚠ Photo skipped: ${e.message}`);
    }

    // -----------------------------------
    // 4. BUILD TIMETABLE
    // -----------------------------------
    const week = emptyWeek();

    for (const key of Object.keys(row)) {
      const m = key.match(/^(M|T|W|Th|F|Sa)(\d)$/);
      if (!m) continue;

      const day = DAY_MAP[m[1]];
      const idx = Number(m[2]) - 1;

      if (row[key]) {
        week[day][idx] = row[key].toString().trim();
      }
    }

    // -----------------------------------
    // 5. UPSERT TIMETABLE
    // -----------------------------------
    const { error: ttErr } = await supabase
      .from('timetable')
      .upsert(
        { staff_id: staffId, ...week },
        { onConflict: 'staff_id' }
      );

    if (ttErr) {
      console.error('❌ Timetable error:', ttErr.message);
      continue;
    }

    console.log('✔ Timetable saved');
  }

  console.log('\n🎉 IMPORT COMPLETED SUCCESSFULLY');
}

run().catch(err => {
  console.error('🔥 FATAL:', err);
});
