// Shared by server and client code — keep this file free of server-only imports.

export const STAFF_FILES_BUCKET = "submissions";
export const STAFF_FILE_MAX_BYTES = 50 * 1024 * 1024;
export const STAFF_MAX_FILES = 5;

// Some browsers report an empty type (notably Office files on Windows), so
// the extension is the source of truth.
export const STAFF_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function staffFileType(fileName: string): string | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return STAFF_FILE_TYPES[ext] ?? null;
}

export const STAFF_FILE_ACCEPT = Object.keys(STAFF_FILE_TYPES).map((e) => `.${e}`).join(",");
