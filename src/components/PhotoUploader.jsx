// components/PhotoUploader.jsx
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

/**
 * PhotoUploader — ensures exactly one file exists per user in the bucket.
 * - Deletes existing files in user's folder before uploading new one.
 * - Updates ONLY staff.photo_url.
 *
 * Props:
 * - show (boolean)
 * - onClose() -> close modal
 * - staffId (number)         // REQUIRED to update staff table
 * - updateStaffField(field, value) -> optional parent callback to update local state
 *
 * Console logging is standardized via logInfo / logWarn / logError.
 */
export default function PhotoUploader({
  show,
  onClose = () => {},
  staffId,
  updateStaffField = null,
}) {
  if (!show) return null;
  const BUCKET_NAME = "avatars";
  const MAX_BYTES = 2 * 1024 * 1024; // 2MB

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // STANDARDIZED LOGGERS
  const PREFIX = "[PhotoUploader]";
  const logInfo = (message, meta) => console.log(`${PREFIX} INFO: ${message}`, meta ?? "");
  const logWarn = (message, meta) => console.warn(`${PREFIX} WARN: ${message}`, meta ?? "");
  const logError = (message, meta) => console.error(`${PREFIX} ERROR: ${message}`, meta ?? "");

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pickFile = (e) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      const msg = "Selected file is not an image.";
      setError(msg);
      logWarn("pickFile validation failed", { reason: "not-image", file: f?.name });
      return;
    }
    if (f.size > MAX_BYTES) {
      const msg = "File too large. Maximum allowed size is 2MB.";
      setError(msg);
      logWarn("pickFile validation failed", { reason: "too-large", size: f.size });
      return;
    }
    setFile(f);
    logInfo("File selected", { name: f.name, size: f.size });
  };

  const sanitize = (s) => s.replace(/[^a-z0-9.\-_]/gi, "-").toLowerCase();

  // list files in user's folder (prefix = uid)
  const listUserFiles = async (uid) => {
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).list(uid, { limit: 100, offset: 0 });
      logInfo("listUserFiles result", { uid, data, error });
      if (error) {
        logError("listUserFiles storage error", error);
        throw new Error(error.message || "Failed to list storage files");
      }
      return data || [];
    } catch (e) {
      logError("listUserFiles exception", e);
      throw e;
    }
  };

  // delete paths array of strings (paths are like "uid/filename.ext")
  const removeFiles = async (paths) => {
    if (!paths || paths.length === 0) {
      logInfo("removeFiles called with no paths");
      return;
    }
    try {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).remove(paths);
      logInfo("removeFiles result", { paths, data, error });
      if (error) {
        logError("removeFiles storage error", error);
        throw new Error(error.message || "Failed to remove storage files");
      }
      return data;
    } catch (e) {
      logError("removeFiles exception", e);
      throw e;
    }
  };

  // upload and return publicUrl
  const uploadToSupabaseAndGetUrl = async (fileToUpload) => {
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        logError("upload: unauthenticated", userErr);
        throw new Error("Not authenticated");
      }

      const uid = userData.user.id;
      const ext = (fileToUpload.name.split(".").pop() || "jpg").slice(0, 8);
      const base = sanitize(fileToUpload.name.split(".").slice(0, -1).join(".") || Date.now().toString());
      const path = `${uid}/${base}-${Math.random().toString(36).slice(2,8)}.${ext}`;

      // Before uploading: delete existing files in the user's folder
      try {
        const existing = await listUserFiles(uid);
        if (existing.length > 0) {
          const pathsToRemove = existing.map((it) => (it.name ? `${uid}/${it.name}` : it.path)).filter(Boolean);
          if (pathsToRemove.length > 0) {
            await removeFiles(pathsToRemove);
            logInfo("Deleted existing user files", { uid, removed: pathsToRemove });
          }
        } else {
          logInfo("No existing user files to delete", { uid });
        }
      } catch (e) {
        // decide: don't block upload, but log standardized warning
        logWarn("Could not delete existing files before upload — continuing", e?.message ?? e);
      }

      // upload new file
      const { data: upData, error: upErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(path, fileToUpload, { cacheControl: "3600", upsert: true, contentType: fileToUpload.type });

      logInfo("storage.upload result", { upData, upErr });
      if (upErr) {
        logError("storage.upload failed", upErr);
        throw new Error(upErr.message || "Upload failed");
      }
      if (!upData || !upData.path) {
        logError("storage.upload returned no path", upData);
        throw new Error("Upload succeeded but no path returned");
      }

      const publicRes = await supabase.storage.from(BUCKET_NAME).getPublicUrl(upData.path);
      logInfo("getPublicUrl result", publicRes);

      const publicUrl =
        publicRes?.publicURL ||
        publicRes?.data?.publicUrl ||
        publicRes?.data?.publicURL ||
        publicRes?.data?.public_url;

      if (!publicUrl) {
        logError("Could not resolve public URL", publicRes);
        throw new Error("Could not determine public URL. Ensure bucket is public or inspect logs.");
      }

      return { publicUrl, path: upData.path, uid };
    } catch (e) {
      logError("uploadToSupabaseAndGetUrl failed", e);
      throw e;
    }
  };

  // update staff.photo_url only
  const updateStaffPhoto = async (url) => {
    if (!staffId) {
      const msg = "staffId not provided";
      logError(msg);
      throw new Error(msg);
    }
    try {
      const { data, error } = await supabase.from("staff").update({ photo_url: url }).eq("id", staffId).select();
      logInfo("update staff.photo_url result", { data, error });
      if (error) {
        logError("updateStaffPhoto failed", error);
        throw new Error(error.message || "Failed to update staff.photo_url");
      }
      return data;
    } catch (e) {
      logError("updateStaffPhoto exception", e);
      throw e;
    }
  };

  const handleSave = async () => {
    setError("");
    if (!file) {
      const msg = "Choose an image to upload.";
      setError(msg);
      logWarn("handleSave called without file");
      return;
    }
    setUploading(true);

    try {
      const { publicUrl } = await uploadToSupabaseAndGetUrl(file);
      logInfo("Final publicUrl obtained", { publicUrl });

      // persist to staff.photo_url
      await updateStaffPhoto(publicUrl);

      // notify parent to update local state (if provided)
      if (updateStaffField) {
        try {
          await updateStaffField("photo_url", publicUrl);
          logInfo("updateStaffField callback invoked", { staffId });
        } catch (e) {
          logWarn("updateStaffField callback failed", e);
        }
      }

      onClose();
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg);
      logError("handleSave failed", { message: msg });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Change Profile Photo</h3>
          <button onClick={onClose} className="text-gray-600">✕</button>
        </div>

        <div className="space-y-4">
          <p className="text-xs">File size limit: 2MB</p>
          <input type="file" accept="image/*" onChange={pickFile} className="w-full border rounded-lg p-2" />

          {preview ? (
            <div className="mt-2 flex justify-center">
              <img src={preview} alt="preview" className="w-32 h-32 rounded-full object-cover border" />
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-500">No image selected</div>
          )}

          {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

          <div className="flex gap-3 justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 cursor-pointer">Cancel</button>
            <button
              onClick={handleSave}
              disabled={uploading || !file}
              className={`px-4 py-2 rounded-xl text-white cursor-pointer ${uploading || !file ? "bg-gray-400" : "bg-black"}`}
            >
              {uploading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
