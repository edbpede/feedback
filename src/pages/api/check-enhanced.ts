/**
 * @fileoverview Endpoint to check enhanced-quality model configuration and authentication status.
 * Returns whether enhanced quality is configured (password hash set) and whether the
 * current user is authenticated to access it.
 *
 * @route GET /api/check-enhanced
 */

import type { APIRoute } from "astro";
import { SESSION_SECRET, ENHANCED_QUALITY_PASSWORD_HASH } from "astro:env/server";
import type { ApiResponse, EnhancedConfigResponse } from "@lib/types";
import { verifyToken } from "@lib/auth";

/**
 * Checks enhanced-quality configuration and authentication status.
 *
 * @returns 200 with { configured: boolean, authenticated: boolean }
 *   - configured: true if ENHANCED_QUALITY_PASSWORD_HASH env var is set
 *   - authenticated: true if user has valid enhanced-session cookie, or if not configured
 */
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
