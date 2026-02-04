import { DetectedIssue, Recommendation } from "../drizzle/schema";

/**
 * Mock ML Service for Teeth Damage Analysis
 * 
 * In production, this would connect to a Python-based CNN model service
 * For now, we provide a realistic mock that simulates analysis results
 */

export interface MLAnalysisInput {
  imageUrl: string;
  imageKey: string;
}

export interface MLAnalysisResult {
  detectedIssues: DetectedIssue[];
  overallSeverity: "low" | "moderate" | "high";
  recommendations: Recommendation[];
  processingTime: number;
  mlModelVersion: string;
}

/**
 * Mock dental issue types and their typical recommendations
 */
const ISSUE_TYPES = ["cavity", "decay", "crack", "plaque", "inflammation", "healthy"] as const;

const ISSUE_DESCRIPTIONS: Record<string, string> = {
  cavity: "A small hole or pit in the tooth structure, typically caused by bacterial acid",
  decay: "Tooth decay or caries, indicating demineralization of tooth structure",
  crack: "A visible crack or fracture in the tooth surface",
  plaque: "Buildup of bacterial plaque on tooth surface",
  inflammation: "Gum inflammation or gingivitis visible around the tooth",
  healthy: "Tooth appears to be in healthy condition with no visible issues",
};

const RECOMMENDATIONS_BY_ISSUE: Record<string, Recommendation[]> = {
  cavity: [
    {
      title: "Schedule Dental Appointment",
      description: "Visit a dentist for professional treatment. Early cavities can be treated with fillings.",
      priority: "high",
    },
    {
      title: "Improve Oral Hygiene",
      description: "Brush twice daily with fluoride toothpaste and floss regularly",
      priority: "high",
    },
    {
      title: "Reduce Sugar Intake",
      description: "Limit sugary foods and drinks that feed cavity-causing bacteria",
      priority: "medium",
    },
  ],
  decay: [
    {
      title: "Urgent Dental Care",
      description: "Tooth decay requires professional treatment. Schedule an appointment immediately.",
      priority: "high",
    },
    {
      title: "Fluoride Treatment",
      description: "Ask your dentist about fluoride treatments to strengthen remaining tooth structure",
      priority: "high",
    },
    {
      title: "Pain Management",
      description: "Use over-the-counter pain relievers if experiencing discomfort",
      priority: "medium",
    },
  ],
  crack: [
    {
      title: "Dental Evaluation",
      description: "A dentist needs to assess the crack severity and recommend treatment",
      priority: "high",
    },
    {
      title: "Avoid Hard Foods",
      description: "Avoid chewing hard foods or ice to prevent worsening the crack",
      priority: "high",
    },
    {
      title: "Protective Measures",
      description: "Consider a night guard if grinding is causing the crack",
      priority: "medium",
    },
  ],
  plaque: [
    {
      title: "Professional Cleaning",
      description: "Schedule a professional cleaning with your dentist or hygienist",
      priority: "medium",
    },
    {
      title: "Enhanced Brushing",
      description: "Brush for 2 minutes twice daily, paying special attention to plaque buildup areas",
      priority: "medium",
    },
    {
      title: "Daily Flossing",
      description: "Floss daily to remove plaque between teeth where brushing cannot reach",
      priority: "medium",
    },
  ],
  inflammation: [
    {
      title: "Gum Care",
      description: "Use an antimicrobial mouthwash and improve brushing technique",
      priority: "medium",
    },
    {
      title: "Professional Cleaning",
      description: "Schedule a professional cleaning to remove tartar and plaque",
      priority: "medium",
    },
    {
      title: "Monitor Symptoms",
      description: "Watch for bleeding, swelling, or pain and seek dental care if worsening",
      priority: "low",
    },
  ],
  healthy: [
    {
      title: "Maintain Current Routine",
      description: "Continue your current oral hygiene practices",
      priority: "low",
    },
    {
      title: "Regular Checkups",
      description: "Visit your dentist every 6 months for preventive care",
      priority: "low",
    },
    {
      title: "Healthy Habits",
      description: "Maintain a balanced diet and avoid tobacco and excessive sugar",
      priority: "low",
    },
  ],
};

