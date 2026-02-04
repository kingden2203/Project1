import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, Upload, BarChart3, Lock, Zap, Users, Shield } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender via-blush-pink to-pale-mint">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lavender to-blush-pink flex items-center justify-center">
              <span className="text-white font-bold">TD</span>
            </div>
            <h1 className="text-xl font-bold text-slate-purple">Teeth Damage Analysis</h1>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
                <Button onClick={() => setLocation("/dashboard")}>Dashboard</Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold text-slate-purple leading-tight">
                Intelligent Dental Analysis
              </h2>
              <p className="text-xl text-slate-purple/70">
                Leverage advanced machine learning to detect and classify teeth damage from your photos. 
                Get instant insights about your oral health.
              </p>
            </div>

            <div className="flex gap-4 flex-wrap">
              {isAuthenticated ? (
                <>
                  <Button size="lg" onClick={() => setLocation("/upload")} className="gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Image
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setLocation("/dashboard")}>
                    View Dashboard
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild className="gap-2">
                    <a href={getLoginUrl()}>
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground font-semibold">TRUSTED BY STUDENTS</p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>HIPAA-Aligned Privacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span>Instant Results</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-lavender/20 to-blush-pink/20 rounded-3xl blur-3xl" />
            <Card className="relative border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square bg-gradient-to-br from-lavender/30 via-blush-pink/30 to-pale-mint/30 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <Upload className="w-24 h-24 mx-auto text-slate-purple/40" />
                    <p className="text-slate-purple/60 font-medium">Upload dental images for analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/50 backdrop-blur-sm border-t border-border/50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-4xl font-bold text-slate-purple">Powerful Features</h3>
            <p className="text-lg text-slate-purple/70 max-w-2xl mx-auto">
              Everything you need to analyze and track your dental health
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-lavender/30 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-slate-purple" />
                </div>
                <h4 className="text-xl font-semibold text-slate-purple">Easy Upload</h4>
                <p className="text-slate-purple/70">
                  Upload clear photos of your teeth from desktop or mobile camera
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-blush-pink/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-slate-purple" />
                </div>
                <h4 className="text-xl font-semibold text-slate-purple">AI Analysis</h4>
                <p className="text-slate-purple/70">
                  Advanced CNN model detects cavities, decay, cracks, and more
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-pale-mint/30 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-slate-purple" />
                </div>
                <h4 className="text-xl font-semibold text-slate-purple">Track History</h4>
                <p className="text-slate-purple/70">
                  Monitor your dental health over time with detailed analytics
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-4 mb-16">
          <h3 className="text-4xl font-bold text-slate-purple">How It Works</h3>
          <p className="text-lg text-slate-purple/70">Simple 3-step process</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              number: "1",
              title: "Upload Image",
              description: "Take or upload a clear photo of your teeth",
            },
            {
              number: "2",
              title: "ML Analysis",
              description: "Our AI model analyzes the image for dental issues",
            },
            {
              number: "3",
              title: "Get Results",
              description: "Receive detailed analysis with recommendations",
            },
          ].map((step, idx) => (
            <div key={idx} className="relative">
              {idx < 2 && (
                <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-slate-purple/50 to-transparent" />
              )}
              <Card className="border-0 shadow-sm text-center">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lavender to-blush-pink flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                  <h4 className="text-xl font-semibold text-slate-purple">{step.title}</h4>
                  <p className="text-slate-purple/70">{step.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer Section */}
      <section className="bg-amber-50/50 border-t border-amber-200/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-8">
              <h4 className="font-semibold text-amber-900 mb-3">Medical Disclaimer</h4>
              <p className="text-amber-900/80">
                This analysis is not a medical diagnosis and should not replace a licensed dentist. 
                Always consult with a dental professional for proper diagnosis and treatment recommendations. 
                The system is designed for educational purposes and general awareness only.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <Card className="border-0 bg-gradient-to-r from-lavender/30 via-blush-pink/30 to-pale-mint/30 shadow-lg">
          <CardContent className="p-12 text-center space-y-6">
            <h3 className="text-3xl font-bold text-slate-purple">Ready to Analyze Your Teeth?</h3>
            <p className="text-lg text-slate-purple/70 max-w-2xl mx-auto">
              Join students using our intelligent dental analysis system to track their oral health
            </p>
            {isAuthenticated ? (
              <Button size="lg" onClick={() => setLocation("/upload")} className="gap-2">
                <Upload className="w-5 h-5" />
                Upload Your First Image
              </Button>
            ) : (
              <Button size="lg" asChild className="gap-2">
                <a href={getLoginUrl()}>
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-white/50 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Teeth Damage Analysis System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
