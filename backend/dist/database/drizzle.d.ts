import * as schema from './schema.js';
declare const client: import("@libsql/client", { with: { "resolution-mode": "import" } }).Client;
export declare const db: import("drizzle-orm/libsql").LibSQLDatabase<typeof schema> & {
    $client: import("@libsql/client", { with: { "resolution-mode": "import" } }).Client;
};
export { client };
//# sourceMappingURL=drizzle.d.ts.map