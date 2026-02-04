import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";

// Admin-only procedure wrapper
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Student Profile Management
  student: router({
    createProfile: protectedProcedure
      .input(
        z.object({
          firstName: z.string().min(1, "First name required"),
          middleName: z.string().optional(),
          surname: z.string().min(1, "Surname required"),
          studentId: z.string().min(1, "Student ID required"),
          age: z.number().int().min(1).max(150).optional(),
          address: z.string().optional(),
          course: z.string().optional(),
          yearLevel: z.number().int().min(1).max(6).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existingProfile = await db.getStudentProfile(ctx.user.id);
        if (existingProfile) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Profile already exists",
          });
        }

        await db.createStudentProfile({
          userId: ctx.user.id,
          firstName: input.firstName,
          middleName: input.middleName,
          surname: input.surname,
          studentId: input.studentId,
          age: input.age,
          address: input.address,
          course: input.course,
          yearLevel: input.yearLevel,
        });

        await db.trackAnalyticsEvent({
          eventType: "profile_created",
          userId: ctx.user.id,
          metadata: { course: input.course },
        });

        return { success: true };
      }),

    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return await db.getStudentProfile(ctx.user.id);
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          firstName: z.string().optional(),
          middleName: z.string().optional(),
          surname: z.string().optional(),
          age: z.number().int().optional(),
          address: z.string().optional(),
          course: z.string().optional(),
          yearLevel: z.number().int().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateStudentProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Image Submission Management
  submission: router({
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileSize: z.number(),
          mimeType: z.enum(["image/jpeg", "image/png"]),
          imageQuality: z.enum(["good", "fair", "poor"]).default("good"),
          imageBase64: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Validate file size (max 10MB)
        if (input.fileSize > 10 * 1024 * 1024) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "File size exceeds 10MB limit",
          });
        }

        // Upload to S3
        const fileKey = `submissions/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const imageBuffer = Buffer.from(input.imageBase64, "base64");

        const { url } = await storagePut(fileKey, imageBuffer, input.mimeType);

        // Create submission record
        const submissionId = await db.createSubmission({
          userId: ctx.user.id,
          imageKey: fileKey,
          imageUrl: url,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          imageQuality: input.imageQuality,
          status: "pending",
        });

        await db.trackAnalyticsEvent({
          eventType: "submission_uploaded",
          userId: ctx.user.id,
          metadata: { submissionId, fileSize: input.fileSize },
        });

        return { submissionId, imageUrl: url };
      }),

    getHistory: protectedProcedure
      .input(
        z.object({
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await db.getUserSubmissions(ctx.user.id, input.limit, input.offset);
      }),

    getDetails: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const submission = await db.getSubmission(input.submissionId);

        if (!submission || submission.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const analysis = await db.getAnalysisResultBySubmissionId(input.submissionId);

        return { submission, analysis };
      }),

    delete: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const submission = await db.getSubmission(input.submissionId);

        if (!submission || submission.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        await db.deleteSubmission(input.submissionId);
        return { success: true };
      }),
  }),

  // Admin Dashboard
  admin: router({
    students: router({
      list: adminProcedure
        .input(
          z.object({
            limit: z.number().default(50),
            offset: z.number().default(0),
          })
        )
        .query(async ({ input }) => {
          return await db.getAllStudents(input.limit, input.offset);
        }),

      search: adminProcedure
        .input(
          z.object({
            query: z.string().min(1),
            limit: z.number().default(50),
            offset: z.number().default(0),
          })
        )
        .query(async ({ input }) => {
          return await db.searchStudents(input.query, input.limit, input.offset);
        }),

      filter: adminProcedure
        .input(
          z.object({
            course: z.string().optional(),
            yearLevel: z.number().optional(),
            limit: z.number().default(50),
            offset: z.number().default(0),
          })
        )
        .query(async ({ ctx, input }) => {
          await db.logAdminAction({
            adminId: ctx.user.id,
            action: "filter_students",
            details: { course: input.course, yearLevel: input.yearLevel },
          });

          return await db.filterStudents(
            { course: input.course, yearLevel: input.yearLevel },
            input.limit,
            input.offset
          );
        }),

      getProfile: adminProcedure
        .input(z.object({ userId: z.number() }))
        .query(async ({ ctx, input }) => {
          const user = await db.getUserById(input.userId);
          const profile = await db.getStudentProfile(input.userId);
          const submissions = await db.getUserSubmissions(input.userId, 100);

          await db.logAdminAction({
            adminId: ctx.user.id,
            action: "view_student_profile",
            targetUserId: input.userId,
          });

          return { user, profile, submissions };
        }),
    }),

    submissions: router({
      list: adminProcedure
        .input(
          z.object({
            limit: z.number().default(50),
            offset: z.number().default(0),
          })
        )
        .query(async ({ input }) => {
          return await db.getAllSubmissions(input.limit, input.offset);
        }),

      filter: adminProcedure
        .input(
          z.object({
            userId: z.number().optional(),
            status: z.string().optional(),
            severity: z.string().optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            limit: z.number().default(50),
            offset: z.number().default(0),
          })
        )
        .query(async ({ ctx, input }) => {
          await db.logAdminAction({
            adminId: ctx.user.id,
            action: "filter_submissions",
            details: input,
          });

          return await db.filterSubmissions(input, input.limit, input.offset);
        }),
    }),

    analytics: router({
      getSummary: adminProcedure.query(async ({ ctx }) => {
        const totalStudents = await db.getAllStudents(1);
        const totalSubmissions = await db.getSubmissionCount();
        const stats = await db.getAnalysisStats();

        await db.trackAnalyticsEvent({
          eventType: "admin_dashboard_viewed",
          userId: ctx.user.id,
        });

        return {
          totalStudents: totalStudents.length,
          totalSubmissions,
          analysisStats: stats,
        };
      }),

      getIssueDistribution: adminProcedure.query(async () => {
        const stats = await db.getAnalysisStats();
        return stats?.commonIssues || [];
      }),

      getSeverityDistribution: adminProcedure.query(async () => {
        const stats = await db.getAnalysisStats();
        return stats?.severityDistribution || { low: 0, moderate: 0, high: 0 };
      }),
    }),

    reports: router({
      exportCSV: adminProcedure
        .input(
          z.object({
            startDate: z.date().optional(),
            endDate: z.date().optional(),
          })
        )
        .query(async ({ ctx, input }) => {
          const submissions = await db.filterSubmissions(input);

          await db.logAdminAction({
            adminId: ctx.user.id,
            action: "export_csv",
            details: input,
          });

          // Generate CSV
          const csv = [
            "ID,User ID,Status,Created At",
            ...submissions.map(
              (s) => `${s.id},${s.userId},${s.status},${s.createdAt}`
            ),
          ].join("\n");

          return csv;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
