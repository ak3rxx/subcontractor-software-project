
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CheckIcon, Building, Shield, Calendar, FileCheck, Database } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 md:py-32">
          <div className="container px-4 mx-auto">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-construction-black md:text-6xl">
                Construction Management <span className="text-construction-blue">Simplified</span>
              </h1>
              <p className="mb-10 text-xl text-gray-600">
                The all-in-one platform designed to streamline operations, reduce risks, and increase profitability for construction contractors.
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <Button size="lg" className="text-lg bg-construction-blue hover:bg-blue-700">
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="text-lg">
                  Schedule Demo
                </Button>
              </div>
            </div>
          </div>
          
          <div className="absolute left-0 right-0 hidden lg:block">
            <div className="flex justify-center mt-16">
              <div className="w-3/4 h-[400px] bg-gray-200 rounded-lg shadow-xl">
                {/* This would be an image or screenshot of the dashboard */}
                <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
                  <p className="text-xl font-medium text-gray-500">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 md:py-32">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Comprehensive Features for Construction Professionals</h2>
              <p className="text-xl text-gray-600">
                Everything you need to manage your construction business efficiently in one platform
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <Building className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Project Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Centralize all project details, track progress, and manage resources efficiently from a single dashboard.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
              
              {/* Feature 2 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <FileCheck className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Document Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Store, organize, and manage all your construction documents in one secure location with version control.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
              
              {/* Feature 3 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <Shield className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Identify, track, and mitigate potential risks with our comprehensive risk assessment tools.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
              
              {/* Feature 4 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <Database className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Client Portal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Provide clients with a dedicated portal for seamless communication and project updates.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
              
              {/* Feature 5 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <Calendar className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Scheduling</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Create, manage, and optimize project schedules with our intuitive scheduling tools.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
              
              {/* Feature 6 */}
              <Card className="feature-card animated-element">
                <CardHeader>
                  <Building className="w-10 h-10 text-construction-blue mb-2" />
                  <CardTitle>Estimation Tool</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Create accurate cost estimates quickly and efficiently to win more bids.</p>
                </CardContent>
                <CardFooter>
                  <Button variant="link" className="p-0 text-construction-blue">Learn more</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Benefits Section */}
        <section className="py-20 bg-gray-50 md:py-32">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why Choose ConstructBuild</h2>
              <p className="text-xl text-gray-600">
                Our platform is designed specifically for construction contractors to help you succeed
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-y-12 md:grid-cols-2 lg:gap-x-20">
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Reduced Risk</h3>
                    <p className="mt-2 text-gray-600">Our systematic approach helps identify and mitigate risks before they become costly problems.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Improved Efficiency</h3>
                    <p className="mt-2 text-gray-600">Streamline workflows and eliminate redundant tasks to save time and boost productivity.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Better Client Relationships</h3>
                    <p className="mt-2 text-gray-600">Keep clients informed and satisfied with transparent communication and professional service.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Increased Profitability</h3>
                    <p className="mt-2 text-gray-600">Better project management and cost control lead directly to improved bottom line results.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Compliance Assurance</h3>
                    <p className="mt-2 text-gray-600">Stay on top of permits, licenses, and regulatory requirements with automated reminders.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-construction-blue">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold">Scalable Solution</h3>
                    <p className="mt-2 text-gray-600">Our platform grows with your business, from small contractors to large construction firms.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 text-white bg-construction-blue md:py-32">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="mb-6 text-3xl font-bold md:text-5xl">Ready to Transform Your Construction Business?</h2>
              <p className="mb-10 text-xl opacity-90">
                Join thousands of successful contractors who have streamlined their operations with ConstructBuild
              </p>
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
                <Button size="lg" className="text-construction-blue bg-construction-yellow hover:bg-yellow-400">
                  Start Your Free Trial
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
                  Schedule a Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
