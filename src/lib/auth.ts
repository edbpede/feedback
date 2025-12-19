import { createHmac, timingSafeEqual } from "node:crypto";

/** Maximum token age: 7 days in milliseconds */
export const MAX_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * Sign a payload with HMAC-SHA256 to create a token.
 * Returns the token in the format: payload.signature
 */
export function signToken(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verify a signed token using timing-safe comparison.
 * Validates both signature integrity and token expiration.
 */
export function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");

  // Use timing-safe comparison to prevent timing attacks
  try {
    const signaturesMatch = timingSafeEqual(
      Buffer.from(signature, "base64url"),
      Buffer.from(expectedSignature, "base64url")
    );
    if (!signaturesMatch) return false;
  } catch {
    return false; // Different lengths
  }

  // Validate payload structure and expiration
  const colonIndex = payload.indexOf(":");
  if (colonIndex === -1) return false;
  const timestamp = parseInt(payload.slice(colonIndex + 1), 10);
  if (isNaN(timestamp)) return false;
  const tokenAge = Date.now() - timestamp;
  return tokenAge >= 0 && tokenAge <= MAX_TOKEN_AGE;
}