/**
 * Generate mock analysis result
 * In production, this would call the actual ML service API
 */
export async function analyzeTeethImage(input: MLAnalysisInput): Promise<MLAnalysisResult> {
  const startTime = Date.now();

  // Simulate processing delay (2-5 seconds)
  const processingDelay = Math.random() * 3000 + 2000;
  await new Promise((resolve) => setTimeout(resolve, processingDelay));

  // Generate mock detected issues
  // In a real scenario, this would come from the ML model
  const detectedIssues: DetectedIssue[] = [];

  // Randomly decide if issues are detected (70% chance of at least one issue)
  if (Math.random() < 0.7) {
    const numIssues = Math.floor(Math.random() * 3) + 1; // 1-3 issues

    for (let i = 0; i < numIssues; i++) {
      const issueType = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
      const toothNumber = Math.floor(Math.random() * 32) + 1; // Teeth numbered 1-32 (FDI notation)

      detectedIssues.push({
        type: issueType as typeof ISSUE_TYPES[number],
        location: `tooth_${toothNumber}`,
        severity: getRandomSeverity(),
        confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
        description: ISSUE_DESCRIPTIONS[issueType],
      });
    }
  } else {
    // No issues detected - mark as healthy
    detectedIssues.push({
      type: "healthy",
      location: "overall",
      severity: "low",
      confidence: 0.95,
      description: ISSUE_DESCRIPTIONS.healthy,
    });
  }

  // Determine overall severity
  const overallSeverity = determineOverallSeverity(detectedIssues);

  // Generate recommendations based on detected issues
  const recommendations: Recommendation[] = [];
  const addedRecommendations = new Set<string>();

  for (const issue of detectedIssues) {
    const issueRecs = RECOMMENDATIONS_BY_ISSUE[issue.type] || [];
    for (const rec of issueRecs) {
      if (!addedRecommendations.has(rec.title)) {
        recommendations.push(rec);
        addedRecommendations.add(rec.title);
      }
    }
  }

  // Sort recommendations by priority
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority as keyof typeof priorityOrder] -
           priorityOrder[b.priority as keyof typeof priorityOrder];
  });

  const processingTime = Date.now() - startTime;

  return {
    detectedIssues,
    overallSeverity,
    recommendations,
    processingTime,
    mlModelVersion: "v1.0.2",
  };
}

/**
 * Helper function to get random severity
 */
function getRandomSeverity(): "low" | "moderate" | "high" {
  const rand = Math.random();
  if (rand < 0.5) return "low";
  if (rand < 0.8) return "moderate";
  return "high";
}

/**
 * Determine overall severity from detected issues
 */
function determineOverallSeverity(issues: DetectedIssue[]): "low" | "moderate" | "high" {
  if (issues.length === 0) return "low";

  const severityScores = {
    low: 1,
    moderate: 2,
    high: 3,
  };

  const avgSeverity =
    issues.reduce((sum, issue) => sum + severityScores[issue.severity], 0) / issues.length;

  if (avgSeverity < 1.5) return "low";
  if (avgSeverity < 2.5) return "moderate";
  return "high";
}

/**
 * Validate image before analysis
 */
export function validateImageForAnalysis(
  imageUrl: string,
  mimeType: string,
  fileSize: number
): { valid: boolean; message: string } {
  // Check MIME type
  if (!["image/jpeg", "image/png"].includes(mimeType)) {
    return { valid: false, message: "Invalid image format. Only JPEG and PNG are supported." };
  }

  // Check file size
  if (fileSize > 10 * 1024 * 1024) {
    return { valid: false, message: "Image file is too large. Maximum 10MB allowed." };
  }

  // Check URL validity
  try {
    new URL(imageUrl);
  } catch {
    return { valid: false, message: "Invalid image URL." };
  }

  return { valid: true, message: "Image validation passed" };
}
