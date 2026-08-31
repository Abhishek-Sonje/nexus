CREATE TYPE "public"."attribute_type" AS ENUM('device_fingerprint', 'payout_account');--> statement-breakpoint
CREATE TYPE "public"."entity_category" AS ENUM('food', 'retail', 'services', 'electronics', 'transport', 'healthcare');--> statement-breakpoint
CREATE TYPE "public"."dataset_kind" AS ENUM('tuning', 'held_out', 'demo');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('merchant', 'individual');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('shared_device', 'shared_payout_account', 'fast_flow');--> statement-breakpoint
CREATE TYPE "public"."kyc_tier" AS ENUM('basic', 'standard', 'enhanced');--> statement-breakpoint
CREATE TYPE "public"."narrative_status" AS ENUM('pending', 'generated', 'fallback', 'failed');--> statement-breakpoint
CREATE TYPE "public"."onboarding_channel" AS ENUM('aggregator', 'direct');--> statement-breakpoint
CREATE TYPE "public"."run_mode" AS ENUM('tune', 'evaluate', 'score');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ground_truth_kind" AS ENUM('ring', 'legitimate_dense', 'isolated');--> statement-breakpoint
CREATE TABLE "access_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"event_type" text NOT NULL,
	"request_id" text NOT NULL,
	"remote_hash" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"detector_profile_id" uuid,
	"mode" "run_mode" NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"random_seed" text NOT NULL,
	"code_version" text NOT NULL,
	"input_checksum" text NOT NULL,
	"output_checksum" text,
	"stage_timings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"failure_code" text,
	"failure_summary" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute_values" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"type" "attribute_type" NOT NULL,
	"value_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"run_id" uuid NOT NULL,
	"ordinal" integer NOT NULL,
	"modularity" real NOT NULL,
	"member_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"community_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	CONSTRAINT "community_members_community_id_entity_id_pk" PRIMARY KEY("community_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "community_scores" (
	"community_id" uuid PRIMARY KEY NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(6, 3) NOT NULL,
	"risk_band" text NOT NULL,
	"flagged" boolean NOT NULL,
	"features" jsonb NOT NULL,
	"explanation" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"kind" "dataset_kind" NOT NULL,
	"seed" text NOT NULL,
	"generator_version" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"ready" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detector_profiles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"version" text NOT NULL,
	"source_run_id" uuid,
	"configuration" jsonb NOT NULL,
	"checksum" text NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"type" "entity_type" NOT NULL,
	"display_name" text NOT NULL,
	"category" "entity_category" NOT NULL,
	"kyc_tier" "kyc_tier" NOT NULL,
	"onboarded_via" "onboarding_channel" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_attribute_links" (
	"entity_id" uuid NOT NULL,
	"attribute_value_id" uuid NOT NULL,
	"first_observed_at" timestamp with time zone NOT NULL,
	"last_observed_at" timestamp with time zone NOT NULL,
	CONSTRAINT "entity_attribute_links_entity_id_attribute_value_id_pk" PRIMARY KEY("entity_id","attribute_value_id")
);
--> statement-breakpoint
CREATE TABLE "evaluation_points" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"run_id" uuid NOT NULL,
	"threshold" real NOT NULL,
	"precision" real NOT NULL,
	"recall" real NOT NULL,
	"review_cost_paise" bigint NOT NULL,
	"missed_exposure_paise" bigint NOT NULL,
	"total_cost_paise" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_summaries" (
	"run_id" uuid PRIMARY KEY NOT NULL,
	"summary" jsonb NOT NULL,
	"synthetic_disclosure" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence_edges" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"run_id" uuid NOT NULL,
	"source_entity_id" uuid NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"type" "evidence_type" NOT NULL,
	"directed" boolean DEFAULT false NOT NULL,
	"raw_value" real NOT NULL,
	"contribution" real NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ground_truth_groups" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"kind" "ground_truth_kind" NOT NULL,
	"label" text NOT NULL,
	"estimated_exposure_paise" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ground_truth_members" (
	"group_id" uuid NOT NULL,
	"entity_id" uuid NOT NULL,
	CONSTRAINT "ground_truth_members_group_id_entity_id_pk" PRIMARY KEY("group_id","entity_id")
);
--> statement-breakpoint
CREATE TABLE "narratives" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"community_id" uuid NOT NULL,
	"status" "narrative_status" NOT NULL,
	"model_code" text NOT NULL,
	"prompt_version" text NOT NULL,
	"structured_response" jsonb,
	"fallback_text" text NOT NULL,
	"latency_ms" integer,
	"input_tokens" integer,
	"output_tokens" integer,
	"error_category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"dataset_id" uuid NOT NULL,
	"external_reference" text NOT NULL,
	"from_entity_id" uuid NOT NULL,
	"to_entity_id" uuid NOT NULL,
	"amount_paise" bigint NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_detector_profile_id_detector_profiles_id_fk" FOREIGN KEY ("detector_profile_id") REFERENCES "public"."detector_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_run_id_analysis_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_scores" ADD CONSTRAINT "community_scores_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_attribute_links" ADD CONSTRAINT "entity_attribute_links_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_attribute_links" ADD CONSTRAINT "entity_attribute_links_attribute_value_id_attribute_values_id_fk" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_points" ADD CONSTRAINT "evaluation_points_run_id_analysis_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_summaries" ADD CONSTRAINT "evaluation_summaries_run_id_analysis_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_edges" ADD CONSTRAINT "evidence_edges_run_id_analysis_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."analysis_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_edges" ADD CONSTRAINT "evidence_edges_source_entity_id_entities_id_fk" FOREIGN KEY ("source_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence_edges" ADD CONSTRAINT "evidence_edges_target_entity_id_entities_id_fk" FOREIGN KEY ("target_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ground_truth_groups" ADD CONSTRAINT "ground_truth_groups_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ground_truth_members" ADD CONSTRAINT "ground_truth_members_group_id_ground_truth_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ground_truth_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ground_truth_members" ADD CONSTRAINT "ground_truth_members_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "narratives" ADD CONSTRAINT "narratives_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_dataset_id_datasets_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_from_entity_id_entities_id_fk" FOREIGN KEY ("from_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_to_entity_id_entities_id_fk" FOREIGN KEY ("to_entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_events_created_idx" ON "access_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "analysis_runs_dataset_created_idx" ON "analysis_runs" USING btree ("dataset_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "attribute_value_dataset_type_hash_unique" ON "attribute_values" USING btree ("dataset_id","type","value_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "community_run_ordinal_unique" ON "communities" USING btree ("run_id","ordinal");--> statement-breakpoint
CREATE INDEX "community_scores_rank_idx" ON "community_scores" USING btree ("rank");--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_kind_seed_unique" ON "datasets" USING btree ("kind","seed");--> statement-breakpoint
CREATE UNIQUE INDEX "datasets_checksum_unique" ON "datasets" USING btree ("checksum");--> statement-breakpoint
CREATE UNIQUE INDEX "detector_profiles_checksum_unique" ON "detector_profiles" USING btree ("checksum");--> statement-breakpoint
CREATE INDEX "entities_dataset_idx" ON "entities" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "evaluation_points_run_idx" ON "evaluation_points" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "evidence_edges_run_idx" ON "evidence_edges" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "truth_groups_dataset_idx" ON "ground_truth_groups" USING btree ("dataset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "narrative_community_prompt_model_unique" ON "narratives" USING btree ("community_id","prompt_version","model_code");--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_dataset_reference_unique" ON "transactions" USING btree ("dataset_id","external_reference");--> statement-breakpoint
CREATE INDEX "transaction_dataset_time_idx" ON "transactions" USING btree ("dataset_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transaction_from_idx" ON "transactions" USING btree ("from_entity_id");--> statement-breakpoint
CREATE INDEX "transaction_to_idx" ON "transactions" USING btree ("to_entity_id");