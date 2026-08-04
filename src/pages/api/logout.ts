import type { ApiResponse } from "@lib/types";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete("session", { path: "/" });

  const response: ApiResponse<{ message: string }> = {
    success: true,
    data: { message: "Logged out" },
  };
  return new Response(JSON.stringify(response), { status: 200 });
};
