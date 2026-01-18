/** @type { import("drizzle-kit").Config } */
module.exports = {
    schema: './database/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'file:./local.db',
    },
};
