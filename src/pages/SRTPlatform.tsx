import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import LoginPopup from '@/components/LoginPopup';
const SRTPlatform = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [selectedPortfolio, setSelectedPortfolio] = useState('corporate');
  const navigate = useNavigate();

  // Sample data for the analytics chart
  const chartData = [{
    name: 'Jan',
    value: 2200
  }, {
    name: 'Feb',
    value: 2350
  }, {
    name: 'Mar',
    value: 2400
  }, {
    name: 'Apr',
    value: 2280
  }, {
    name: 'May',
    value: 2450
  }, {
    name: 'Jun',
    value: 2400
  }];

  // Demo data
  const demoPortfolios = {
    corporate: {
      name: 'Corporate Loan Portfolio',
      size: '€2.4B',
      rwa: '€480M',
      rating: 'BBB+',
      data: [{
        month: 'Jan',
        value: 2400,
        rwa: 480
      }, {
        month: 'Feb',
        value: 2350,
        rwa: 470
      }, {
        month: 'Mar',
        value: 2420,
        rwa: 485
      }, {
        month: 'Apr',
        value: 2380,
        rwa: 475
      }, {
        month: 'May',
        value: 2450,
        rwa: 490
      }, {
        month: 'Jun',
        value: 2500,
        rwa: 495
      }]
    },
    retail: {
      name: 'Retail Mortgage Portfolio',
      size: '€1.8B',
      rwa: '€360M',
      rating: 'A-',
      data: [{
        month: 'Jan',
        value: 1800,
        rwa: 360
      }, {
        month: 'Feb',
        value: 1820,
        rwa: 365
      }, {
        month: 'Mar',
        value: 1780,
        rwa: 355
      }, {
        month: 'Apr',
        value: 1850,
        rwa: 370
      }, {
        month: 'May',
        value: 1900,
        rwa: 380
      }, {
        month: 'Jun',
        value: 1950,
        rwa: 390
      }]
    }
  };

  // Worked example data
  const sampleTransaction = {
    original: {
      portfolioValue: 5000,
      riskWeight: 100,
      rwa: 5000,
      capitalRequired: 400,
      capitalRatio: 8.0
    },
    postSRT: {
      portfolioValue: 5000,
      riskWeight: 20,
      rwa: 1000,
      capitalRequired: 80,
      capitalRatio: 8.0,
      capitalFreed: 320
    }
  };
  const riskDistribution = [{
    name: 'AAA-AA',
    value: 30,
    color: '#22c55e'
  }, {
    name: 'A-BBB',
    value: 45,
    color: '#3b82f6'
  }, {
    name: 'BB-B',
    value: 20,
    color: '#f59e0b'
  }, {
    name: 'Below B',
    value: 5,
    color: '#ef4444'
  }];
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
  const handleLogoClick = () => {
    navigate('/');
  };
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>;
  }
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <LoginPopup isOpen={showLoginPopup} onLogin={handleLogin} />
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
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
            <button onClick={handleLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0">
              <img src="/lovable-uploads/e976cf33-12c9-4927-8899-fd3e3963f4f7.png" alt="RiskBlocs Logo" className="h-6 w-6" />
              <span className="text-lg font-semibold text-gray-900">RiskBlocs</span>
            </button>
            <div className="flex items-center space-x-8">
              <button onClick={() => window.location.hash = 'home'} className="text-blue-600 font-medium bg-transparent border-none cursor-pointer">Home</button>
              <button onClick={() => document.getElementById('demo')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer">Demo</button>
              <button onClick={() => document.getElementById('example')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-gray-600 hover:text-gray-900 bg-transparent border-none cursor-pointer">Worked Example</button>
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">RiskBlocs</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/apps" className="text-sm text-blue-600 hover:text-blue-800">Access Apps</a>
              <button onClick={handleLogout} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
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
              <p className="text-xl text-gray-600 mb-8">RiskBlocs is the comprehensive platform for Significant Risk Transfer transactions. Optimize capital efficiency, manage transaction data flows, and unlock growth potential with cutting-edge analytics and regulatory-compliant solutions.</p>
              
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
                <a href="#demo" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                  <i className="fas fa-play"></i>
                  Explore Demo
                </a>
                <a href="#example" className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-2">
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
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{
                        fill: '#2563eb',
                        strokeWidth: 2
                      }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Demo</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience our SRT platform with live data and interactive features. Select a portfolio and explore the analytics.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Portfolio Selector */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Portfolio</h3>
              <div className="flex gap-4">
                {Object.entries(demoPortfolios).map(([key, portfolio]) => <button key={key} onClick={() => setSelectedPortfolio(key)} className={`px-6 py-3 rounded-lg font-medium transition-all ${selectedPortfolio === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {portfolio.name}
                  </button>)}
              </div>
            </div>

            {/* Portfolio Overview */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Portfolio Value</h4>
                <div className="text-3xl font-bold text-blue-600">{demoPortfolios[selectedPortfolio].size}</div>
                <div className="text-sm text-green-600">Rating: {demoPortfolios[selectedPortfolio].rating}</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Risk-Weighted Assets</h4>
                <div className="text-3xl font-bold text-purple-600">{demoPortfolios[selectedPortfolio].rwa}</div>
                <div className="text-sm text-gray-600">Current RWA</div>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-2">SRT Potential</h4>
                <div className="text-3xl font-bold text-green-600">65%</div>
                <div className="text-sm text-gray-600">RWA Reduction</div>
              </div>
            </div>

            {/* Interactive Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={demoPortfolios[selectedPortfolio].data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Portfolio Value (€M)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk-Weighted Assets</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demoPortfolios[selectedPortfolio].data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Bar dataKey="rwa" fill="#8b5cf6" name="RWA (€M)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SRT Analysis */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">SRT Analysis Results</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Recommended Structure</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Senior Tranche: 85% (€{(parseFloat(demoPortfolios[selectedPortfolio].size.replace('€', '').replace('B', '')) * 0.85).toFixed(1)}B)</li>
                    <li>• Mezzanine Tranche: 10% (€{(parseFloat(demoPortfolios[selectedPortfolio].size.replace('€', '').replace('B', '')) * 0.10).toFixed(1)}B)</li>
                    <li>• First Loss: 5% (€{(parseFloat(demoPortfolios[selectedPortfolio].size.replace('€', '').replace('B', '')) * 0.05).toFixed(1)}B)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Expected Benefits</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Capital Relief: €{(parseFloat(demoPortfolios[selectedPortfolio].rwa.replace('€', '').replace('M', '')) * 0.65 * 0.08).toFixed(0)}M</li>
                    <li>• ROE Improvement: +{(parseFloat(demoPortfolios[selectedPortfolio].rwa.replace('€', '').replace('M', '')) * 0.65 * 0.08 / 1000 * 15).toFixed(1)}%</li>
                    <li>• Regulatory Compliance: ✓</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Worked Example Section */}
      <section id="example" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Worked Example</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Step-by-step walkthrough of a real SRT transaction showing capital optimization benefits.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Transaction Overview */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Case Study: European Bank Corporate Portfolio</h3>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Transaction Details</h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Portfolio:</strong> Corporate Loans</p>
                    <p><strong>Size:</strong> €5.0 billion</p>
                    <p><strong>Asset Class:</strong> Investment Grade Corporate</p>
                  </div>
                  <div>
                    <p><strong>Structure:</strong> Synthetic Securitization</p>
                    <p><strong>Protection:</strong> Credit Default Swap</p>
                    <p><strong>Regulatory Framework:</strong> CRR/CRD IV</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Before and After Comparison */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-red-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-red-800 mb-4">Before SRT</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Portfolio Value:</span>
                    <span className="font-bold">€{sampleTransaction.original.portfolioValue.toLocaleString()}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Weight:</span>
                    <span className="font-bold">{sampleTransaction.original.riskWeight}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk-Weighted Assets:</span>
                    <span className="font-bold">€{sampleTransaction.original.rwa.toLocaleString()}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capital Required (8%):</span>
                    <span className="font-bold">€{sampleTransaction.original.capitalRequired.toLocaleString()}M</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-green-800 mb-4">After SRT</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Portfolio Value:</span>
                    <span className="font-bold">€{sampleTransaction.postSRT.portfolioValue.toLocaleString()}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk Weight:</span>
                    <span className="font-bold">{sampleTransaction.postSRT.riskWeight}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Risk-Weighted Assets:</span>
                    <span className="font-bold">€{sampleTransaction.postSRT.rwa.toLocaleString()}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capital Required (8%):</span>
                    <span className="font-bold">€{sampleTransaction.postSRT.capitalRequired.toLocaleString()}M</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-green-700 font-semibold">Capital Freed:</span>
                    <span className="font-bold text-green-700">€{sampleTransaction.postSRT.capitalFreed.toLocaleString()}M</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Comparison Charts */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Capital Impact</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{
                    name: 'Before SRT',
                    capital: sampleTransaction.original.capitalRequired,
                    freed: 0
                  }, {
                    name: 'After SRT',
                    capital: sampleTransaction.postSRT.capitalRequired,
                    freed: sampleTransaction.postSRT.capitalFreed
                  }]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Bar dataKey="capital" fill="#ef4444" name="Required Capital (€M)" />
                      <Bar dataKey="freed" fill="#22c55e" name="Capital Freed (€M)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Risk Distribution</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({
                      name,
                      value
                    }) => `${name}: ${value}%`}>
                        {riskDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Step-by-step Process */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Transaction Process</h4>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">Portfolio Analysis</h5>
                  <p className="text-xs text-gray-600">Credit assessment and due diligence</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">Structure Design</h5>
                  <p className="text-xs text-gray-600">Tranche sizing and pricing optimization</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">Risk Transfer</h5>
                  <p className="text-xs text-gray-600">CDS execution and settlement</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <h5 className="font-medium text-gray-900 mb-1">Capital Relief</h5>
                  <p className="text-xs text-gray-600">Regulatory recognition and reporting</p>
                </div>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">80%</div>
                <div className="text-sm text-gray-600">RWA Reduction</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">15%</div>
                <div className="text-sm text-gray-600">ROE Improvement</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">€320M</div>
                <div className="text-sm text-gray-600">Capital Freed</div>
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
            <a href="#demo" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2">
              <i className="fas fa-play"></i>
              Try Interactive Demo
            </a>
            <a href="#example" className="bg-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-400 transition-colors inline-flex items-center justify-center gap-2">
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
                <li><a href="#demo" className="hover:text-white">Demo</a></li>
                <li><a href="#example" className="hover:text-white">Examples</a></li>
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
    </div>;
};
export default SRTPlatform;