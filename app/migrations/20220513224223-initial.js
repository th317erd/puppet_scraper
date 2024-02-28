
const MIGRATION_ID = '20220513224223';

module.exports = {
  MIGRATION_ID,
  up: async function(connection) {

    try {
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_users" ("id" UUID NOT NULL , "role" VARCHAR(32) NOT NULL DEFAULT \'user\', "email" VARCHAR(64) NOT NULL, "first_name" VARCHAR(32) NOT NULL, "last_name" VARCHAR(32) NOT NULL, "auth_token" VARCHAR(64) NOT NULL, "webhook_url" VARCHAR(1024) NOT NULL, "webhook_secret" VARCHAR(128) NOT NULL, "derp" VARCHAR(256) NOT NULL, "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_role" ON "puppet_scraper_users" ("role")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_email" ON "puppet_scraper_users" ("email")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_first_name" ON "puppet_scraper_users" ("first_name")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_last_name" ON "puppet_scraper_users" ("last_name")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_auth_token" ON "puppet_scraper_users" ("auth_token")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_webhook_url" ON "puppet_scraper_users" ("webhook_url")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_webhook_secret" ON "puppet_scraper_users" ("webhook_secret")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_derp" ON "puppet_scraper_users" ("derp")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_sort_order" ON "puppet_scraper_users" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_created_at" ON "puppet_scraper_users" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_users_updated_at" ON "puppet_scraper_users" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_batches" ("id" UUID NOT NULL , "status" VARCHAR(16) NOT NULL DEFAULT \'initiated\', "done_accepting_requests_at" TIMESTAMP WITH TIME ZONE, "marked_received_at" TIMESTAMP WITH TIME ZONE, "locked_by" VARCHAR(18), "locked_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "error_message" VARCHAR(256), "webhook_success" BOOLEAN DEFAULT false, "webhook_success_at" TIMESTAMP WITH TIME ZONE, "webhook_failed_at" TIMESTAMP WITH TIME ZONE, "webhook_error_message" VARCHAR(256), "webhook_retry_count" INTEGER DEFAULT 0, "webhook_next_retry_atms" BIGINT DEFAULT 0, "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" UUID NOT NULL REFERENCES "puppet_scraper_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_status" ON "puppet_scraper_batches" ("status")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_done_accepting_requests_at" ON "puppet_scraper_batches" ("done_accepting_requests_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_marked_received_at" ON "puppet_scraper_batches" ("marked_received_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_locked_by" ON "puppet_scraper_batches" ("locked_by")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_locked_at" ON "puppet_scraper_batches" ("locked_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_completed_at" ON "puppet_scraper_batches" ("completed_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_failed_at" ON "puppet_scraper_batches" ("failed_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_webhook_success" ON "puppet_scraper_batches" ("webhook_success")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_webhook_success_at" ON "puppet_scraper_batches" ("webhook_success_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_webhook_failed_at" ON "puppet_scraper_batches" ("webhook_failed_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_webhook_retry_count" ON "puppet_scraper_batches" ("webhook_retry_count")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_webhook_next_retry_atms" ON "puppet_scraper_batches" ("webhook_next_retry_atms")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_sort_order" ON "puppet_scraper_batches" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_created_at" ON "puppet_scraper_batches" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_batches_updated_at" ON "puppet_scraper_batches" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_request_info" ("id" UUID NOT NULL , "method" VARCHAR(8) NOT NULL DEFAULT \'GET\', "url" VARCHAR(2100) NOT NULL, "scheme" VARCHAR(10) NOT NULL, "host" VARCHAR(512) NOT NULL, "port" INTEGER NOT NULL, "path" VARCHAR(1024) NOT NULL, "query" VARCHAR(1024), "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_method" ON "puppet_scraper_request_info" ("method")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_url" ON "puppet_scraper_request_info" ("url")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_scheme" ON "puppet_scraper_request_info" ("scheme")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_host" ON "puppet_scraper_request_info" ("host")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_port" ON "puppet_scraper_request_info" ("port")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_path" ON "puppet_scraper_request_info" ("path")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_query" ON "puppet_scraper_request_info" ("query")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_sort_order" ON "puppet_scraper_request_info" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_created_at" ON "puppet_scraper_request_info" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_request_info_updated_at" ON "puppet_scraper_request_info" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_caches" ("id" UUID NOT NULL , "raw_content" TEXT NOT NULL, "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "request_info_id" UUID NOT NULL REFERENCES "puppet_scraper_request_info" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_caches_sort_order" ON "puppet_scraper_caches" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_caches_created_at" ON "puppet_scraper_caches" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_caches_updated_at" ON "puppet_scraper_caches" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_cache_access" ("id" UUID NOT NULL , "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "user_id" UUID NOT NULL REFERENCES "puppet_scraper_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "cache_id" UUID NOT NULL REFERENCES "puppet_scraper_caches" ("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_cache_access_sort_order" ON "puppet_scraper_cache_access" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_cache_access_created_at" ON "puppet_scraper_cache_access" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_cache_access_updated_at" ON "puppet_scraper_cache_access" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_domain_meta" ("id" UUID NOT NULL , "domain" VARCHAR(1024) NOT NULL, "user_agent" VARCHAR(1024), "last_request_atms" BIGINT, "rate_limitms" INTEGER, "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "batch_id" UUID NOT NULL REFERENCES "puppet_scraper_batches" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_domain" ON "puppet_scraper_domain_meta" ("domain")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_user_agent" ON "puppet_scraper_domain_meta" ("user_agent")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_last_request_atms" ON "puppet_scraper_domain_meta" ("last_request_atms")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_sort_order" ON "puppet_scraper_domain_meta" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_created_at" ON "puppet_scraper_domain_meta" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_domain_meta_updated_at" ON "puppet_scraper_domain_meta" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_requests" ("id" UUID NOT NULL , "status" VARCHAR(16) NOT NULL DEFAULT \'initiated\', "locked_by" VARCHAR(18), "locked_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "error_message" VARCHAR(256), "fail_count" INTEGER DEFAULT 0, "next_retry_atms" BIGINT DEFAULT 0, "sort_order"   BIGSERIAL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "batch_id" UUID NOT NULL REFERENCES "puppet_scraper_batches" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT, "user_id" UUID NOT NULL REFERENCES "puppet_scraper_users" ("id") ON DELETE CASCADE ON UPDATE CASCADE, "request_info_id" UUID NOT NULL REFERENCES "puppet_scraper_request_info" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_status" ON "puppet_scraper_requests" ("status")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_locked_by" ON "puppet_scraper_requests" ("locked_by")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_locked_at" ON "puppet_scraper_requests" ("locked_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_completed_at" ON "puppet_scraper_requests" ("completed_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_failed_at" ON "puppet_scraper_requests" ("failed_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_fail_count" ON "puppet_scraper_requests" ("fail_count")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_next_retry_atms" ON "puppet_scraper_requests" ("next_retry_atms")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_sort_order" ON "puppet_scraper_requests" ("sort_order")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_created_at" ON "puppet_scraper_requests" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_requests_updated_at" ON "puppet_scraper_requests" ("updated_at")');
      await connection.query('CREATE TABLE IF NOT EXISTS "puppet_scraper_migrations" ("id" VARCHAR(15) NOT NULL , "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, PRIMARY KEY ("id"));');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_migrations_id" ON "puppet_scraper_migrations" ("id")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_migrations_created_at" ON "puppet_scraper_migrations" ("created_at")');
      await connection.query('CREATE INDEX CONCURRENTLY "puppet_scraper_migrations_updated_at" ON "puppet_scraper_migrations" ("updated_at")');
    } finally {

    }
  },
  down: async function(connection) {

    try {
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_migrations_id"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_migrations_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_migrations_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_migrations";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_status"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_locked_by"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_locked_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_completed_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_failed_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_fail_count"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_next_retry_atms"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_requests_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_requests";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_domain"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_user_agent"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_last_request_atms"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_domain_meta_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_domain_meta";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_cache_access_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_cache_access_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_cache_access_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_cache_access";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_caches_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_caches_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_caches_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_caches";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_method"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_url"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_scheme"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_host"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_port"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_path"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_query"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_request_info_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_request_info";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_status"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_done_accepting_requests_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_marked_received_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_locked_by"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_locked_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_completed_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_failed_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_webhook_success"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_webhook_success_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_webhook_failed_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_webhook_retry_count"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_webhook_next_retry_atms"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_batches_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_batches";');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_role"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_email"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_first_name"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_last_name"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_auth_token"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_webhook_url"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_webhook_secret"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_derp"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_sort_order"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_created_at"');
      await connection.query('DROP INDEX IF EXISTS "puppet_scraper_users_updated_at"');
      await connection.query('DROP TABLE IF EXISTS "puppet_scraper_users";');
    } finally {

    }
  },
};
