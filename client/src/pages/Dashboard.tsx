import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Upload, FileText, AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const profileQuery = trpc.student.getProfile.useQuery();
  const historyQuery = trpc.submission.getHistory.useQuery({ limit: 20 });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = profileQuery.data;
  const submissions = historyQuery.data || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-purple">
              Welcome, {profile?.firstName || user.name}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your dental analysis submissions and track your oral health
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex gap-4 flex-wrap">
            <Button
              onClick={() => setLocation("/upload")}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload New Image
            </Button>
            {!profile && (
              <Button
                variant="outline"
                onClick={() => setLocation("/register")}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Complete Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        {profile && (
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">
                    {profile.firstName} {profile.middleName} {profile.surname}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-semibold">{profile.studentId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-semibold">{profile.course || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year Level</p>
                  <p className="font-semibold">
                    {profile.yearLevel ? `Year ${profile.yearLevel}` : "Not specified"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setLocation("/profile")}
                className="mt-4"
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Submission History */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-purple">Analysis History</h2>
            <p className="text-muted-foreground">
              {submissions.length === 0
                ? "No submissions yet. Upload your first image to get started!"
                : `You have ${submissions.length} submission${submissions.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {submissions.length === 0 ? (
            <Card>
              <CardContent className="pt-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first dental image to begin analysis
                </p>
                <Button onClick={() => setLocation("/upload")}>
                  Upload Image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{submission.fileName}</h3>
                          <StatusBadge status={submission.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Uploaded {format(new Date(submission.createdAt), "PPp")}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {(submission.fileSize / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            Quality: {submission.imageQuality}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setLocation(`/analysis/${submission.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold">1. Upload Image</p>
                <p className="text-muted-foreground">Take or upload a clear photo of your teeth</p>
              </div>
              <div>
                <p className="font-semibold">2. ML Analysis</p>
                <p className="text-muted-foreground">Our AI model analyzes the image for dental issues</p>
              </div>
              <div>
                <p className="font-semibold">3. Get Results</p>
                <p className="text-muted-foreground">Receive detailed analysis with recommendations</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Important Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-900 bg-amber-50 p-4 rounded">
              This analysis is not a medical diagnosis and should not replace a licensed dentist. 
              Always consult with a dental professional for proper diagnosis and treatment recommendations.
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", label: "Pending" },
    analyzing: { icon: Loader2, color: "text-blue-600", bg: "bg-blue-50", label: "Analyzing" },
    completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", label: "Completed" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", label: "Failed" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
      <Icon className={`w-3 h-3 ${status === "analyzing" ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}
