import mysql from "mysql2/promise";

const globalForMySQL = globalThis;

if (!globalForMySQL.pool) {
  console.log("Creating MySQL pool...");

  globalForMySQL.pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 5000,

    supportBigNumbers: true,
    bigNumberStrings: false,

    typeCast(field, next) {
      if (field.type === "BIT" && field.length === 1) {
        const bytes = field.buffer();

        return bytes ? bytes[0] === 1 : 0;
      }

      return next();
    }
  });
}

const pool = globalForMySQL.pool;

  //  AUTO RELEASE QUERY WRAPPER
export async function query(sql, params = []) {
  const conn = await pool.getConnection();

  try {
    const [results] = await conn.query(sql, params);


    if (Array.isArray(results) && Array.isArray(results[0])) {
      return results[0];
    }

    return results;
  } finally {
    conn.release();
  }
}


  //  AUTO RELEASE TRANSACTION WRAPPER
export async function transaction(callback) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const result = await callback(conn);

    await conn.commit();

    return result;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

  //  HEALTH CHECK
export async function checkDatabaseHealth() {
  try {
    const conn = await pool.getConnection();

    await conn.ping();
    conn.release();

    return { healthy: true };
  } catch (e) {
    return { healthy: false, error: e.message };
  }
}

  //  POOL METRICS
export function getPoolStats() {
  return {
    total: pool.pool._allConnections.length,
    free: pool.pool._freeConnections.length,
    active: pool.pool._allConnections.length - pool.pool._freeConnections.length,
    queue: pool.pool._connectionQueue.length,
    limit: pool.pool._connectionLimit
  };
}


export default { query, transaction };
