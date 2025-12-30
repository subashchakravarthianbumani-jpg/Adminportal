import { NextResponse } from "next/server";

import { checkDatabaseHealth, getPoolStats } from "../db.js";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const poolStats = getPoolStats();

  return NextResponse.json({
    status: dbHealth.healthy ? "healthy" : "unhealthy",
    database: dbHealth,
    pool: poolStats,
    timestamp: new Date().toISOString(),
  });
}
