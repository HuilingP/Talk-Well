import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").$defaultFn(() => false).notNull(),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => /* @__PURE__ */ new Date()),
});

export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  plan: text("plan").notNull(),
  referenceId: text("reference_id").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").default("incomplete"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end"),
  seats: integer("seats"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
});

export const room = pgTable("room", {
  id: text("id").primaryKey(),
  createdById: text("created_by_id").references(() => user.id, { onDelete: "cascade" }),
  player1Score: integer("player1_score").default(0).notNull(),
  player2Score: integer("player2_score").default(0).notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().references(() => room.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  username: text("username").notNull(),
  userType: text("user_type").notNull(), // "You" or "Friend"
  content: text("content").notNull(),
  analysisId: text("analysis_id"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const messageAnalysis = pgTable("message_analysis", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull().references(() => message.id, { onDelete: "cascade" }),
  isCrossNet: text("is_cross_net").notNull(),
  senderState: text("sender_state").notNull(),
  receiverImpact: text("receiver_impact").notNull(),
  evidence: text("evidence").notNull(),
  suggestion: text("suggestion").notNull(),
  risk: text("risk").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

// Interview & Agent schema
export const interviewSession = pgTable("interview_session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  // Collected fields
  emotion: text("emotion"),
  trigger: text("trigger"),
  expectation: text("expectation"),
  value: text("value"),
  thinking_pattern: text("thinking_pattern"),
  core_belief: text("core_belief"),
  sensitivity: text("sensitivity"),
  pain_point: text("pain_point"),
  relationship_pattern: text("relationship_pattern"),
  
  // Session state
  currentQuestion: text("current_question"),
  currentQuestionId: text("current_question_id"),
  conversationHistory: text("conversation_history"), // JSON stringified
  status: text("status").default("in_progress"), // "in_progress", "completed", "abandoned"
  
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const agent = pgTable("agent", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  interviewSessionId: text("interview_session_id").notNull().references(() => interviewSession.id, { onDelete: "cascade" }),
  
  // Agent profile data (collected from interview)
  emotion: text("emotion").notNull(),
  trigger: text("trigger").notNull(),
  expectation: text("expectation").notNull(),
  value: text("value").notNull(),
  thinking_pattern: text("thinking_pattern").notNull(),
  core_belief: text("core_belief").notNull(),
  sensitivity: text("sensitivity").notNull(),
  pain_point: text("pain_point").notNull(),
  relationship_pattern: text("relationship_pattern").notNull(),
  
  // System prompt for this agent
  systemPrompt: text("system_prompt").notNull(),
  
  // Metadata
  name: text("name"),
  avatar: text("avatar"),
  
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
});

export const agentMessage = pgTable("agent_message", {
  id: text("id").primaryKey(),
  agentId: text("agent_id").notNull().references(() => agent.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  
  role: text("role").notNull(), // "user" or "assistant"
  content: text("content").notNull(),
  
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});
