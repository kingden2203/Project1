import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Users, FileText, BarChart3, Download, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const summaryQuery = trpc.admin.analytics.getSummary.useQuery();
  const issueDistQuery = trpc.admin.analytics.getIssueDistribution.useQuery();
  const severityDistQuery = trpc.admin.analytics.getSeverityDistribution.useQuery();
  const studentsQuery = trpc.admin.students.list.useQuery({ limit: 50 });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
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

  const summary = summaryQuery.data;
  const issueData = issueDistQuery.data || [];
  const severityData = severityDistQuery.data;

  // Prepare chart data
  const issueChartData = issueData.map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const severityChartData = severityData
    ? [
        { name: "Low", value: severityData.low, fill: "#10b981" },
        { name: "Moderate", value: severityData.moderate, fill: "#f59e0b" },
        { name: "High", value: severityData.high, fill: "#ef4444" },
      ]
    : [];

  const COLORS = ["#c4b5fd", "#fbcfe8", "#a7f3d0", "#bfdbfe", "#fcd34d", "#fca5a5"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-purple">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Monitor system usage, manage users, and view analytics
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalSubmissions || 0}</div>
              <p className="text-xs text-muted-foreground">Images analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Severity</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary?.analysisStats?.severityDistribution
                  ? (
                      (summary.analysisStats.severityDistribution.high * 3 +
                        summary.analysisStats.severityDistribution.moderate * 2 +
                        summary.analysisStats.severityDistribution.low) /
                      (summary.analysisStats.severityDistribution.high +
                        summary.analysisStats.severityDistribution.moderate +
                        summary.analysisStats.severityDistribution.low)
                    ).toFixed(1)
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Weighted score</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Severity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Severity Distribution</CardTitle>
              <CardDescription>Overall damage severity levels</CardDescription>
            </CardHeader>
            <CardContent>
              {severityChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={severityChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {severityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Common Issues */}
          <Card>
            <CardHeader>
              <CardTitle>Common Dental Issues</CardTitle>
              <CardDescription>Most frequently detected conditions</CardDescription>
            </CardHeader>
            <CardContent>
              {issueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={issueChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#c4b5fd" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Students Management */}
        <Card>
          <CardHeader>
            <CardTitle>Student Records</CardTitle>
            <CardDescription>Manage and view all registered students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-64 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or student ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-input text-foreground"
              >
                <option value="">All Courses</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Dental Hygiene">Dental Hygiene</option>
                <option value="General Health">General Health</option>
              </select>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Student ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Course</th>
                    <th className="text-left py-3 px-4 font-semibold">Year</th>
                    <th className="text-left py-3 px-4 font-semibold">Joined</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsQuery.data && studentsQuery.data.length > 0 ? (
                    studentsQuery.data.map((student) => (
                      <tr key={student.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4">{student.name}</td>
                        <td className="py-3 px-4 font-mono text-xs">{student.studentId}</td>
                        <td className="py-3 px-4">{student.course || "-"}</td>
                        <td className="py-3 px-4">{student.yearLevel ? `Year ${student.yearLevel}` : "-"}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/admin/student/${student.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Generate reports for analysis and compliance</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 flex-wrap">
            <Button className="gap-2">
              <Download className="h-4 w-4" />
              Export as CSV
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
