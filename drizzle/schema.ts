import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, decimal, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Student profile information extended from user account
 */
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  middleName: varchar("middleName", { length: 100 }),
  surname: varchar("surname", { length: 100 }).notNull(),
  studentId: varchar("studentId", { length: 50 }).notNull().unique(),
  age: int("age"),
  address: text("address"),
  course: varchar("course", { length: 150 }),
  yearLevel: int("yearLevel"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = typeof studentProfiles.$inferInsert;

/**
 * Image submissions for dental analysis
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  imageKey: varchar("imageKey", { length: 255 }).notNull(),
  imageUrl: text("imageUrl").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 50 }).notNull(),
  fileSize: int("fileSize").notNull(),
  imageQuality: mysqlEnum("imageQuality", ["good", "fair", "poor"]).default("good"),
  status: mysqlEnum("status", ["pending", "analyzing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * ML analysis results for submissions
 */
export interface DetectedIssue {
  type: "cavity" | "decay" | "crack" | "plaque" | "inflammation" | "healthy";
  location: string; // tooth number (1-32)
  severity: "low" | "moderate" | "high";
  confidence: number; // 0.0-1.0
  description: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export const analysisResults = mysqlTable("analysis_results", {
  id: int("id").autoincrement().primaryKey(),
  submissionId: int("submissionId").notNull().unique(),
  userId: int("userId").notNull(),
  detectedIssues: json("detectedIssues").$type<DetectedIssue[]>().notNull(),
  overallSeverity: mysqlEnum("overallSeverity", ["low", "moderate", "high"]).notNull(),
  recommendations: json("recommendations").$type<Recommendation[]>().notNull(),
  disclaimer: text("disclaimer").notNull(),
  mlModelVersion: varchar("mlModelVersion", { length: 50 }).notNull(),
  processingTime: int("processingTime").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = typeof analysisResults.$inferInsert;

/**
 * Admin audit logs for compliance and monitoring
 */
export interface AdminLogDetails {
  [key: string]: unknown;
}

export const adminLogs = mysqlTable("admin_logs", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  targetUserId: int("targetUserId"),
  details: json("details").$type<AdminLogDetails>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;

/**
 * Analytics events for usage tracking and insights
 */
export interface AnalyticsMetadata {
  [key: string]: unknown;
}

export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  userId: int("userId"),
  metadata: json("metadata").$type<AnalyticsMetadata>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Email notifications tracking
 */
export const emailNotifications = mysqlTable("email_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  submissionId: int("submissionId"),
  notificationType: mysqlEnum("notificationType", ["analysis_complete", "critical_finding", "system_alert"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

/**
 * Relations for type safety and query optimization
 */
export const userRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  submissions: many(submissions),
  analysisResults: many(analysisResults),
  adminLogs: many(adminLogs),
  emailNotifications: many(emailNotifications),
}));

export const studentProfileRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
}));

export const submissionRelations = relations(submissions, ({ one, many }) => ({
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
  analysisResult: one(analysisResults, {
    fields: [submissions.id],
    references: [analysisResults.submissionId],
  }),
  emailNotifications: many(emailNotifications),
}));

export const analysisResultRelations = relations(analysisResults, ({ one }) => ({
  submission: one(submissions, {
    fields: [analysisResults.submissionId],
    references: [submissions.id],
  }),
  user: one(users, {
    fields: [analysisResults.userId],
    references: [users.id],
  }),
}));