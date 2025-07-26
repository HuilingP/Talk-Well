CREATE TABLE "message" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text,
	"user_type" text NOT NULL,
	"text" text NOT NULL,
	"analysis_id" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_analysis" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"is_cross_net" text NOT NULL,
	"sender_state" text NOT NULL,
	"receiver_impact" text NOT NULL,
	"evidence" text NOT NULL,
	"suggestion" text NOT NULL,
	"risk" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"created_by_id" text,
	"player1_score" integer DEFAULT 0 NOT NULL,
	"player2_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_analysis" ADD CONSTRAINT "message_analysis_message_id_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;