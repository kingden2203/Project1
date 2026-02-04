import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Upload, Camera, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

interface ImagePreview {
  file: File;
  preview: string;
  quality: "good" | "fair" | "poor";
}

export default function UploadImage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedImage, setSelectedImage] = useState<ImagePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.submission.upload.useMutation();

  const validateImage = (file: File): { valid: boolean; quality: "good" | "fair" | "poor"; message: string } => {
    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return { valid: false, quality: "poor", message: "Only JPEG and PNG images are supported" };
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, quality: "poor", message: "File size must be less than 10MB" };
    }

    // Estimate quality based on file size and type
    // Larger files typically indicate higher resolution
    let quality: "good" | "fair" | "poor" = "fair";
    if (file.size > 2 * 1024 * 1024) {
      quality = "good";
    } else if (file.size < 500 * 1024) {
      quality = "poor";
    }

    return { valid: true, quality, message: "Image validation passed" };
  };

  const handleFileSelect = (file: File) => {
    const validation = validateImage(file);

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage({
        file,
        preview: e.target?.result as string,
        quality: validation.quality,
      });
      toast.success(`Image loaded (Quality: ${validation.quality})`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-accent", "bg-accent/5");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-accent", "bg-accent/5");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-accent", "bg-accent/5");

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];

        try {
          await uploadMutation.mutateAsync({
            fileName: selectedImage.file.name,
            fileSize: selectedImage.file.size,
            mimeType: selectedImage.file.type as "image/jpeg" | "image/png",
            imageQuality: selectedImage.quality,
            imageBase64: base64,
          });

          clearInterval(progressInterval);
          setUploadProgress(100);
          setUploadComplete(true);

          toast.success("Image uploaded successfully! Analysis starting...");

          setTimeout(() => {
            setLocation("/dashboard");
          }, 2000);
        } catch (error: any) {
          clearInterval(progressInterval);
          toast.error(error.message || "Upload failed");
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(selectedImage.file);
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Please Log In</CardTitle>
            <CardDescription>You need to log in to upload images.</CardDescription>
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

  if (uploadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground mb-6">
              Your image has been uploaded successfully. Our ML model is analyzing your dental image. You will receive an email notification when the analysis is complete.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard...
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
          <CardTitle className="text-3xl">Upload Dental Image</CardTitle>
          <CardDescription>
            Upload a clear image of your teeth for automated ML-based analysis
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Image Preview */}
          {selectedImage ? (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <img
                  src={selectedImage.preview}
                  alt="Preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image Quality Indicator */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Image Quality: {selectedImage.quality.toUpperCase()}</p>
                  <p className="text-sm text-blue-700">
                    {selectedImage.quality === "good"
                      ? "Excellent quality for analysis"
                      : selectedImage.quality === "fair"
                        ? "Acceptable quality, but higher resolution recommended"
                        : "Low quality - consider uploading a clearer image"}
                  </p>
                </div>
              </div>

              {/* File Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">File Name</p>
                  <p className="font-medium">{selectedImage.file.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">File Size</p>
                  <p className="font-medium">{(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Area */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Drag and drop your image here</h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Supported formats: JPEG, PNG (Max 10MB)
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Upload Progress */}
          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Uploading...</p>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            {selectedImage && !isLoading && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                  className="flex-1"
                >
                  Choose Different Image
                </Button>
                <Button onClick={handleSubmit} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze
                </Button>
              </>
            )}

            {!selectedImage && !isLoading && (
              <>
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              </>
            )}

            {isLoading && (
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </Button>
            )}
          </div>

          {/* Camera Input (Hidden) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Medical Disclaimer */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong>Disclaimer:</strong> This analysis is not a medical diagnosis and should not replace a licensed dentist. 
              Please consult with a dental professional for proper diagnosis and treatment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
