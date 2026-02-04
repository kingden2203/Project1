import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, AlertTriangle, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function AnalysisResults() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/analysis/:id");

  const submissionId = params?.id ? parseInt(params.id) : null;
  const detailsQuery = trpc.submission.getDetails.useQuery(
    { submissionId: submissionId! },
    { enabled: !!submissionId }
  );

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

  if (detailsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-accent" />
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (detailsQuery.isError || !detailsQuery.data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Analysis Not Found</CardTitle>
            <CardDescription>The analysis results could not be loaded.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { submission, analysis } = detailsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender via-blush-pink to-pale-mint">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-bold text-slate-purple mb-2">
            Analysis Results
          </h1>
          <p className="text-muted-foreground">
            Analyzed on {format(new Date(submission.createdAt), "PPp")}
          </p>
        </div>

        {/* Image and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Image */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Submitted Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={submission.imageUrl}
                alt="Dental image"
                className="w-full h-auto rounded-lg mb-4"
              />
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium">{submission.fileName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Size</p>
                  <p className="font-medium">{(submission.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quality</p>
                  <p className="font-medium capitalize">{submission.imageQuality}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status and Summary */}
          <div className="lg:col-span-2 space-y-6">
            {analysis ? (
              <>
                {/* Overall Severity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <SeverityIcon severity={analysis.overallSeverity} />
                      <div>
                        <p className="text-sm text-muted-foreground">Severity Level</p>
                        <p className="text-2xl font-bold text-slate-purple capitalize">
                          {analysis.overallSeverity}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Model Info */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ML Model</p>
                        <p className="font-medium">{analysis.mlModelVersion}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Processing Time</p>
                        <p className="font-medium">{analysis.processingTime}ms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-8 text-center">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-accent" />
                  <p className="text-muted-foreground">Analysis in progress...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few minutes. You will receive an email notification when complete.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Detected Issues */}
        {analysis && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Detected Issues</CardTitle>
                <CardDescription>
                  {analysis.detectedIssues.length} issue{analysis.detectedIssues.length !== 1 ? "s" : ""} detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.detectedIssues.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-semibold">No Issues Detected</p>
                    <p className="text-muted-foreground">Your teeth appear to be in good condition!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {analysis.detectedIssues.map((issue, idx) => (
                      <Card key={idx} className="border-l-4 border-l-accent">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold capitalize">{issue.type.replace(/_/g, " ")}</h4>
                              <p className="text-sm text-muted-foreground">Tooth #{issue.location}</p>
                            </div>
                            <SeverityBadge severity={issue.severity} />
                          </div>

                          <p className="text-sm mb-3">{issue.description}</p>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Confidence Score</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-2">
                                <div
                                  className="bg-accent h-full rounded-full"
                                  style={{ width: `${issue.confidence * 100}%` }}
                                />
                              </div>
                              <span className="font-medium">{(issue.confidence * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Based on the analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-muted rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/20">
                          {rec.priority === "high" ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : rec.priority === "medium" ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-900">
                  <strong>Important Disclaimer:</strong> {analysis.disclaimer}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard")}
            className="flex-1"
          >
            Back to Dashboard
          </Button>
          <Button onClick={() => setLocation("/upload")} className="flex-1">
            Upload Another Image
          </Button>
        </div>
      </div>
    </div>
  );
}

function SeverityIcon({ severity }: { severity: string }) {
  if (severity === "high") {
    return <AlertTriangle className="w-10 h-10 text-red-600" />;
  } else if (severity === "moderate") {
    return <AlertCircle className="w-10 h-10 text-yellow-600" />;
  } else {
    return <CheckCircle2 className="w-10 h-10 text-green-600" />;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors = {
    high: "bg-red-100 text-red-800",
    moderate: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[severity as keyof typeof colors]}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}
