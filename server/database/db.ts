import { randomUUID } from "crypto";
import { Pool } from "pg";
import { env } from "../env";

const pool = new Pool({
  host: process.env.NODE_ENV === "production" ? env.PGHOST : "localhost",
  port: process.env.NODE_ENV === "production" ? Number(env.PGPORT) : 6543,
  user: process.env.NODE_ENV === "production" ? env.PGUSER : "test",
  password: process.env.NODE_ENV === "production" ? env.PGPASSWORD : "test",
  database: process.env.NODE_ENV === "production" ? env.PGDATABASE : "test",
  // host: env.PGHOST,
  // port: Number(env.PGPORT),
  // user: env.PGUSER,
  // password: env.PGPASSWORD,
  // database: env.PGDATABASE,

  max: 20,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});

/**
 *
 * @param {String} text - The Text of the Query to be Executed (SQL CODE).
 * @param {String} params - The Parameters to be Passed with the Query. ie $1 $2, etc..
 *
 * credit: https://node-postgres.com/guides/project-structure#example
 * @example
 * postgresQuery(`SELECT * FROM "User"`, [])
  .then((res) => {
    console.table(res.rows);
  })
  .catch((err) => {
    console.log(err);
  });
 * 
 * @returns Promise of postgres query result
 */
export const postgresQuery = async (text: string, params: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("executed,  query", { text, duration, rows: res.rowCount });
  return { rows: res.rows, rowCount: res.rowCount };
};

// export default {
//   async query(text: string, params: any[]) {
//     const start = Date.now();
//     const res = await pool.query(text, params);
//     const duration = Date.now() - start;
//     console.log("executed query", { text, duration, rows: res.rowCount });
//     return res;
//   },
// };
