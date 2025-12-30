export const dynamic = "force-dynamic";

import { validateToken } from "../validateToken";
import { clearAllCache } from "../cache";

export async function GET(req) {
  try {
    // Prevent unauthorized cache reset
    // await validateToken(req);

    // Clear everything
    clearAllCache();

    return new Response(
      JSON.stringify({
        status: true,
        message: "All caches cleared successfully.",
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Error clearing cache:", err);

    return new Response(
      JSON.stringify({
        status: false,
        message: err.message || "Internal Server Error",
      }),
      { status: 500 }
    );
  }
}

export default GET;
