"use client";

import { useState } from "react";

const MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.85;

// Phone photos are often 5-12MB, over Vercel's 4.5MB request limit for server
// actions. Downscale to a small JPEG in the browser before the form submits.
async function shrinkImage(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfilePhotoInput({ currentUrl, fullName }: { currentUrl: string | null; fullName: string }) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [status, setStatus] = useState<{ kind: "info" | "error"; text: string } | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setStatus({ kind: "info", text: "Preparing photo…" });
    try {
      const small = await shrinkImage(file);
      const dt = new DataTransfer();
      dt.items.add(small);
      input.files = dt.files;
      setPreview(URL.createObjectURL(small));
      setStatus({ kind: "info", text: "Photo ready. Click “Save changes” to upload it." });
    } catch {
      // Browser couldn't decode it (e.g. HEIC on desktop Chrome).
      input.value = "";
      setStatus({ kind: "error", text: "This image format isn't supported. Please choose a JPG or PNG photo." });
    }
  }

  return (
    <div className="flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={fullName} className="h-16 w-16 rounded-full object-cover ring-2 ring-gold/40" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-xl font-bold text-gold">
          {fullName.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <label htmlFor="photo" className="block text-sm font-medium text-slate-700">Profile photo</label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleChange}
          className="mt-1 block text-sm text-slate-600"
        />
        {status ? (
          <p className={`mt-0.5 text-xs ${status.kind === "error" ? "text-red-600" : "text-slate-500"}`}>{status.text}</p>
        ) : (
          <p className="mt-0.5 text-xs text-slate-400">Optional. JPG, PNG, or WEBP. Will be cropped to a circle.</p>
        )}
      </div>
    </div>
  );
}
