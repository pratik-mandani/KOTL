/**
 * KOTL Persistent Storage Abstraction & Safe File Handler
 *
 * Provides resilient, atomic JSON file reading and writing with:
 * - Environment variable path overrides (DATA_DIR / UPLOADS_DIR)
 * - Safe handling of empty files (0 bytes) without crashing
 * - Safe handling of malformed JSON with automatic corruption backup (prevents data loss)
 * - Atomic write operations using temporary files to prevent truncated writes on process crashes
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_UPLOADS_DIR = path.join(__dirname, "..", "uploads");

/**
 * Resolves the active data storage directory.
 * Priority: DATA_DIR > UPLOADS_DIR > local backend/uploads
 */
function getDataDir() {
  const dir = (process.env.DATA_DIR || process.env.UPLOADS_DIR || DEFAULT_UPLOADS_DIR).trim();
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn(`[Storage] Warning: Failed to create data dir "${dir}":`, err.message);
    }
  }
  return dir;
}

/**
 * Resolves absolute file path within the active data directory.
 */
function getFilePath(filename) {
  return path.join(getDataDir(), filename);
}

/**
 * Reads and parses a JSON file safely.
 * If file is missing or empty, returns defaultFallback.
 * If file contains malformed JSON, backs up the corrupted file and returns defaultFallback
 * WITHOUT destructively overwriting the original file on disk.
 */
function readJsonFileSafe(filePath, defaultFallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return Array.isArray(defaultFallback) ? [...defaultFallback] : (typeof defaultFallback === "object" && defaultFallback !== null ? { ...defaultFallback } : defaultFallback);
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw || !raw.trim()) {
      return Array.isArray(defaultFallback) ? [...defaultFallback] : (typeof defaultFallback === "object" && defaultFallback !== null ? { ...defaultFallback } : defaultFallback);
    }

    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn(`[Storage] Warning: Failed to parse JSON file "${filePath}": ${err.message}`);
    // Non-destructive preservation: back up corrupted file so data is never lost
    try {
      const backupPath = `${filePath}.corrupt.${Date.now()}`;
      fs.copyFileSync(filePath, backupPath);
      console.warn(`[Storage] Preserved corrupted file backup at "${backupPath}"`);
    } catch (_) {}

    return Array.isArray(defaultFallback) ? [...defaultFallback] : (typeof defaultFallback === "object" && defaultFallback !== null ? { ...defaultFallback } : defaultFallback);
  }
}

/**
 * Writes data to a JSON file safely using an atomic temporary file pattern.
 */
function writeJsonFileSafe(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const tempPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;

    fs.writeFileSync(tempPath, jsonStr, "utf-8");

    try {
      fs.renameSync(tempPath, filePath);
    } catch (renameErr) {
      // Fallback on Windows if target file is temporarily locked by another reader
      fs.copyFileSync(tempPath, filePath);
      try {
        fs.unlinkSync(tempPath);
      } catch (_) {}
    }

    return true;
  } catch (err) {
    console.error(`[Storage] Error writing JSON file "${filePath}":`, err.message);
    return false;
  }
}

module.exports = {
  getDataDir,
  getFilePath,
  readJsonFileSafe,
  writeJsonFileSafe,
  DEFAULT_UPLOADS_DIR
};
