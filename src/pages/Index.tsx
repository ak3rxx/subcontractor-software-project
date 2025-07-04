
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, CheckCircle, Clock, DollarSign, FileText, 
  Users, Calendar, AlertTriangle, BarChart3, Shield,
  Zap, Cloud, Smartphone, ArrowRight, LogIn
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Only redirect if user is authenticated, no loading state needed
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Building2,
      title: "Project Management",
      description: "Comprehensive project tracking with real-time updates and milestone management"
    },
    {
      icon: DollarSign,
      title: "Finance Management",
      description: "Budget planning, cost tracking, and financial reporting with variance analysis"
    },
    {
      icon: CheckCircle,
      title: "Quality Assurance",
      description: "QA/ITP management with inspection checklists and digital sign-offs"
    },
    {
      icon: FileText,
      title: "Document Control",
      description: "Centralized document management with version control and approval workflows"
    },
    {
      icon: AlertTriangle,
      title: "Variations & RFIs",
      description: "Streamlined change management and request for information processes"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Real-time communication and task management across all project stakeholders"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Increased Efficiency",
      description: "Reduce project delivery time by up to 30% with streamlined workflows"
    },
    {
      icon: Shield,
      title: "Risk Mitigation",
      description: "Proactive issue identification and resolution to prevent costly delays"
    },
    {
      icon: BarChart3,
      title: "Better Decision Making",
      description: "Real-time insights and analytics for informed project decisions"
    },
    {
      icon: Cloud,
      title: "Anywhere Access",
      description: "Cloud-based platform accessible from any device, anywhere"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">BuildTrack Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800">
            Professional Construction Management
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Complete Project Management for
            <span className="text-blue-600"> Construction Teams</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your construction projects with our comprehensive platform. 
            Manage budgets, track quality, handle variations, and collaborate with your team - all in one place.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Construction Projects
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From initial planning to project completion, our platform provides all the tools 
              your team needs to deliver projects on time and on budget.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Proven Results for Construction Teams
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of construction professionals who trust BuildTrack Pro 
              to deliver successful projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see how BuildTrack Pro can help you 
            deliver better projects, faster.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="text-lg px-8">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-white">BuildTrack Pro</span>
          </div>
          <p className="text-gray-400">
            © 2024 BuildTrack Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
