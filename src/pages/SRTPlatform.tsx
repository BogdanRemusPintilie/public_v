
import React, { useState, useEffect } from 'react';
import LoginPopup from '@/components/LoginPopup';

const SRTPlatform = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('homepageAuthenticated') === 'true';
    setIsAuthenticated(authenticated);
    setShowLoginPopup(!authenticated);
    setIsLoading(false);
  }, []);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      setShowLoginPopup(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('homepageAuthenticated');
    setIsAuthenticated(false);
    setShowLoginPopup(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <LoginPopup isOpen={showLoginPopup} onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center gap-5">
          <span className="text-sm font-medium">Complete SRT Platform Suite</span>
          <a href="/apps" className="bg-white/20 border border-white/30 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-white/30 transition-all inline-flex items-center gap-2">
            <i className="fas fa-external-link-alt text-xs"></i>
            Access Apps
          </a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-6 w-6" />
              <span className="text-lg font-semibold text-gray-900">RiskBlocs</span>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/#home" className="text-blue-600 font-medium">Home</a>
              <a href="/srt-platform/demo" className="text-gray-600 hover:text-gray-900">Demo</a>
              <a href="/srt-platform/example" className="text-gray-600 hover:text-gray-900">Worked Example</a>
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">RiskBlocs</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/apps" className="text-sm text-blue-600 hover:text-blue-800">Access Apps</a>
              <button
                onClick={handleLogout}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                Transform Risk into <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Opportunity</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                The comprehensive platform for Significant Risk Transfer transactions. Optimize capital efficiency, manage credit risk, and unlock growth potential with cutting-edge analytics and regulatory-compliant solutions.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">€200B+</div>
                  <div className="text-sm text-gray-600">Transactions Facilitated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">95%</div>
                  <div className="text-sm text-gray-600">Capital Efficiency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">50+</div>
                  <div className="text-sm text-gray-600">Global Institutions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">99.9%</div>
                  <div className="text-sm text-gray-600">Compliance Rate</div>
                </div>
              </div>

              <div className="flex gap-4">
                <a href="/srt-platform/demo" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                  <i className="fas fa-play"></i>
                  Explore Demo
                </a>
                <a href="/srt-platform/example" className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
                  <i className="fas fa-chart-bar"></i>
                  View Example
                </a>
              </div>
            </div>
            
            <div className="lg:pl-8">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">SRT Analytics Dashboard</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Live Data</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Portfolio Value</div>
                      <div className="text-2xl font-bold text-gray-900">€2.4B</div>
                      <div className="text-sm text-green-600">+12.3%</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Risk-Weighted Assets</div>
                      <div className="text-2xl font-bold text-gray-900">€480M</div>
                      <div className="text-sm text-red-600">-23.1%</div>
                    </div>
                  </div>
                  <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Analytics Chart</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Complete SRT Platform Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From portfolio analysis to transaction execution, our integrated platform covers every aspect of Significant Risk Transfer transactions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-blue-50">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Engine</h3>
              <p className="text-gray-600">Advanced portfolio analysis with ML-powered risk assessment and predictive modeling.</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-green-50">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-cogs text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Structure Optimizer</h3>
              <p className="text-gray-600">Automated SRT structure recommendations with optimal tranche sizing and pricing.</p>
            </div>
            
            <div className="text-center p-6 rounded-xl bg-purple-50">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-white text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compliance Suite</h3>
              <p className="text-gray-600">Regulatory framework mapping with automated documentation and monitoring.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Risk Management?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Discover how our SRT platform can optimize your capital efficiency and enhance your risk management capabilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/srt-platform/demo" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
              <i className="fas fa-play"></i>
              Try Interactive Demo
            </a>
            <a href="/srt-platform/example" className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors inline-flex items-center justify-center gap-2">
              <i className="fas fa-chart-line"></i>
              View Worked Example
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-6 w-6" />
                <span className="text-lg font-semibold">BlocsTransfer</span>
              </div>
              <p className="text-gray-400">Advanced Significant Risk Transfer solutions for modern banking.</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="/srt-platform/demo" className="hover:text-white">Demo</a></li>
                <li><a href="/srt-platform/example" className="hover:text-white">Examples</a></li>
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">White Papers</a></li>
                <li><a href="#" className="hover:text-white">Case Studies</a></li>
                <li><a href="#" className="hover:text-white">Regulatory Updates</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BlocsTransfer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SRTPlatform;
