import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleBlocsTransfer = () => {
    // This will open your Blocs Transfer microsite - you'll need to replace with your actual URL
    window.open('https://your-blocs-transfer-url.com', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-gray-900 font-poppins">RiskBlocs</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#apps" className="text-gray-600 hover:text-blue-600 transition-colors">Apps</a>
              <a href="#security" className="text-gray-600 hover:text-blue-600 transition-colors">Security</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
              <Button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Enterprise Risk
                  <span className="text-blue-600 block">Management Platform</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg">
                  Advanced risk analytics and compliance management for modern enterprises. 
                  Streamline your risk operations with AI-powered insights.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>ISO 27001 Certified</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>SOC 2 Type II</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>GDPR Compliant</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Enterprise Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Support</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right Column - Call to Action */}
            <div className="flex justify-center lg:justify-end">
              <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-2">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Ready to Get Started?
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Join hundreds of enterprises using RiskBlocs for comprehensive risk management.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleGetStarted}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Access Platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{' '}
                      <button 
                        onClick={handleGetStarted}
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-600">
                      Need enterprise access?{' '}
                      <a href="#contact" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                        Contact Sales
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Comprehensive Risk Management
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to identify, assess, and mitigate risks across your organization
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bar-chart-3 h-8 w-8 text-blue-600"><path d="M3 3v18h18"/><path d="M7 17V7"/><path d="M11 17V3"/><path d="M15 17v-7"/></svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Risk Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Advanced analytics and reporting with real-time risk scoring and predictive modeling
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-8 w-8 text-green-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Compliance Monitoring</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Automated compliance tracking across multiple frameworks and regulatory requirements
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users h-8 w-8 text-purple-600"><path d="M15.9 16.3c.2-.7.4-1.4.4-2.1 0-4.1-2.7-6.8-6.8-6.8S2.7 10.1 2.7 14.2c0 .7.2 1.4.4 2.1"/><circle cx="5" cy="7" r="2"/><path d="M22 16.6c-.6-.9-1.3-1.7-2.1-2.3-2.7-2-5.9-3.1-9.1-3.1-3.2 0-6.3 1.1-9 3.1-.8.6-1.5 1.4-2.1 2.3"/><circle cx="12" cy="7" r="2"/><circle cx="19" cy="7" r="2"/></svg>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Streamlined workflows and communication tools for risk management teams
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Access Apps Section */}
      <section id="apps" className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Access Apps
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore our suite of specialized applications designed to enhance your risk management capabilities
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-white">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <path d="M12 18v-6"/>
                    <path d="m9 15 3 3 3-3"/>
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Blocs Transfer</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Secure file transfer and document management system for enterprise risk operations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Secure Transfer</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Document Management</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Real-time Sync</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Enterprise Ready</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleBlocsTransfer}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-medium"
                >
                  Access Blocs Transfer
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-sm text-gray-500">
                  Opens in a new window for seamless workflow integration
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold">
                Enterprise-Grade Security
              </h2>
              <p className="text-xl text-blue-100">
                Your data is protected by industry-leading security measures and compliance standards.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-5 w-5 text-blue-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-blue-100">End-to-end encryption</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-5 w-5 text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
                  <span className="text-blue-100">Multi-factor authentication</span>
                </div>
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up h-5 w-5 text-blue-400"><path d="M3 17 9 11 13 15 21 7"/><polyline points="14 7 21 7 21 14"/></svg>
                  <span className="text-blue-100">Continuous monitoring</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  <span className="text-blue-100">Regular audits</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-64 h-64 bg-blue-800/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield h-32 w-32 text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-6 w-6" />
                <span className="text-lg font-bold font-poppins">RiskBlocs</span>
              </div>
              <p className="text-gray-400 text-sm">
                Enterprise risk management platform trusted by organizations worldwide.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Product</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Features</a>
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Apps</a>
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Integrations</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Support</h3>
              <div className="space-y-2 text-sm">
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Documentation</a>
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Help Center</a>
                <a href="#" className="text-gray-400 hover:text-white block transition-colors">Contact Sales</a>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-white">Contact</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>sales@riskblocs.com</p>
                <p>+1 (555) 123-4567</p>
                <p>24/7 Support Available</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 RiskBlocs. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
