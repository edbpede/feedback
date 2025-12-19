import type { APIRoute } from "astro";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_SECRET, NANO_GPT_API_KEY } from "astro:env/server";
import type { ApiResponse, BalanceResponse } from "@lib/types";

/** Maximum token age: 7 days in milliseconds */
const MAX_TOKEN_AGE = 7 * 24 * 60 * 60 * 1000;

function verifyToken(token: string, secret: string): boolean {
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

export const POST: APIRoute = async ({ cookies }) => {
  // Verify session (same pattern as chat.ts)
  const sessionCookie = cookies.get("session")?.value;
  if (!sessionCookie || !verifyToken(sessionCookie, SESSION_SECRET)) {
    const response: ApiResponse<never> = {
      success: false,
      error: "Unauthorized",
    };
    return new Response(JSON.stringify(response), { status: 401 });
  }

  try {
    // Call NanoGPT check-balance endpoint (uses /api path, not /api/v1)
    const balanceResponse = await fetch("https://nano-gpt.com/api/check-balance", {
      method: "POST",
      headers: {
        "x-api-key": NANO_GPT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!balanceResponse.ok) {
      const errorText = await balanceResponse.text();
      console.error("Balance API error:", {
        status: balanceResponse.status,
        body: errorText,
      });

      const response: ApiResponse<never> = {
        success: false,
        error: `Balance check failed: ${balanceResponse.status}`,
      };
      return new Response(JSON.stringify(response), {
        status: balanceResponse.status,
      });
    }

    const data = await balanceResponse.json();

    // NanoGPT returns usd_balance as a string (e.g., "129.46956147")
    const balance = typeof data.usd_balance === "string" ? parseFloat(data.usd_balance) : 0;

    const response: ApiResponse<BalanceResponse> = {
      success: true,
      data: { balance },
    };
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error("Balance API internal error:", error);
    const response: ApiResponse<never> = {
      success: false,
      error: "Failed to check balance",
    };
    return new Response(JSON.stringify(response), { status: 500 });
  }
};
