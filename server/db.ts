import { eq, and, desc, asc, like, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  studentProfiles,
  InsertStudentProfile,
  submissions,
  InsertSubmission,
  analysisResults,
  InsertAnalysisResult,
  adminLogs,
  InsertAdminLog,
  analyticsEvents,
  InsertAnalyticsEvent,
  emailNotifications,
  InsertEmailNotification,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Student Profile Management
 */
export async function createStudentProfile(
  profile: InsertStudentProfile
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create profile: database not available");
    return;
  }

  try {
    await db.insert(studentProfiles).values(profile);
  } catch (error) {
    console.error("[Database] Failed to create student profile:", error);
    throw error;
  }
}

export async function getStudentProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateStudentProfile(
  userId: number,
  updates: Partial<InsertStudentProfile>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(studentProfiles)
      .set(updates)
      .where(eq(studentProfiles.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to update student profile:", error);
    throw error;
  }
}

/**
 * Submission Management
 */
export async function createSubmission(
  submission: InsertSubmission
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(submissions).values(submission);
    return result[0].insertId;
  } catch (error) {
    console.error("[Database] Failed to create submission:", error);
    throw error;
  }
}

export async function getSubmission(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubmissions(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(submissions)
    .where(eq(submissions.userId, userId))
    .orderBy(desc(submissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function updateSubmissionStatus(
  id: number,
  status: "pending" | "analyzing" | "completed" | "failed"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(submissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(submissions.id, id));
  } catch (error) {
    console.error("[Database] Failed to update submission status:", error);
    throw error;
  }
}

export async function deleteSubmission(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.delete(submissions).where(eq(submissions.id, id));
  } catch (error) {
    console.error("[Database] Failed to delete submission:", error);
    throw error;
  }
}

/**
 * Analysis Results Management
 */
export async function createAnalysisResult(
  result: InsertAnalysisResult
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.insert(analysisResults).values(result);
  } catch (error) {
    console.error("[Database] Failed to create analysis result:", error);
    throw error;
  }
}

export async function getAnalysisResultBySubmissionId(submissionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.submissionId, submissionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserAnalysisResults(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(analysisResults)
    .where(eq(analysisResults.userId, userId))
    .orderBy(desc(analysisResults.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Admin Queries
 */
export async function getAllStudents(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      studentId: studentProfiles.studentId,
      course: studentProfiles.course,
      yearLevel: studentProfiles.yearLevel,
    })
    .from(users)
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(eq(users.role, "user"))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function searchStudents(query: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      studentId: studentProfiles.studentId,
      course: studentProfiles.course,
      yearLevel: studentProfiles.yearLevel,
    })
    .from(users)
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(
      and(
        eq(users.role, "user"),
        like(studentProfiles.studentId, `%${query}%`)
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function filterStudents(
  filters: {
    course?: string;
    yearLevel?: number;
  },
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(users.role, "user")];

  if (filters.course) {
    conditions.push(eq(studentProfiles.course, filters.course));
  }
  if (filters.yearLevel) {
    conditions.push(eq(studentProfiles.yearLevel, filters.yearLevel));
  }

  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      studentId: studentProfiles.studentId,
      course: studentProfiles.course,
      yearLevel: studentProfiles.yearLevel,
    })
    .from(users)
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(and(...conditions))
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getAllSubmissions(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(submissions)
    .orderBy(desc(submissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function filterSubmissions(
  filters: {
    userId?: number;
    status?: string;
    course?: string;
    yearLevel?: number;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
  },
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters.userId) {
    conditions.push(eq(submissions.userId, filters.userId));
  }
  if (filters.status) {
    conditions.push(eq(submissions.status, filters.status as any));
  }
  if (filters.startDate) {
    conditions.push(gte(submissions.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(submissions.createdAt, filters.endDate));
  }

  return await db
    .select()
    .from(submissions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(submissions.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Analytics Queries
 */
export async function getSubmissionCount(userId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const query = db.select({ count: submissions.id }).from(submissions);

  if (userId) {
    return (
      (
        await query.where(eq(submissions.userId, userId))
      )[0]?.count || 0
    );
  }

  return (await query)[0]?.count || 0;
}

export async function getAnalysisStats() {
  const db = await getDb();
  if (!db) return null;

  const results = await db
    .select()
    .from(analysisResults)
    .orderBy(desc(analysisResults.createdAt));

  if (results.length === 0) return null;

  // Calculate severity distribution
  const severityCount = {
    low: 0,
    moderate: 0,
    high: 0,
  };

  results.forEach((result) => {
    severityCount[result.overallSeverity as keyof typeof severityCount]++;
  });

  // Calculate common issues
  const issueCount: Record<string, number> = {};
  results.forEach((result) => {
    result.detectedIssues.forEach((issue) => {
      issueCount[issue.type] = (issueCount[issue.type] || 0) + 1;
    });
  });

  return {
    totalAnalyses: results.length,
    severityDistribution: severityCount,
    commonIssues: Object.entries(issueCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6),
  };
}

/**
 * Admin Logging
 */
export async function logAdminAction(log: InsertAdminLog): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(adminLogs).values(log);
  } catch (error) {
    console.error("[Database] Failed to log admin action:", error);
  }
}

export async function getAdminLogs(adminId: number, limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(adminLogs)
    .where(eq(adminLogs.adminId, adminId))
    .orderBy(desc(adminLogs.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Analytics Events
 */
export async function trackAnalyticsEvent(event: InsertAnalyticsEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(analyticsEvents).values(event);
  } catch (error) {
    console.error("[Database] Failed to track analytics event:", error);
  }
}

/**
 * Email Notifications
 */
export async function createEmailNotification(
  notification: InsertEmailNotification
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(emailNotifications).values(notification);
  } catch (error) {
    console.error("[Database] Failed to create email notification:", error);
    throw error;
  }
}

export async function getPendingEmailNotifications(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(emailNotifications)
    .where(eq(emailNotifications.status, "pending"))
    .orderBy(asc(emailNotifications.createdAt))
    .limit(limit);
}

export async function updateEmailNotificationStatus(
  id: number,
  status: "pending" | "sent" | "failed"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(emailNotifications)
      .set({ status, sentAt: status === "sent" ? new Date() : undefined })
      .where(eq(emailNotifications.id, id));
  } catch (error) {
    console.error("[Database] Failed to update email notification status:", error);
    throw error;
  }
}
