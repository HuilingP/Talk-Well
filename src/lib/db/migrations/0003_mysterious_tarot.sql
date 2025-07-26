ALTER TABLE "message" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "message" ADD COLUMN "content" text NOT NULL;--> statement-breakpoint
ALTER TABLE "message" DROP COLUMN "text";