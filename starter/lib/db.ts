import { Pool } from "pg";

declare global {
  var __starterPool: Pool | undefined;
}

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Falta DATABASE_URL. Copia .env.example a .env.local.");
  }
  globalThis.__starterPool ??= new Pool({ connectionString });
  return globalThis.__starterPool;
}
