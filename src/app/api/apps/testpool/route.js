import { NextResponse } from 'next/server';

import db from '../db'; // adjust path if needed
import { getPoolStats } from '../db';

export async function GET() {
  // Run stress test if you want:
  const promises = [];

  for (let i = 0; i < 10; i++) {
    promises.push(db.query("SELECT SLEEP(1)"));
  }

  await Promise.all(promises);

  return NextResponse.json({
    status: true,
    message: "Pool stats",
    data: getPoolStats()
  });
}
