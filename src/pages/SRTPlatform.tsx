
import React from 'react';
import WorkedExample from '../components/WorkedExample';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, PiggyBank, Target, BarChart3, FileCheck, Users } from 'lucide-react';

const SRTPlatform = () => {
  const scrollToWorkedExample = () => {
    const workedExampleElement = document.getElementById('worked-example-section');
    if (workedExampleElement) {
      workedExampleElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Portfolio composition data
  const portfolioData = [
    { name: 'Large Corporate', value: 45, color: '#667eea' },
    { name: 'Mid-Market', value: 35, color: '#764ba2' },
    { name: 'SME', value: 20, color: '#f093fb' }
  ];

  // Geographic distribution data
  const geographicData = [
    { name: 'Germany', value: 35, color: '#667eea' },
    { name: 'France', value: 25, color: '#764ba2' },
    { name: 'Italy', value: 20, color: '#f093fb' },
    { name: 'Spain', value: 15, color: '#4ecdc4' },
    { name: 'Other EU', value: 5, color: '#45b7d1' }
  ];

  const chartConfig = {
    portfolio: {
      label: "Portfolio Composition",
    },
    geographic: {
      label: "Geographic Distribution",
    },
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
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left">
              <h1 className="text-5xl font-bold text-gray-900 mb-6 font-poppins">Unlock Capital Efficiency with SRT</h1>
              <p className="text-xl text-gray-700 mb-8 font-poppins">
                Our platform empowers banks to optimize their balance sheets through synthetic securitization, reducing RWA and enhancing ROE.
              </p>
              <div className="flex space-x-4">
                <a href="/apps" className="inline-block bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors font-poppins font-medium">
                  Explore the Platform
                </a>
                <a href="#contact" className="inline-block bg-transparent border-2 border-blue-600 text-blue-600 py-3 px-8 rounded-lg hover:bg-blue-50 hover:border-blue-700 hover:text-blue-700 transition-colors font-poppins font-medium">
                  Contact Us
                </a>
              </div>
            </div>
            <div className="hero-image">
              <div className="relative bg-white rounded-lg shadow-2xl p-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Financial Analytics Dashboard</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Live Data</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Portfolio Value</div>
                    <div className="text-2xl font-bold text-blue-600">€2.4B</div>
                    <div className="text-xs text-green-600">+12.3%</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Risk-Weighted Assets</div>
                    <div className="text-2xl font-bold text-purple-600">€480M</div>
                    <div className="text-xs text-red-600">-23.1%</div>
                  </div>
                </div>

                {/* Portfolio Analysis Charts */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-2 font-medium">Portfolio Composition</div>
                    <ChartContainer config={chartConfig} className="h-24">
                      <PieChart>
                        <Pie
                          data={portfolioData}
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={35}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {portfolioData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs text-gray-500">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-2 font-medium">Geographic Distribution</div>
                    <ChartContainer config={chartConfig} className="h-24">
                      <PieChart>
                        <Pie
                          data={geographicData}
                          cx="50%"
                          cy="50%"
                          innerRadius={15}
                          outerRadius={35}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {geographicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {geographicData.map((item, index) => (
                        <div key={index} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span className="text-xs text-gray-500">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-3 font-medium">Capital Efficiency Trend</div>
                  <div className="relative h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-3">
                    <div className="flex items-end justify-between h-full gap-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 h-8 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q1</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-blue-600 to-blue-400 h-12 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q2</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-purple-600 to-purple-400 h-16 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q3</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-purple-600 to-purple-400 h-10 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q4</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-indigo-600 to-indigo-400 h-14 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q1</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-4 bg-gradient-to-t from-indigo-600 to-indigo-400 h-18 rounded-t shadow-sm"></div>
                        <span className="text-xs text-gray-500">Q2</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="text-xs text-green-600 font-medium">↗ +24%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Context Section */}
      <section id="market-context" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 font-poppins">Market Context</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-poppins leading-relaxed">
              The global SRT market is experiencing unprecedented growth as financial institutions seek innovative solutions for capital optimization.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="text-2xl text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">RWA Optimization</h3>
                <p className="text-gray-700 font-poppins text-center leading-relaxed">
                  Reduce risk-weighted assets and free up capital for new lending opportunities through strategic portfolio management.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold text-blue-700">
                    Up to 80% reduction
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <PiggyBank className="text-2xl text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">Capital Relief</h3>
                <p className="text-gray-700 font-poppins text-center leading-relaxed">
                  Achieve significant capital relief while maintaining regulatory compliance and operational efficiency.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold text-emerald-700">
                    Regulatory compliant
                  </div>
                </div>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="text-2xl text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">Enhanced ROE</h3>
                <p className="text-gray-700 font-poppins text-center leading-relaxed">
                  Improve return on equity and drive shareholder value through efficient capital management strategies.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-semibold text-purple-700">
                    Maximize returns
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop&crop=center" 
              alt="Financial market analysis and growth charts" 
              className="rounded-2xl shadow-2xl mx-auto w-full max-w-5xl h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Platform Overview Section */}
      <section id="platform-overview" className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12 font-poppins">Platform Overview</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="platform-description">
              <h3 className="text-3xl font-semibold text-gray-800 mb-6 font-poppins">End-to-End SRT Solution</h3>
              <p className="text-lg text-gray-700 mb-8 font-poppins">
                Our platform provides a comprehensive suite of tools and services to facilitate synthetic securitization transactions, from initial portfolio analysis to ongoing performance monitoring.
              </p>
              <ul className="space-y-4 text-gray-600 font-poppins">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Portfolio Analysis & Structuring
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Documentation & Regulatory Approval
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Market Execution & Investor Engagement
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                  Ongoing Performance Monitoring
                </li>
              </ul>
            </div>
            <div className="platform-image">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&crop=center" 
                alt="Advanced analytics dashboard interface" 
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
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
      <section id="capabilities" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 font-poppins">Platform Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-poppins leading-relaxed">
              Comprehensive tools and expertise to optimize your SRT transactions from analysis to execution.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Advanced Analytics */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">Advanced Analytics</h3>
                <p className="text-gray-600 font-poppins text-center leading-relaxed mb-6">
                  Leverage our proprietary models for comprehensive portfolio analysis, sophisticated risk assessment, and strategic capital optimization.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Portfolio risk modeling
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Stress testing scenarios
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    Capital optimization insights
                  </div>
                </div>
              </div>
            </div>

            {/* Regulatory Expertise */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">Regulatory Expertise</h3>
                <p className="text-gray-600 font-poppins text-center leading-relaxed mb-6">
                  Navigate complex regulatory requirements with confidence through our team of experienced SRT professionals and compliance specialists.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                    Basel III/IV compliance
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                    Regulatory approval support
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full mr-3"></div>
                    Documentation expertise
                  </div>
                </div>
              </div>
            </div>

            {/* Investor Network */}
            <div className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100/50 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4 font-poppins text-center">Investor Network</h3>
                <p className="text-gray-600 font-poppins text-center leading-relaxed mb-6">
                  Access our extensive network of institutional investors who specialize in SRT transactions and understand the market dynamics.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Insurance companies
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Pension funds
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                    Asset managers
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=400&fit=crop&crop=center" 
              alt="Team collaboration and advanced technology workspace" 
              className="rounded-2xl shadow-2xl mx-auto w-full max-w-5xl h-80 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-choose" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12 font-poppins">Why Choose Us</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="reasons-list">
              <ul className="space-y-8">
                <li className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2 font-poppins">Proven Track Record</h4>
                    <p className="text-gray-600 font-poppins">Successfully executed SRT transactions for leading European banks.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2 font-poppins">Customized Solutions</h4>
                    <p className="text-gray-600 font-poppins">Tailored SRT structures to meet your specific needs and objectives.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <i className="fas fa-check text-white text-sm"></i>
                  </div>
                  <div className="reason-content">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2 font-poppins">Transparent Process</h4>
                    <p className="text-gray-600 font-poppins">Clear and transparent communication throughout the entire transaction lifecycle.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="team-image">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop&crop=center" 
                alt="Professional team meeting in modern office" 
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-16 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8 font-poppins">Ready to Optimize Your Capital?</h2>
          <p className="text-xl mb-12 font-poppins max-w-2xl mx-auto">Contact us today to learn more about our SRT platform and how it can benefit your institution.</p>
          <a href="/apps" className="inline-block bg-white text-blue-600 py-3 px-8 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors font-poppins font-medium">
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-poppins">
              &copy; 2024 RiskBlocs Platform. All rights reserved.
            </div>
            <div className="social-links space-x-4">
              <a href="#" className="hover:text-blue-300 transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="#" className="hover:text-blue-300 transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="hover:text-blue-300 transition-colors">
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
