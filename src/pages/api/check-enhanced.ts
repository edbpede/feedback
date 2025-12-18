import type { APIRoute } from "astro";
import { createHmac } from "node:crypto";
import { SESSION_SECRET, ENHANCED_QUALITY_PASSWORD_HASH } from "astro:env/server";
import type { ApiResponse, EnhancedConfigResponse } from "@lib/types";

function verifyToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  return signature === expectedSignature;
}

export const GET: APIRoute = async ({ cookies }) => {
  // Check if enhanced quality is configured (env var is set)
  const configured = Boolean(ENHANCED_QUALITY_PASSWORD_HASH);

  // Check if user can access enhanced quality:
  // - If no password hash is configured, freely available (authenticated = true)
  // - If password hash is set, check for valid session
  const enhancedSessionCookie = cookies.get("enhanced-session")?.value;
  const authenticated = configured
    ? enhancedSessionCookie !== undefined && verifyToken(enhancedSessionCookie, SESSION_SECRET)
    : true;

  const response: ApiResponse<EnhancedConfigResponse> = {
    success: true,
    data: { configured, authenticated },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
