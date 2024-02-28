
const MIGRATION_ID = '20220513224454';

module.exports = {
  MIGRATION_ID,
  up: async function(connection) {
    await connection.query('SET CONSTRAINTS ALL DEFERRED;');
    try {
      await connection.query('ALTER TABLE "puppet_scraper_domain_meta" DROP CONSTRAINT "puppet_scraper_domain_meta_batch_id_fkey"');
      await connection.query('ALTER TABLE "public"."puppet_scraper_domain_meta" DROP COLUMN "batch_id";');
    } finally {
      await connection.query('SET CONSTRAINTS ALL IMMEDIATE;');
    }
  },
  down: async function(connection) {
    await connection.query('SET CONSTRAINTS ALL DEFERRED;');
    try {
      await connection.query('ALTER TABLE "public"."puppet_scraper_domain_meta" ADD COLUMN "batch_id" UUID NOT NULL DEFAULT NULL;');
      await connection.query('ALTER TABLE "puppet_scraper_domain_meta" ADD CONSTRAINT "puppet_scraper_domain_meta_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "puppet_scraper_batches" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;');
    } finally {
      await connection.query('SET CONSTRAINTS ALL IMMEDIATE;');
    }
  },
};
