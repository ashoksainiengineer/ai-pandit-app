
import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email").unique().notNull(),
  fullName: text("full_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const rectificationRequests = sqliteTable("rectification_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

export const birthData = sqliteTable("birth_data", {
  id: text("id").primaryKey(),
  requestId: text("request_id").unique().notNull().references(() => rectificationRequests.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  tentativeTime: text("tentative_time").notNull(),
  timeUncertainty: text("time_uncertainty").notNull(),
  birthPlace: text("birth_place").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  timezone: text("timezone").notNull(),
  gender: text("gender").notNull(),
  maritalStatus: text("marital_status"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const physicalDescriptions = sqliteTable("physical_descriptions", {
  id: text("id").primaryKey(),
  requestId: text("request_id").unique().notNull().references(() => rectificationRequests.id, { onDelete: "cascade" }),
  bodyStructure: text("body_structure"),
  height: text("height"),
  faceShape: text("face_shape"),
  complexion: text("complexion"),
  distinctiveFeatures: text("distinctive_features"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const lifeEvents = sqliteTable("life_events", {
  id: text("id").primaryKey(),
  requestId: text("request_id").notNull().references(() => rectificationRequests.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventDate: text("event_date").notNull(),
  eventDetails: text("event_details"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const rectificationResults = sqliteTable("rectification_results", {
  id: text("id").primaryKey(),
  requestId: text("request_id").unique().notNull().references(() => rectificationRequests.id, { onDelete: "cascade" }),
  rectifiedBirthTime: text("rectified_birth_time").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  ascendantSign: text("ascendant_sign").notNull(),
  moonSign: text("moon_sign").notNull(),
  sunSign: text("sun_sign").notNull(),
  aiSummaryReport: text("ai_summary_report").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const timeSlotCandidates = sqliteTable("time_slot_candidates", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => rectificationResults.id, { onDelete: "cascade" }),
  timeSlot: text("time_slot").notNull(),
  ascendantAtSlot: text("ascendant_at_slot").notNull(),
  score: real("score").notNull(),
  evaluationNotes: text("evaluation_notes"),
  isBestCandidate: integer("is_best_candidate").notNull().default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const dashaPeriods = sqliteTable("dasha_periods", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => rectificationResults.id, { onDelete: "cascade" }),
  eventId: text("event_id").references(() => lifeEvents.id, { onDelete: "set null" }),
  dashaSystem: text("dasha_system").notNull().default("Vimshottari"),
  majorLord: text("major_lord").notNull(),
  subLord: text("sub_lord").notNull(),
  subSubLord: text("sub_sub_lord"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  isActiveDuringEvent: integer("is_active_during_event"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const advancedVerifications = sqliteTable("advanced_verifications", {
  id: text("id").primaryKey(),
  resultId: text("result_id").notNull().references(() => rectificationResults.id, { onDelete: "cascade" }),
  methodName: text("method_name").notNull(),
  isConsistent: integer("is_consistent").notNull(),
  details: text("details"),
  scoreImpact: real("score_impact"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const calculations = sqliteTable("calculations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  birthData: text("birth_data"),
  timeRange: text("time_range"),
  results: text("results"),
  aiSummary: text("ai_summary"),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});
