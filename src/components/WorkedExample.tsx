import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui/chart';
import { PieChart, Pie, Cell } from 'recharts';

const WorkedExample = () => {
  // Portfolio composition data for the sector distribution chart
  const sectorData = [
    { name: 'Manufacturing', value: 28, color: '#667eea' },
    { name: 'Services', value: 24, color: '#764ba2' },
    { name: 'Real Estate', value: 18, color: '#f093fb' },
    { name: 'Technology', value: 15, color: '#4ecdc4' },
    { name: 'Other', value: 15, color: '#45b7d1' }
  ];

  const chartConfig = {
    sector: {
      label: "Sector Distribution",
    },
  };

  return (
    <div className="worked-example-container">
      <Collapsible defaultOpen={false}>
        <CollapsibleTrigger className="w-full group">
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer">
            <div className="text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Worked Example</h2>
              <p className="text-lg text-gray-600">Deep dive into a real-world SRT transaction from start to finish</p>
            </div>
            <ChevronDown className="h-6 w-6 text-gray-600 group-data-[state=open]:rotate-180 transition-transform duration-200" />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-6">
          <div className="worked-example-content">
            {/* Hero Section */}
            <section className="example-hero">
              <div className="container mx-auto px-4">
                <div className="hero-content text-center py-16">
                  <h1 className="text-5xl font-bold mb-6">
                    SRT Transaction: <span className="gradient-text bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">A Complete Walkthrough</span>
                  </h1>
                  <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Follow a real-world example of how a major European bank used our platform to execute a €1.2B synthetic securitization, achieving 78% RWA reduction while maintaining full regulatory compliance.
                  </p>
                  <div className="example-metrics grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    <div className="metric-item bg-white p-6 rounded-lg shadow-md">
                      <div className="metric-number text-3xl font-bold text-blue-600">€1.2B</div>
                      <div className="metric-label text-sm text-gray-600">Portfolio Size</div>
                    </div>
                    <div className="metric-item bg-white p-6 rounded-lg shadow-md">
                      <div className="metric-number text-3xl font-bold text-green-600">78%</div>
                      <div className="metric-label text-sm text-gray-600">RWA Reduction</div>
                    </div>
                    <div className="metric-item bg-white p-6 rounded-lg shadow-md">
                      <div className="metric-number text-3xl font-bold text-purple-600">3 months</div>
                      <div className="metric-label text-sm text-gray-600">Execution Time</div>
                    </div>
                    <div className="metric-item bg-white p-6 rounded-lg shadow-md">
                      <div className="metric-number text-3xl font-bold text-orange-600">AAA</div>
                      <div className="metric-label text-sm text-gray-600">Rating Achieved</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Transaction Overview */}
            <section className="transaction-overview py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Transaction Overview</h2>
                <div className="grid md:grid-cols-2 gap-12">
                  <div className="overview-content">
                    <h3 className="text-2xl font-semibold mb-6">Bank Profile</h3>
                    <div className="bank-info bg-white p-6 rounded-lg shadow-md mb-8">
                      <div className="info-item mb-4">
                        <span className="label font-semibold text-gray-700">Institution:</span>
                        <span className="value ml-2">Major European Bank</span>
                      </div>
                      <div className="info-item mb-4">
                        <span className="label font-semibold text-gray-700">Total Assets:</span>
                        <span className="value ml-2">€450 billion</span>
                      </div>
                      <div className="info-item mb-4">
                        <span className="label font-semibold text-gray-700">Geography:</span>
                        <span className="value ml-2">15 European countries</span>
                      </div>
                      <div className="info-item">
                        <span className="label font-semibold text-gray-700">Focus:</span>
                        <span className="value ml-2">Corporate & SME lending</span>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold mb-6">Objectives</h3>
                    <ul className="objectives-list space-y-3">
                      <li className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span>Optimize capital efficiency while maintaining lending capacity</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span>Achieve significant RWA reduction on corporate loan portfolio</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span>Maintain full regulatory compliance across all jurisdictions</span>
                      </li>
                      <li className="flex items-start">
                        <i className="fas fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span>Establish framework for future SRT transactions</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="timeline-content">
                    <h3 className="text-2xl font-semibold mb-6">Timeline</h3>
                    <div className="timeline space-y-6">
                      <div className="timeline-item flex">
                        <div className="timeline-marker w-4 h-4 bg-blue-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <div className="timeline-date font-semibold text-blue-600">Month 1</div>
                          <div className="timeline-title font-medium">Portfolio Analysis & Structure Design</div>
                          <div className="timeline-desc text-sm text-gray-600">Comprehensive risk assessment and optimal structure determination</div>
                        </div>
                      </div>
                      <div className="timeline-item flex">
                        <div className="timeline-marker w-4 h-4 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <div className="timeline-date font-semibold text-green-600">Month 2</div>
                          <div className="timeline-title font-medium">Documentation & Regulatory Approval</div>
                          <div className="timeline-desc text-sm text-gray-600">Legal documentation and supervisor engagement</div>
                        </div>
                      </div>
                      <div className="timeline-item flex">
                        <div className="timeline-marker w-4 h-4 bg-purple-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                        <div>
                          <div className="timeline-date font-semibold text-purple-600">Month 3</div>
                          <div className="timeline-title font-medium">Execution & Settlement</div>
                          <div className="timeline-desc text-sm text-gray-600">Market execution and transaction closing</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="key-metrics mt-8 p-6 bg-white rounded-lg shadow-md">
                      <h4 className="font-semibold mb-4">Key Metrics</h4>
                      <div className="metrics-grid grid grid-cols-2 gap-4">
                        <div className="metric">
                          <div className="metric-value text-2xl font-bold text-blue-600">€1.2B</div>
                          <div className="metric-label text-sm text-gray-600">Reference Portfolio</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value text-2xl font-bold text-green-600">€312M</div>
                          <div className="metric-label text-sm text-gray-600">RWA Relief</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value text-2xl font-bold text-purple-600">15.2%</div>
                          <div className="metric-label text-sm text-gray-600">ROE Improvement</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value text-2xl font-bold text-orange-600">8.5%</div>
                          <div className="metric-label text-sm text-gray-600">Protection Premium</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Portfolio Analysis */}
            <section className="portfolio-analysis py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Portfolio Analysis</h2>
                <div className="analysis-grid grid lg:grid-cols-2 gap-12">
                  <div className="portfolio-composition">
                    <h3 className="text-2xl font-semibold mb-6">Portfolio Composition</h3>
                    <div className="composition-chart bg-white p-6 rounded-lg shadow-md">
                      <div className="flex items-start gap-6">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium mb-4">Sector Distribution</h4>
                          <div className="composition-breakdown space-y-3">
                            <div className="breakdown-item flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                                <span>Manufacturing</span>
                              </div>
                              <span className="font-semibold">28%</span>
                            </div>
                            <div className="breakdown-item flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                                <span>Services</span>
                              </div>
                              <span className="font-semibold">24%</span>
                            </div>
                            <div className="breakdown-item flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                                <span>Real Estate</span>
                              </div>
                              <span className="font-semibold">18%</span>
                            </div>
                            <div className="breakdown-item flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                                <span>Technology</span>
                              </div>
                              <span className="font-semibold">15%</span>
                            </div>
                            <div className="breakdown-item flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                                <span>Other</span>
                              </div>
                              <span className="font-semibold">15%</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-48">
                          <ChartContainer config={chartConfig} className="h-48">
                            <PieChart>
                              <Pie
                                data={sectorData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {sectorData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </PieChart>
                          </ChartContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="geographic-distribution">
                    <h3 className="text-2xl font-semibold mb-6">Geographic Distribution</h3>
                    <div className="geo-chart bg-white p-6 rounded-lg shadow-md">
                      <div className="chart-placeholder bg-gradient-to-br from-green-100 to-blue-100 h-64 rounded-lg flex items-center justify-center mb-6">
                        <div className="text-center">
                          <i className="fas fa-globe-europe text-4xl text-green-500 mb-2"></i>
                          <div className="text-lg font-medium">European Exposure</div>
                        </div>
                      </div>
                      <div className="geo-breakdown space-y-3">
                        <div className="breakdown-item flex justify-between items-center">
                          <span>Germany</span>
                          <span className="font-semibold">32%</span>
                        </div>
                        <div className="breakdown-item flex justify-between items-center">
                          <span>France</span>
                          <span className="font-semibold">22%</span>
                        </div>
                        <div className="breakdown-item flex justify-between items-center">
                          <span>Italy</span>
                          <span className="font-semibold">18%</span>
                        </div>
                        <div className="breakdown-item flex justify-between items-center">
                          <span>Spain</span>
                          <span className="font-semibold">14%</span>
                        </div>
                        <div className="breakdown-item flex justify-between items-center">
                          <span>Netherlands</span>
                          <span className="font-semibold">8%</span>
                        </div>
                        <div className="breakdown-item flex justify-between items-center">
                          <span>Other EU</span>
                          <span className="font-semibold">6%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="credit-quality mt-12">
                  <h3 className="text-2xl font-semibold mb-6 text-center">Credit Quality & Risk Metrics</h3>
                  <div className="quality-grid grid md:grid-cols-3 gap-8">
                    <div className="quality-card bg-white p-6 rounded-lg shadow-md">
                      <h4 className="font-semibold mb-4 text-center">Rating Distribution</h4>
                      <div className="rating-breakdown space-y-3">
                        <div className="rating-item flex justify-between">
                          <span className="text-green-600 font-medium">AAA-AA</span>
                          <span>12%</span>
                        </div>
                        <div className="rating-item flex justify-between">
                          <span className="text-blue-600 font-medium">A-BBB</span>
                          <span>68%</span>
                        </div>
                        <div className="rating-item flex justify-between">
                          <span className="text-orange-600 font-medium">BB-B</span>
                          <span>18%</span>
                        </div>
                        <div className="rating-item flex justify-between">
                          <span className="text-red-600 font-medium">Below B</span>
                          <span>2%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="quality-card bg-white p-6 rounded-lg shadow-md">
                      <h4 className="font-semibold mb-4 text-center">Key Risk Metrics</h4>
                      <div className="risk-metrics space-y-3">
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Average PD</div>
                          <div className="metric-value text-lg font-semibold">1.2%</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Average LGD</div>
                          <div className="metric-value text-lg font-semibold">45%</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Weighted Maturity</div>
                          <div className="metric-value text-lg font-semibold">3.2 years</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Concentration (HHI)</div>
                          <div className="metric-value text-lg font-semibold">0.08</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="quality-card bg-white p-6 rounded-lg shadow-md">
                      <h4 className="font-semibold mb-4 text-center">Historical Performance</h4>
                      <div className="performance-metrics space-y-3">
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">3-Year Default Rate</div>
                          <div className="metric-value text-lg font-semibold">0.8%</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Recovery Rate</div>
                          <div className="metric-value text-lg font-semibold">58%</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Correlation</div>
                          <div className="metric-value text-lg font-semibold">0.15</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Stress Test 99.9%</div>
                          <div className="metric-value text-lg font-semibold">8.2%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Transaction Structure */}
            <section className="transaction-structure py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Transaction Structure</h2>
                <div className="structure-content">
                  <div className="structure-diagram bg-white p-8 rounded-lg shadow-md mb-12">
                    <h3 className="text-2xl font-semibold mb-6 text-center">Synthetic SRT Structure</h3>
                    <div className="diagram-container">
                      <div className="structure-flow grid lg:grid-cols-3 gap-8 items-center">
                        <div className="originator-box p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <div className="text-center">
                            <i className="fas fa-university text-3xl text-blue-600 mb-3"></i>
                            <h4 className="font-semibold text-lg mb-2">Originating Bank</h4>
                            <div className="text-sm text-gray-600">
                              <div>€1.2B Reference Portfolio</div>
                              <div>Retains legal ownership</div>
                              <div>Pays protection premium</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flow-arrow text-center">
                          <i className="fas fa-exchange-alt text-2xl text-gray-400"></i>
                          <div className="text-sm text-gray-600 mt-2">Credit Default Swap</div>
                        </div>
                        
                        <div className="protection-seller-box p-6 bg-green-50 rounded-lg border-2 border-green-200">
                          <div className="text-center">
                            <i className="fas fa-shield-alt text-3xl text-green-600 mb-3"></i>
                            <h4 className="font-semibold text-lg mb-2">Protection Seller</h4>
                            <div className="text-sm text-gray-600">
                              <div>Provides credit protection</div>
                              <div>Receives premium payments</div>
                              <div>Bears credit risk</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="tranches-structure grid lg:grid-cols-2 gap-12">
                    <div className="tranches-info">
                      <h3 className="text-2xl font-semibold mb-6">Tranche Structure</h3>
                      <div className="tranches-list space-y-4">
                        <div className="tranche-item bg-white p-4 rounded-lg shadow-md">
                          <div className="tranche-header flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-green-600">Senior Tranche</h4>
                            <span className="text-lg font-bold">AAA</span>
                          </div>
                          <div className="tranche-details grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Size:</span>
                              <span className="ml-2 font-medium">€960M (80%)</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Attachment:</span>
                              <span className="ml-2 font-medium">20% - 100%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Spread:</span>
                              <span className="ml-2 font-medium">45 bps</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Protection:</span>
                              <span className="ml-2 font-medium">€768M</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="tranche-item bg-white p-4 rounded-lg shadow-md">
                          <div className="tranche-header flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-blue-600">Mezzanine Tranche</h4>
                            <span className="text-lg font-bold">AA</span>
                          </div>
                          <div className="tranche-details grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Size:</span>
                              <span className="ml-2 font-medium">€180M (15%)</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Attachment:</span>
                              <span className="ml-2 font-medium">5% - 20%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Spread:</span>
                              <span className="ml-2 font-medium">125 bps</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Protection:</span>
                              <span className="ml-2 font-medium">€144M</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="tranche-item bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
                          <div className="tranche-header flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-red-600">First Loss (Retained)</h4>
                            <span className="text-lg font-bold">Unrated</span>
                          </div>
                          <div className="tranche-details grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Size:</span>
                              <span className="ml-2 font-medium">€60M (5%)</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Attachment:</span>
                              <span className="ml-2 font-medium">0% - 5%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <span className="ml-2 font-medium">Bank Retained</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Protection:</span>
                              <span className="ml-2 font-medium">None</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="structure-benefits">
                      <h3 className="text-2xl font-semibold mb-6">Structure Benefits</h3>
                      <div className="benefits-list space-y-4">
                        <div className="benefit-item bg-white p-4 rounded-lg shadow-md">
                          <div className="benefit-header flex items-center mb-2">
                            <i className="fas fa-chart-line text-green-500 mr-3"></i>
                            <h4 className="font-semibold">Capital Efficiency</h4>
                          </div>
                          <p className="text-sm text-gray-600">78% RWA reduction on protected portion, improving capital ratios and ROE by 15.2%</p>
                        </div>
                        
                        <div className="benefit-item bg-white p-4 rounded-lg shadow-md">
                          <div className="benefit-header flex items-center mb-2">
                            <i className="fas fa-balance-scale text-blue-500 mr-3"></i>
                            <h4 className="font-semibold">Regulatory Compliance</h4>
                          </div>
                          <p className="text-sm text-gray-600">Full compliance with Basel III SRT requirements and national implementations</p>
                        </div>
                        
                        <div className="benefit-item bg-white p-4 rounded-lg shadow-md">
                          <div className="benefit-header flex items-center mb-2">
                            <i className="fas fa-coins text-purple-500 mr-3"></i>
                            <h4 className="font-semibold">Cost Optimization</h4>
                          </div>
                          <p className="text-sm text-gray-600">Net capital savings of €25M annually after protection premium costs</p>
                        </div>
                        
                        <div className="benefit-item bg-white p-4 rounded-lg shadow-md">
                          <div className="benefit-header flex items-center mb-2">
                            <i className="fas fa-expand-arrows-alt text-orange-500 mr-3"></i>
                            <h4 className="font-semibold">Balance Sheet Flexibility</h4>
                          </div>
                          <p className="text-sm text-gray-600">Freed capital available for new lending and business growth initiatives</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Financial Modeling */}
            <section className="financial-modeling py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Financial Modeling</h2>
                <div className="modeling-content">
                  <div className="tabs-container bg-white rounded-lg shadow-md p-6">
                    <div className="tab-navigation flex space-x-4 border-b mb-6">
                      <button className="tab-button py-2 px-4 font-medium border-b-2 border-blue-500 text-blue-600">Capital Impact</button>
                      <button className="tab-button py-2 px-4 font-medium text-gray-500 hover:text-gray-700">Pricing</button>
                      <button className="tab-button py-2 px-4 font-medium text-gray-500 hover:text-gray-700">Economics</button>
                      <button className="tab-button py-2 px-4 font-medium text-gray-500 hover:text-gray-700">Sensitivity</button>
                    </div>
                    
                    <div className="tab-content">
                      <div className="capital-impact-tab">
                        <div className="grid lg:grid-cols-2 gap-8">
                          <div className="before-after">
                            <h4 className="text-xl font-semibold mb-4">Before vs After SRT</h4>
                            <div className="comparison-table">
                              <div className="table-header grid grid-cols-3 gap-4 py-2 border-b font-semibold text-sm">
                                <div>Metric</div>
                                <div>Before</div>
                                <div>After</div>
                              </div>
                              <div className="table-row grid grid-cols-3 gap-4 py-3 border-b">
                                <div>RWA (€M)</div>
                                <div>400</div>
                                <div className="text-green-600 font-semibold">88</div>
                              </div>
                              <div className="table-row grid grid-cols-3 gap-4 py-3 border-b">
                                <div>Capital Required (€M)</div>
                                <div>32</div>
                                <div className="text-green-600 font-semibold">7</div>
                              </div>
                              <div className="table-row grid grid-cols-3 gap-4 py-3 border-b">
                                <div>ROE Impact</div>
                                <div>12.5%</div>
                                <div className="text-green-600 font-semibold">14.4%</div>
                              </div>
                              <div className="table-row grid grid-cols-3 gap-4 py-3 border-b">
                                <div>CET1 Ratio Impact</div>
                                <div>-</div>
                                <div className="text-green-600 font-semibold">+55 bps</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="capital-metrics">
                            <h4 className="text-xl font-semibold mb-4">Capital Metrics</h4>
                            <div className="metrics-cards space-y-4">
                              <div className="metric-card bg-blue-50 p-4 rounded-lg">
                                <div className="metric-label text-sm text-gray-600">Capital Relief</div>
                                <div className="metric-value text-2xl font-bold text-blue-600">€25M</div>
                                <div className="metric-desc text-xs text-gray-500">Annual savings</div>
                              </div>
                              <div className="metric-card bg-green-50 p-4 rounded-lg">
                                <div className="metric-label text-sm text-gray-600">RWA Reduction</div>
                                <div className="metric-value text-2xl font-bold text-green-600">78%</div>
                                <div className="metric-desc text-xs text-gray-500">On protected portion</div>
                              </div>
                              <div className="metric-card bg-purple-50 p-4 rounded-lg">
                                <div className="metric-label text-sm text-gray-600">ROE Improvement</div>
                                <div className="metric-value text-2xl font-bold text-purple-600">1.9%</div>
                                <div className="metric-desc text-xs text-gray-500">Percentage points</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Execution Process */}
            <section className="execution-process py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Execution Process</h2>
                <div className="process-timeline">
                  <div className="timeline-container">
                    <div className="timeline-steps grid md:grid-cols-3 gap-8">
                      <div className="step-card bg-white p-6 rounded-lg shadow-md">
                        <div className="step-number w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">1</div>
                        <h3 className="text-xl font-semibold mb-3">Preparation Phase</h3>
                        <div className="step-duration text-sm text-gray-500 mb-3">Duration: 4 weeks</div>
                        <ul className="step-tasks space-y-2 text-sm">
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Portfolio data collection and validation</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Risk analysis and modeling</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Structure optimization</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Regulatory pre-clearance</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="step-card bg-white p-6 rounded-lg shadow-md">
                        <div className="step-number w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">2</div>
                        <h3 className="text-xl font-semibold mb-3">Documentation</h3>
                        <div className="step-duration text-sm text-gray-500 mb-3">Duration: 6 weeks</div>
                        <ul className="step-tasks space-y-2 text-sm">
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Legal documentation preparation</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Rating agency engagement</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Regulatory submission</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Investor presentation</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="step-card bg-white p-6 rounded-lg shadow-md">
                        <div className="step-number w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">3</div>
                        <h3 className="text-xl font-semibold mb-3">Market Execution</h3>
                        <div className="step-duration text-sm text-gray-500 mb-3">Duration: 2 weeks</div>
                        <ul className="step-tasks space-y-2 text-sm">
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Investor roadshow</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Price discovery and allocation</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Final documentation</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-green-500 mt-1 mr-2 text-xs"></i>
                            <span>Transaction closing</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="execution-highlights mt-12">
                    <h3 className="text-2xl font-semibold mb-6 text-center">Execution Highlights</h3>
                    <div className="highlights-grid grid md:grid-cols-2 gap-8">
                      <div className="highlight-card bg-white p-6 rounded-lg shadow-md">
                        <h4 className="font-semibold mb-4">Market Reception</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Strong investor demand with 2.5x oversubscription</li>
                          <li>• AAA rating achieved on senior tranche</li>
                          <li>• Pricing tightened by 15bps during execution</li>
                          <li>• Diverse investor base across 12 countries</li>
                        </ul>
                      </div>
                      
                      <div className="highlight-card bg-white p-6 rounded-lg shadow-md">
                        <h4 className="font-semibold mb-4">Regulatory Outcome</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Full regulatory approval received</li>
                          <li>• 78% capital relief recognized</li>
                          <li>• Compliant with all jurisdictional requirements</li>
                          <li>• Template established for future transactions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Results and Impact */}
            <section className="results-impact py-16">
              <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold text-center mb-12">Results & Impact</h2>
                <div className="results-content">
                  <div className="comprehensive-results grid lg:grid-cols-3 gap-8 mb-12">
                    <div className="results-card bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                      <h3 className="text-xl font-semibold mb-4 text-green-600">Financial Impact</h3>
                      <div className="results-metrics space-y-3">
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">Annual Capital Savings</div>
                          <div className="metric-value text-2xl font-bold">€25M</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">ROE Improvement</div>
                          <div className="metric-value text-2xl font-bold">+1.9%</div>
                        </div>
                        <div className="metric-item">
                          <div className="metric-label text-sm text-gray-600">CET1 Ratio Boost</div>
                          <div className="metric-value text-2xl font-bold">+55bps</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="results-card bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                      <h3 className="text-xl font-semibold mb-4 text-blue-600">Operational Benefits</h3>
                      <div className="benefits-list space-y-3 text-sm">
                        <div className="benefit-item flex items-start">
                          <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                          <span>Freed €312M in regulatory capital</span>
                        </div>
                        <div className="benefit-item flex items-start">
                          <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                          <span>Enhanced lending capacity by €2.5B</span>
                        </div>
                        <div className="benefit-item flex items-start">
                          <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                          <span>Diversified funding sources</span>
                        </div>
                        <div className="benefit-item flex items-start">
                          <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                          <span>Improved risk management capabilities</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="results-card bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                      <h3 className="text-xl font-semibold mb-4 text-purple-600">Strategic Outcomes</h3>
                      <div className="outcomes-list space-y-3 text-sm">
                        <div className="outcome-item flex items-start">
                          <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
                          <span>Established SRT program framework</span>
                        </div>
                        <div className="outcome-item flex items-start">
                          <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
                          <span>Strengthened investor relationships</span>
                        </div>
                        <div className="outcome-item flex items-start">
                          <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
                          <span>Enhanced market reputation</span>
                        </div>
                        <div className="outcome-item flex items-start">
                          <i className="fas fa-star text-yellow-500 mt-1 mr-2"></i>
                          <span>Regulatory template for future deals</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="performance-monitoring">
                    <h3 className="text-2xl font-semibold mb-6 text-center">Ongoing Performance Monitoring</h3>
                    <div className="monitoring-content bg-white p-8 rounded-lg shadow-md">
                      <div className="grid lg:grid-cols-2 gap-8">
                        <div className="monitoring-metrics">
                          <h4 className="font-semibold mb-4">Key Performance Indicators</h4>
                          <div className="kpi-grid grid grid-cols-2 gap-4">
                            <div className="kpi-item bg-gray-50 p-3 rounded">
                              <div className="kpi-label text-xs text-gray-600">Portfolio Performance</div>
                              <div className="kpi-value text-lg font-semibold text-green-600">On Track</div>
                            </div>
                            <div className="kpi-item bg-gray-50 p-3 rounded">
                              <div className="kpi-label text-xs text-gray-600">Credit Losses (YTD)</div>
                              <div className="kpi-value text-lg font-semibold">0.6%</div>
                            </div>
                            <div className="kpi-item bg-gray-50 p-3 rounded">
                              <div className="kpi-label text-xs text-gray-600">Capital Relief</div>
                              <div className="kpi-value text-lg font-semibold text-blue-600">Maintained</div>
                            </div>
                            <div className="kpi-item bg-gray-50 p-3 rounded">
                              <div className="kpi-label text-xs text-gray-600">Compliance Status</div>
                              <div className="kpi-value text-lg font-semibold text-green-600">Full</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="lessons-learned">
                          <h4 className="font-semibold mb-4">Lessons Learned</h4>
                          <ul className="lessons-list space-y-2 text-sm">
                            <li className="flex items-start">
                              <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                              <span>Early regulatory engagement crucial for smooth approval</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                              <span>Investor education drives better execution terms</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                              <span>Portfolio granularity key to rating agency comfort</span>
                            </li>
                            <li className="flex items-start">
                              <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2"></i>
                              <span>Ongoing monitoring systems essential for success</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default WorkedExample;
