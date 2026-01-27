import 'dotenv/config';
import * as schema from './schema.js';
declare const client: import("@libsql/client").Client;
export declare const db: import("drizzle-orm/libsql").LibSQLDatabase<typeof schema> & {
    $client: import("@libsql/client").Client;
};
export { client };
//# sourceMappingURL=drizzle.d.ts.map