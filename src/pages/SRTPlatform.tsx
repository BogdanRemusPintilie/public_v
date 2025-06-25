import React from 'react';
import WorkedExample from '../components/WorkedExample';

const SRTPlatform = () => {
  const scrollToWorkedExample = () => {
    const workedExampleElement = document.getElementById('worked-example-section');
    if (workedExampleElement) {
      workedExampleElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" 
                alt="RiskBlocs Logo" 
                className="h-6 w-6" 
              />
              <span className="text-2xl font-bold text-black font-poppins">RiskBlocs</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#hero" className="text-gray-600 hover:text-blue-600 transition-colors">Home</a>
              <a href="#market-context" className="text-gray-600 hover:text-blue-600 transition-colors">Market Context</a>
              <a href="#platform-overview" className="text-gray-600 hover:text-blue-600 transition-colors">Platform</a>
              <button 
                onClick={scrollToWorkedExample}
                className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer border-none bg-transparent"
              >
                Worked Example
              </button>
              <a href="#capabilities" className="text-gray-600 hover:text-blue-600 transition-colors">Capabilities</a>
              <a href="#why-choose" className="text-gray-600 hover:text-blue-600 transition-colors">Why Choose Us</a>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">Unlock Capital Efficiency with SRT</h1>
              <p className="text-xl text-gray-700 mb-8">
                Our platform empowers banks to optimize their balance sheets through synthetic securitization, reducing RWA and enhancing ROE.
              </p>
              <div className="flex space-x-4">
                <a href="/apps" className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">
                  Explore the Platform
                </a>
                <a href="#contact" className="inline-block bg-transparent border-2 border-blue-600 text-blue-600 py-3 px-8 rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
            <div className="hero-image">
              <img src="https://via.placeholder.com/600x400" alt="SRT Platform" className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Market Context Section */}
      <section id="market-context" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Market Context</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="market-item text-center">
              <i className="fas fa-chart-line text-5xl text-blue-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">RWA Optimization</h3>
              <p className="text-gray-600">Reduce risk-weighted assets and free up capital for new lending opportunities.</p>
            </div>
            <div className="market-item text-center">
              <i className="fas fa-piggy-bank text-5xl text-green-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Capital Relief</h3>
              <p className="text-gray-600">Achieve significant capital relief while maintaining regulatory compliance.</p>
            </div>
            <div className="market-item text-center">
              <i className="fas fa-rocket text-5xl text-purple-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Enhanced ROE</h3>
              <p className="text-gray-600">Improve return on equity and drive shareholder value through efficient capital management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview Section */}
      <section id="platform-overview" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Platform Overview</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="platform-description">
              <h3 className="text-3xl font-semibold text-gray-800 mb-6">End-to-End SRT Solution</h3>
              <p className="text-lg text-gray-700 mb-8">
                Our platform provides a comprehensive suite of tools and services to facilitate synthetic securitization transactions, from initial portfolio analysis to ongoing performance monitoring.
              </p>
              <ul className="list-disc list-inside text-gray-600">
                <li>Portfolio Analysis & Structuring</li>
                <li>Documentation & Regulatory Approval</li>
                <li>Market Execution & Investor Engagement</li>
                <li>Ongoing Performance Monitoring</li>
              </ul>
            </div>
            <div className="platform-image">
              <img src="https://via.placeholder.com/600x400" alt="Platform Interface" className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Worked Example Section */}
      <section id="worked-example-section" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <WorkedExample />
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="capability-item text-center">
              <i className="fas fa-calculator text-5xl text-blue-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Leverage our proprietary models for portfolio analysis, risk assessment, and capital optimization.</p>
            </div>
            <div className="capability-item text-center">
              <i className="fas fa-file-alt text-5xl text-green-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Regulatory Expertise</h3>
              <p className="text-gray-600">Navigate complex regulatory requirements with our team of experienced SRT professionals.</p>
            </div>
            <div className="capability-item text-center">
              <i className="fas fa-handshake text-5xl text-purple-600 mb-4"></i>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">Investor Network</h3>
              <p className="text-gray-600">Access our extensive network of institutional investors specializing in SRT transactions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="reasons-list">
              <ul className="space-y-6">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">Proven Track Record</h4>
                    <p className="text-gray-600">Successfully executed SRT transactions for leading European banks.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">Customized Solutions</h4>
                    <p className="text-gray-600">Tailored SRT structures to meet your specific needs and objectives.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">Transparent Process</h4>
                    <p className="text-gray-600">Clear and transparent communication throughout the entire transaction lifecycle.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="team-image">
              <img src="https://via.placeholder.com/600x400" alt="Our Team" className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Optimize Your Capital?</h2>
          <p className="text-xl mb-12">Contact us today to learn more about our SRT platform and how it can benefit your institution.</p>
          <a href="#contact" className="inline-block bg-white text-blue-600 py-3 px-8 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors">
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-lg">
              &copy; 2024 SRT Platform. All rights reserved.
            </div>
            <div className="social-links space-x-4">
              <a href="#" className="hover:text-blue-300">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="hover:text-blue-300">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="hover:text-blue-300">
                <i className="fab fa-facebook-f"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SRTPlatform;
