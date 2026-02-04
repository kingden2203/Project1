import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Student Profile Management", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should create a student profile with valid data", async () => {
    const result = await caller.student.createProfile({
      firstName: "John",
      surname: "Doe",
      studentId: "STU-2024-001",
      age: 20,
      course: "Dentistry",
      yearLevel: 2,
    });

    expect(result).toEqual({ success: true });
  });

  it("should require firstName and surname", async () => {
    try {
      await caller.student.createProfile({
        firstName: "",
        surname: "Doe",
        studentId: "STU-2024-001",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should require studentId", async () => {
    try {
      await caller.student.createProfile({
        firstName: "John",
        surname: "Doe",
        studentId: "",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should validate age range", async () => {
    try {
      await caller.student.createProfile({
        firstName: "John",
        surname: "Doe",
        studentId: "STU-2024-001",
        age: 200, // Invalid age
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
    }
  });

  it("should accept optional fields", async () => {
    const result = await caller.student.createProfile({
      firstName: "Jane",
      surname: "Smith",
      studentId: "STU-2024-002",
      // middleName, age, address, course, yearLevel are optional
    });

    expect(result).toEqual({ success: true });
  });

  it("should retrieve student profile", async () => {
    // First create a profile
    await caller.student.createProfile({
      firstName: "John",
      surname: "Doe",
      studentId: "STU-2024-001",
      age: 20,
    });

    // Then retrieve it
    const profile = await caller.student.getProfile();

    expect(profile).toBeDefined();
    expect(profile?.firstName).toBe("John");
    expect(profile?.surname).toBe("Doe");
    expect(profile?.studentId).toBe("STU-2024-001");
  });

  it("should update student profile", async () => {
    // Create initial profile
    await caller.student.createProfile({
      firstName: "John",
      surname: "Doe",
      studentId: "STU-2024-001",
      age: 20,
    });

    // Update profile
    const result = await caller.student.updateProfile({
      age: 21,
      course: "Dental Hygiene",
    });

    expect(result).toEqual({ success: true });

    // Verify update
    const profile = await caller.student.getProfile();
    expect(profile?.age).toBe(21);
    expect(profile?.course).toBe("Dental Hygiene");
  });

  it("should prevent duplicate profile creation", async () => {
    // Create first profile
    await caller.student.createProfile({
      firstName: "John",
      surname: "Doe",
      studentId: "STU-2024-001",
    });

    // Try to create duplicate
    try {
      await caller.student.createProfile({
        firstName: "Jane",
        surname: "Smith",
        studentId: "STU-2024-002",
      });
      expect.fail("Should have thrown conflict error");
    } catch (error: any) {
      expect(error.code).toBe("CONFLICT");
    }
  });
});

describe("Submission Management", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    const ctx = createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  it("should validate image file size", async () => {
    try {
      await caller.submission.upload({
        fileName: "test.jpg",
        fileSize: 15 * 1024 * 1024, // 15MB - exceeds limit
        mimeType: "image/jpeg",
        imageBase64: "fake-base64",
      });
      expect.fail("Should have thrown size error");
    } catch (error: any) {
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toContain("10MB");
    }
  });

  it("should accept valid image upload", async () => {
    const result = await caller.submission.upload({
      fileName: "teeth.jpg",
      fileSize: 2 * 1024 * 1024, // 2MB
      mimeType: "image/jpeg",
      imageQuality: "good",
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });

    expect(result).toHaveProperty("submissionId");
    expect(result).toHaveProperty("imageUrl");
  });

  it("should retrieve submission history", async () => {
    // Upload image
    const upload = await caller.submission.upload({
      fileName: "teeth.jpg",
      fileSize: 2 * 1024 * 1024,
      mimeType: "image/jpeg",
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });

    // Retrieve history
    const history = await caller.submission.getHistory({ limit: 20 });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
  });

  it("should delete submission", async () => {
    // Upload image
    const upload = await caller.submission.upload({
      fileName: "teeth.jpg",
      fileSize: 2 * 1024 * 1024,
      mimeType: "image/jpeg",
      imageBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    });

    // Delete submission
    const result = await caller.submission.delete({
      submissionId: upload.submissionId,
    });

    expect(result).toEqual({ success: true });
  });
});

describe("Admin Access Control", () => {
  it("should deny admin access to non-admin users", async () => {
    const ctx = createTestContext(1, "user"); // Regular user
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.admin.students.list({ limit: 50 });
      expect.fail("Should have thrown forbidden error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("should allow admin access to admin users", async () => {
    const ctx = createTestContext(1, "admin"); // Admin user
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.students.list({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to search students", async () => {
    const ctx = createTestContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.students.search({
      query: "STU",
      limit: 50,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow admin to filter submissions", async () => {
    const ctx = createTestContext(1, "admin");
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.submissions.filter({
      status: "completed",
      limit: 50,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});
