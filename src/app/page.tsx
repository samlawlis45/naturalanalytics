import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, MessageSquare, Zap, Shield, Globe } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">NaturalAnalytics</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/demo">
                <Button variant="ghost">Demo</Button>
              </Link>
              <Link href="/builder">
                <Button variant="ghost">Builder</Button>
              </Link>
              <Link href="/dashboards">
                <Button variant="ghost">Dashboards</Button>
              </Link>
              <Link href="/datasources">
                <Button variant="ghost">Data Sources</Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            🚀 Analytics that feels natural
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            Ask your data
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}anything
            </span>
          </h1>
          <p className="text-xl text-gray-900 mb-8 max-w-3xl mx-auto">
            Transform complex data into beautiful insights using natural language. 
            No SQL knowledge required. Just ask, and get instant visualizations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 py-6">
                Try Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/builder">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Visual Builder
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The future of analytics is here
            </h2>
            <p className="text-xl text-gray-900 max-w-2xl mx-auto">
              One platform, multiple ways to interact with your data
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Natural Language Queries</CardTitle>
                <CardDescription>
                  Simply ask &quot;Show me sales by region&quot; and get instant, beautiful charts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Visual Query Builder</CardTitle>
                <CardDescription>
                  Drag and drop to build complex dashboards without writing a single line of code
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Zap className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Instant Results</CardTitle>
                <CardDescription>
                  Get answers in seconds, not hours. Our AI understands your data instantly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-red-600 mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-grade security with role-based access control and data encryption
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <Globe className="h-12 w-12 text-indigo-600 mb-4" />
                <CardTitle>Multi-Platform</CardTitle>
                <CardDescription>
                  Works with PostgreSQL, MySQL, BigQuery, Snowflake, and more
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <ArrowRight className="h-12 w-12 text-orange-600 mb-4" />
                <CardTitle>API First</CardTitle>
                <CardDescription>
                  Integrate with your existing tools using our powerful REST API
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to transform your data?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teams already using NaturalAnalytics to make data-driven decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-gray-900">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">NaturalAnalytics</span>
              </div>
              <p className="text-gray-800">
                Analytics that feels natural. Transform your data into insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-800">
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/builder" className="hover:text-white">Builder</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-800">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-800">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-800">
            <p>&copy; 2024 NaturalAnalytics. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}