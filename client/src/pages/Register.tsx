import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function Register() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"profile" | "success">("profile");
  const [isLoading, setIsLoading] = useState(false);

  const createProfileMutation = trpc.student.createProfile.useMutation();

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    studentId: "",
    age: "",
    address: "",
    course: "",
    yearLevel: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createProfileMutation.mutateAsync({
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        surname: formData.surname,
        studentId: formData.studentId,
        age: formData.age ? parseInt(formData.age) : undefined,
        address: formData.address || undefined,
        course: formData.course || undefined,
        yearLevel: formData.yearLevel ? parseInt(formData.yearLevel) : undefined,
      });

      setStep("success");
      toast.success("Profile created successfully!");

      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Failed to create profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to log in to register your profile.</CardDescription>
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

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Profile Created!</h2>
            <p className="text-muted-foreground mb-6">
              Your student profile has been successfully registered. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Student Profile Registration</CardTitle>
          <CardDescription>
            Complete your profile to start uploading dental images for analysis
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-purple">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleInputChange}
                    placeholder="Michael"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="surname">Surname *</Label>
                <Input
                  id="surname"
                  name="surname"
                  value={formData.surname}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="20"
                    min="1"
                    max="150"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-purple">Academic Information</h3>

              <div>
                <Label htmlFor="studentId">Student ID *</Label>
                <Input
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  placeholder="STU-2024-001234"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course">Course</Label>
                  <select
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  >
                    <option value="">Select a course</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Dental Hygiene">Dental Hygiene</option>
                    <option value="General Health">General Health</option>
                    <option value="Medical Science">Medical Science</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="yearLevel">Year Level</Label>
                  <select
                    id="yearLevel"
                    name="yearLevel"
                    value={formData.yearLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  >
                    <option value="">Select year level</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                    <option value="5">Year 5</option>
                    <option value="6">Year 6</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isLoading || !formData.firstName || !formData.surname || !formData.studentId}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Profile"
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              * Required fields
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
