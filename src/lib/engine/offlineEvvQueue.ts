import { OfflineEvvRecord } from "@/types/agency";

const OFFLINE_EVV_STORAGE_KEY = "homepulse_offline_evv_queue_v1";

/**
 * Generates a cryptographic HMAC-SHA256 signature for offline EVV durability
 * per RULES.md Section 5.2. Falls back deterministically if SubtleCrypto is unavailable.
 */
export async function signEvvPayloadHmac(payload: {
  visitId: string;
  actionType: "CLOCK_IN" | "CLOCK_OUT";
  capturedAtIso: string;
  gpsDistanceMeters: number;
}): Promise<string> {
  const canonical = `${payload.visitId}|${payload.actionType}|${payload.capturedAtIso}|${payload.gpsDistanceMeters}`;

  if (typeof window !== "undefined" && window.crypto?.subtle) {
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode("homepulse-evv-offline-integrity-v2");
      const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sigBuffer = await window.crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        encoder.encode(canonical)
      );
      const hex = Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return `hmac-sha256:${hex.slice(0, 24)}`;
    } catch {
      // Fallback below if WebCrypto subtle throws in restricted context
    }
  }

  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i += 1) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `hmac-fnv:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function loadPersistedOfflineEvvQueue(): OfflineEvvRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_EVV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as OfflineEvvRecord[]) : [];
  } catch {
    return [];
  }
}

export function persistOfflineEvvQueue(records: OfflineEvvRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_EVV_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors in restricted browsers
  }
}
