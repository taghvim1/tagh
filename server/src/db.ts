import postgres from 'postgres'

export interface Db { ping(): Promise<void>; close(): Promise<void> }

/** اتصال تنبل: تا اولین ping/کوئری هیچ اتصالی باز نمی‌شود. نشانی اتصال هرگز لاگ نمی‌شود. */
export function createDb(url: string): Db {
  const sql = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 5, onnotice: () => undefined })
  return {
    ping: async () => { await sql`select 1` },
    close: () => sql.end({ timeout: 5 }),
  }
}
