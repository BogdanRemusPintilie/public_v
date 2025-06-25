
import { useEffect } from 'react';

const WorkedExample = () => {
  useEffect(() => {
    // Initialize any interactive elements after component mounts
    const initializeExample = () => {
      // Tab navigation functionality
      const tabBtns = document.querySelectorAll('.tab-btn');
      const tabContents = document.querySelectorAll('.tab-content');
      
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetTab = btn.getAttribute('data-tab');
          
          // Remove active class from all tabs and contents
          tabBtns.forEach(b => b.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          
          // Add active class to clicked tab and corresponding content
          btn.classList.add('active');
          document.getElementById(targetTab)?.classList.add('active');
        });
      });

      // Step navigation functionality
      const navSteps = document.querySelectorAll('.nav-step');
      navSteps.forEach(step => {
        step.addEventListener('click', (e) => {
          e.preventDefault();
          const targetSection = step.getAttribute('href');
          if (targetSection) {
            document.querySelector(targetSection)?.scrollIntoView({ behavior: 'smooth' });
          }
          
          navSteps.forEach(s => s.classList.remove('active'));
          step.classList.add('active');
        });
      });
    };

    const timer = setTimeout(initializeExample, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="worked-example-container">
      {/* Hero Section */}
      <section className="example-hero">
        <div className="container">
          <div className="hero-content">
            <h1>SRT Transaction: A Complete Walkthrough</h1>
            <p>Follow a real-world Significant Risk Transfer transaction from initial assessment through execution and ongoing management.</p>
            
            <div className="example-nav">
              <a href="#overview" className="nav-step active" data-step="overview">
                <i className="fas fa-eye"></i>
                <span>Overview</span>
              </a>
              <a href="#portfolio" className="nav-step" data-step="portfolio">
                <i className="fas fa-briefcase"></i>
                <span>Portfolio Analysis</span>
              </a>
              <a href="#structure" className="nav-step" data-step="structure">
                <i className="fas fa-sitemap"></i>
                <span>Transaction Structure</span>
              </a>
              <a href="#modeling" className="nav-step" data-step="modeling">
                <i className="fas fa-calculator"></i>
                <span>Financial Modeling</span>
              </a>
              <a href="#execution" className="nav-step" data-step="execution">
                <i className="fas fa-handshake"></i>
                <span>Execution</span>
              </a>
              <a href="#results" className="nav-step" data-step="results">
                <i className="fas fa-chart-bar"></i>
                <span>Results</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Overview */}
      <section className="example-section" id="overview">
        <div className="container">
          <div className="section-header">
            <h2>Transaction Overview</h2>
            <p>European Bank's €2.5B Corporate Loan Portfolio SRT</p>
          </div>
          
          <div className="overview-grid">
            <div className="overview-card">
              <div className="card-header">
                <i className="fas fa-building"></i>
                <h3>Bank Profile</h3>
              </div>
              <div className="card-content">
                <div className="detail-item">
                  <span className="label">Institution:</span>
                  <span className="value">European Commercial Bank</span>
                </div>
                <div className="detail-item">
                  <span className="label">Total Assets:</span>
                  <span className="value">€45 billion</span>
                </div>
                <div className="detail-item">
                  <span className="label">CET1 Ratio:</span>
                  <span className="value">12.8%</span>
                </div>
                <div className="detail-item">
                  <span className="label">Target CET1:</span>
                  <span className="value">14.0%</span>
                </div>
              </div>
            </div>
            
            <div className="overview-card">
              <div className="card-header">
                <i className="fas fa-target"></i>
                <h3>Transaction Objectives</h3>
              </div>
              <div className="card-content">
                <ul className="objectives-list">
                  <li>Reduce RWA by €1.8B to improve capital ratios</li>
                  <li>Free up capital for new lending opportunities</li>
                  <li>Maintain client relationships and servicing</li>
                  <li>Achieve regulatory capital relief under Basel III</li>
                  <li>Optimize balance sheet efficiency</li>
                </ul>
              </div>
            </div>
            
            <div className="overview-card">
              <div className="card-header">
                <i className="fas fa-clock"></i>
                <h3>Timeline</h3>
              </div>
              <div className="card-content">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-date">Month 1-2</div>
                    <div className="timeline-desc">Portfolio analysis and structure design</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">Month 3-4</div>
                    <div className="timeline-desc">Regulatory approval and documentation</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">Month 5</div>
                    <div className="timeline-desc">Investor marketing and execution</div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-date">Month 6+</div>
                    <div className="timeline-desc">Ongoing monitoring and reporting</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="key-metrics">
            <h3>Key Transaction Metrics</h3>
            <div className="metrics-grid">
              <div className="metric-item">
                <div className="metric-icon">
                  <i className="fas fa-euro-sign"></i>
                </div>
                <div className="metric-content">
                  <div className="metric-value">€2.5B</div>
                  <div className="metric-label">Portfolio Notional</div>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="metric-content">
                  <div className="metric-value">72%</div>
                  <div className="metric-label">Risk Transfer</div>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="metric-content">
                  <div className="metric-value">€1.8B</div>
                  <div className="metric-label">RWA Reduction</div>
                </div>
              </div>
              <div className="metric-item">
                <div className="metric-icon">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="metric-content">
                  <div className="metric-value">5 Years</div>
                  <div className="metric-label">Transaction Term</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Analysis */}
      <section className="example-section" id="portfolio">
        <div className="container">
          <div className="section-header">
            <h2>Portfolio Analysis</h2>
            <p>Comprehensive assessment of the reference portfolio characteristics and risk profile</p>
          </div>
          
          <div className="analysis-grid">
            <div className="analysis-card">
              <h3>Portfolio Composition</h3>
              <div className="chart-container">
                <canvas id="portfolioChart" width="400" height="300"></canvas>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-color" style={{background: '#667eea'}}></span>
                  <span>Large Corporate (45%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{background: '#764ba2'}}></span>
                  <span>Mid-Market (35%)</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{background: '#f093fb'}}></span>
                  <span>SME (20%)</span>
                </div>
              </div>
            </div>
            
            <div className="analysis-card">
              <h3>Geographic Distribution</h3>
              <div className="geographic-breakdown">
                <div className="geo-item">
                  <div className="geo-header">
                    <span className="country">Germany</span>
                    <span className="percentage">28%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '28%'}}></div>
                  </div>
                </div>
                <div className="geo-item">
                  <div className="geo-header">
                    <span className="country">France</span>
                    <span className="percentage">22%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '22%'}}></div>
                  </div>
                </div>
                <div className="geo-item">
                  <div className="geo-header">
                    <span className="country">Netherlands</span>
                    <span className="percentage">18%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '18%'}}></div>
                  </div>
                </div>
                <div className="geo-item">
                  <div className="geo-header">
                    <span className="country">Italy</span>
                    <span className="percentage">15%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '15%'}}></div>
                  </div>
                </div>
                <div className="geo-item">
                  <div className="geo-header">
                    <span className="country">Other EU</span>
                    <span className="percentage">17%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '17%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="analysis-card">
              <h3>Credit Quality</h3>
              <div className="rating-distribution">
                <div className="rating-item">
                  <span className="rating">AAA-AA</span>
                  <span className="amount">€125M</span>
                  <span className="percent">5%</span>
                </div>
                <div className="rating-item">
                  <span className="rating">A</span>
                  <span className="amount">€625M</span>
                  <span className="percent">25%</span>
                </div>
                <div className="rating-item">
                  <span className="rating">BBB</span>
                  <span className="amount">€1,125M</span>
                  <span className="percent">45%</span>
                </div>
                <div className="rating-item">
                  <span className="rating">BB</span>
                  <span className="amount">€500M</span>
                  <span className="percent">20%</span>
                </div>
                <div className="rating-item">
                  <span className="rating">B and below</span>
                  <span className="amount">€125M</span>
                  <span className="percent">5%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="risk-metrics">
            <h3>Risk Metrics</h3>
            <div className="risk-grid">
              <div className="risk-item">
                <div className="risk-label">Weighted Average PD</div>
                <div className="risk-value">1.85%</div>
              </div>
              <div className="risk-item">
                <div className="risk-label">Weighted Average LGD</div>
                <div className="risk-value">42%</div>
              </div>
              <div className="risk-item">
                <div className="risk-label">Expected Loss</div>
                <div className="risk-value">€19.4M</div>
              </div>
              <div className="risk-item">
                <div className="risk-label">99.9% VaR</div>
                <div className="risk-value">€285M</div>
              </div>
              <div className="risk-item">
                <div className="risk-label">Risk Weight</div>
                <div className="risk-value">72%</div>
              </div>
              <div className="risk-item">
                <div className="risk-label">Current RWA</div>
                <div className="risk-value">€1.8B</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Transaction Structure */}
      <section className="example-section" id="structure">
        <div className="container">
          <div className="section-header">
            <h2>Transaction Structure</h2>
            <p>Synthetic SRT structure with credit-linked notes providing optimal capital relief</p>
          </div>
          
          <div className="structure-diagram">
            <div className="structure-visual">
              <div className="entity bank">
                <i className="fas fa-university"></i>
                <h4>European Bank</h4>
                <p>Originator & Protection Buyer</p>
              </div>
              
              <div className="flow-arrow">
                <span>Credit Protection Premium</span>
                <i className="fas fa-arrow-right"></i>
              </div>
              
              <div className="entity spv">
                <i className="fas fa-building"></i>
                <h4>SPV</h4>
                <p>Issuer of Credit-Linked Notes</p>
              </div>
              
              <div className="flow-arrow">
                <span>Note Proceeds</span>
                <i className="fas fa-arrow-right"></i>
              </div>
              
              <div className="entity investors">
                <i className="fas fa-users"></i>
                <h4>Institutional Investors</h4>
                <p>Protection Providers</p>
              </div>
              
              <div className="reference-portfolio">
                <i className="fas fa-briefcase"></i>
                <h4>Reference Portfolio</h4>
                <p>€2.5B Corporate Loans</p>
              </div>
            </div>
          </div>
          
          <div className="tranche-structure">
            <h3>Tranche Structure</h3>
            <div className="tranches">
              <div className="tranche senior">
                <div className="tranche-header">
                  <h4>Senior Tranche</h4>
                  <span className="tranche-rating">AAA</span>
                </div>
                <div className="tranche-details">
                  <div className="detail">
                    <span className="label">Attachment Point:</span>
                    <span className="value">8.5%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Detachment Point:</span>
                    <span className="value">100%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Notional:</span>
                    <span className="value">€2.29B</span>
                  </div>
                  <div className="detail">
                    <span className="label">Spread:</span>
                    <span className="value">65 bps</span>
                  </div>
                </div>
              </div>
              
              <div className="tranche mezzanine">
                <div className="tranche-header">
                  <h4>Mezzanine Tranche</h4>
                  <span className="tranche-rating">A</span>
                </div>
                <div className="tranche-details">
                  <div className="detail">
                    <span className="label">Attachment Point:</span>
                    <span className="value">3.5%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Detachment Point:</span>
                    <span className="value">8.5%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Notional:</span>
                    <span className="value">€125M</span>
                  </div>
                  <div className="detail">
                    <span className="label">Spread:</span>
                    <span className="value">285 bps</span>
                  </div>
                </div>
              </div>
              
              <div className="tranche junior">
                <div className="tranche-header">
                  <h4>First Loss Piece</h4>
                  <span className="tranche-rating">Unrated</span>
                </div>
                <div className="tranche-details">
                  <div className="detail">
                    <span className="label">Attachment Point:</span>
                    <span className="value">0%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Detachment Point:</span>
                    <span className="value">3.5%</span>
                  </div>
                  <div className="detail">
                    <span className="label">Notional:</span>
                    <span className="value">€87.5M</span>
                  </div>
                  <div className="detail">
                    <span className="label">Status:</span>
                    <span className="value">Retained by Bank</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="structure-benefits">
            <h3>Structure Benefits</h3>
            <div className="benefits-grid">
              <div className="benefit-card">
                <i className="fas fa-shield-alt"></i>
                <h4>Risk Transfer</h4>
                <p>72% of credit risk transferred to investors through senior and mezzanine tranches</p>
              </div>
              <div className="benefit-card">
                <i className="fas fa-chart-line"></i>
                <h4>Capital Relief</h4>
                <p>€1.8B RWA reduction achieving significant capital ratio improvement</p>
              </div>
              <div className="benefit-card">
                <i className="fas fa-handshake"></i>
                <h4>Client Relationships</h4>
                <p>Bank retains all client relationships and continues loan servicing</p>
              </div>
              <div className="benefit-card">
                <i className="fas fa-balance-scale"></i>
                <h4>Regulatory Compliance</h4>
                <p>Structure meets all Basel III requirements for significant risk transfer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial Modeling */}
      <section className="example-section" id="modeling">
        <div className="container">
          <div className="section-header">
            <h2>Financial Modeling</h2>
            <p>Detailed analysis of capital impact, pricing, and economic benefits</p>
          </div>
          
          <div className="modeling-tabs">
            <div className="tab-nav">
              <button className="tab-btn active" data-tab="capital">Capital Impact</button>
              <button className="tab-btn" data-tab="pricing">Pricing Analysis</button>
              <button className="tab-btn" data-tab="economics">Economics</button>
              <button className="tab-btn" data-tab="sensitivity">Sensitivity</button>
            </div>
            
            <div className="tab-content active" id="capital">
              <div className="capital-analysis">
                <div className="before-after">
                  <div className="scenario">
                    <h4>Before SRT</h4>
                    <div className="capital-metrics">
                      <div className="metric">
                        <span className="label">Total RWA:</span>
                        <span className="value">€32.5B</span>
                      </div>
                      <div className="metric">
                        <span className="label">CET1 Capital:</span>
                        <span className="value">€4.16B</span>
                      </div>
                      <div className="metric">
                        <span className="label">CET1 Ratio:</span>
                        <span className="value">12.8%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Excess Capital:</span>
                        <span className="value">€0.85B</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                  
                  <div className="scenario">
                    <h4>After SRT</h4>
                    <div className="capital-metrics">
                      <div className="metric">
                        <span className="label">Total RWA:</span>
                        <span className="value">€30.7B</span>
                      </div>
                      <div className="metric">
                        <span className="label">CET1 Capital:</span>
                        <span className="value">€4.16B</span>
                      </div>
                      <div className="metric">
                        <span className="label">CET1 Ratio:</span>
                        <span className="value">13.5%</span>
                      </div>
                      <div className="metric">
                        <span className="label">Excess Capital:</span>
                        <span className="value">€1.08B</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="impact-summary">
                  <h4>Capital Impact Summary</h4>
                  <div className="impact-grid">
                    <div className="impact-item positive">
                      <span className="label">RWA Reduction:</span>
                      <span className="value">€1.8B</span>
                    </div>
                    <div className="impact-item positive">
                      <span className="label">CET1 Ratio Improvement:</span>
                      <span className="value">+70 bps</span>
                    </div>
                    <div className="impact-item positive">
                      <span className="label">Additional Lending Capacity:</span>
                      <span className="value">€1.5B</span>
                    </div>
                    <div className="impact-item positive">
                      <span className="label">Capital Efficiency Gain:</span>
                      <span className="value">€230M</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="tab-content" id="pricing">
              <div className="pricing-analysis">
                <div className="pricing-table">
                  <h4>Tranche Pricing Breakdown</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>Tranche</th>
                        <th>Notional</th>
                        <th>Spread (bps)</th>
                        <th>Annual Premium</th>
                        <th>Expected Loss</th>
                        <th>Risk Premium</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Senior</td>
                        <td>€2.29B</td>
                        <td>65</td>
                        <td>€14.9M</td>
                        <td>€2.1M</td>
                        <td>€12.8M</td>
                      </tr>
                      <tr>
                        <td>Mezzanine</td>
                        <td>€125M</td>
                        <td>285</td>
                        <td>€3.6M</td>
                        <td>€1.8M</td>
                        <td>€1.8M</td>
                      </tr>
                      <tr className="total">
                        <td><strong>Total</strong></td>
                        <td><strong>€2.415B</strong></td>
                        <td><strong>76</strong></td>
                        <td><strong>€18.5M</strong></td>
                        <td><strong>€3.9M</strong></td>
                        <td><strong>€14.6M</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="tab-content" id="economics">
              <div className="economics-analysis">
                <div className="cost-benefit">
                  <h4>5-Year Economic Analysis</h4>
                  <div className="economics-grid">
                    <div className="economics-item cost">
                      <h5>Costs</h5>
                      <div className="cost-breakdown">
                        <div className="cost-item">
                          <span className="label">Protection Premiums:</span>
                          <span className="value">€92.5M</span>
                        </div>
                        <div className="cost-item">
                          <span className="label">Transaction Costs:</span>
                          <span className="value">€8.2M</span>
                        </div>
                        <div className="cost-item">
                          <span className="label">Ongoing Costs:</span>
                          <span className="value">€3.5M</span>
                        </div>
                        <div className="cost-item total">
                          <span className="label">Total Costs:</span>
                          <span className="value">€104.2M</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="economics-item benefit">
                      <h5>Benefits</h5>
                      <div className="benefit-breakdown">
                        <div className="benefit-item">
                          <span className="label">Capital Savings:</span>
                          <span className="value">€115.0M</span>
                        </div>
                        <div className="benefit-item">
                          <span className="label">Funding Cost Reduction:</span>
                          <span className="value">€28.5M</span>
                        </div>
                        <div className="benefit-item">
                          <span className="label">New Business ROE:</span>
                          <span className="value">€45.2M</span>
                        </div>
                        <div className="benefit-item total">
                          <span className="label">Total Benefits:</span>
                          <span className="value">€188.7M</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="net-benefit">
                    <h4>Net Economic Benefit</h4>
                    <div className="net-value">€84.5M</div>
                    <div className="net-description">Over 5-year transaction term</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="tab-content" id="sensitivity">
              <div className="sensitivity-analysis">
                <h4>Sensitivity Analysis</h4>
                <div className="sensitivity-chart">
                  <canvas id="sensitivityChart" width="600" height="400"></canvas>
                </div>
                
                <div className="scenario-analysis">
                  <h4>Scenario Analysis</h4>
                  <table className="scenario-table">
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Default Rate</th>
                        <th>Recovery Rate</th>
                        <th>Net Benefit</th>
                        <th>IRR</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="base">
                        <td>Base Case</td>
                        <td>1.85%</td>
                        <td>58%</td>
                        <td>€84.5M</td>
                        <td>18.2%</td>
                      </tr>
                      <tr className="stress">
                        <td>Stress Case</td>
                        <td>3.50%</td>
                        <td>45%</td>
                        <td>€52.1M</td>
                        <td>12.8%</td>
                      </tr>
                      <tr className="severe">
                        <td>Severe Stress</td>
                        <td>5.25%</td>
                        <td>35%</td>
                        <td>€18.7M</td>
                        <td>6.4%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Execution Process */}
      <section className="example-section" id="execution">
        <div className="container">
          <div className="section-header">
            <h2>Execution Process</h2>
            <p>Step-by-step walkthrough of the transaction execution</p>
          </div>
          
          <div className="execution-timeline">
            <div className="timeline-step completed">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Portfolio Selection & Analysis</h4>
                <p>Identified €2.5B corporate loan portfolio meeting SRT criteria. Conducted comprehensive risk analysis and regulatory assessment.</p>
                <div className="step-details">
                  <span className="duration">Duration: 6 weeks</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <div className="timeline-step completed">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Structure Design</h4>
                <p>Designed optimal tranche structure with 72% risk transfer. Obtained preliminary regulatory feedback on structure.</p>
                <div className="step-details">
                  <span className="duration">Duration: 4 weeks</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <div className="timeline-step completed">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Documentation</h4>
                <p>Prepared comprehensive transaction documentation including credit-linked note terms, portfolio data, and legal agreements.</p>
                <div className="step-details">
                  <span className="duration">Duration: 8 weeks</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <div className="timeline-step completed">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Regulatory Approval</h4>
                <p>Obtained formal regulatory approval for significant risk transfer treatment under Basel III framework.</p>
                <div className="step-details">
                  <span className="duration">Duration: 6 weeks</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <div className="timeline-step completed">
              <div className="step-number">5</div>
              <div className="step-content">
                <h4>Investor Marketing</h4>
                <p>Conducted targeted marketing to institutional investors. Achieved 3.2x oversubscription with strong investor interest.</p>
                <div className="step-details">
                  <span className="duration">Duration: 3 weeks</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <div className="timeline-step completed">
              <div className="step-number">6</div>
              <div className="step-content">
                <h4>Transaction Closing</h4>
                <p>Successfully closed transaction with all tranches fully placed. Achieved target pricing and structure terms.</p>
                <div className="step-details">
                  <span className="duration">Duration: 1 week</span>
                  <span className="status">✓ Completed</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="execution-highlights">
            <h3>Execution Highlights</h3>
            <div className="highlights-grid">
              <div className="highlight">
                <i className="fas fa-clock"></i>
                <h4>Timeline</h4>
                <p>Completed in 6 months from initiation to closing, meeting all target milestones.</p>
              </div>
              <div className="highlight">
                <i className="fas fa-users"></i>
                <h4>Investor Response</h4>
                <p>Strong institutional investor interest with 3.2x oversubscription across all tranches.</p>
              </div>
              <div className="highlight">
                <i className="fas fa-check-circle"></i>
                <h4>Regulatory</h4>
                <p>Full regulatory approval obtained with confirmation of significant risk transfer treatment.</p>
              </div>
              <div className="highlight">
                <i className="fas fa-target"></i>
                <h4>Pricing</h4>
                <p>Achieved target pricing with spreads at the tight end of initial guidance ranges.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results & Impact */}
      <section className="example-section" id="results">
        <div className="container">
          <div className="section-header">
            <h2>Results & Impact</h2>
            <p>Comprehensive analysis of transaction outcomes and ongoing performance</p>
          </div>
          
          <div className="results-dashboard">
            <div className="results-grid">
              <div className="result-card primary">
                <div className="card-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="card-content">
                  <h3>Capital Ratio Improvement</h3>
                  <div className="result-value">+70 bps</div>
                  <div className="result-description">CET1 ratio increased from 12.8% to 13.5%</div>
                </div>
              </div>
              
              <div className="result-card">
                <div className="card-icon">
                  <i className="fas fa-weight"></i>
                </div>
                <div className="card-content">
                  <h3>RWA Reduction</h3>
                  <div className="result-value">€1.8B</div>
                  <div className="result-description">5.5% reduction in total RWA</div>
                </div>
              </div>
              
              <div className="result-card">
                <div className="card-icon">
                  <i className="fas fa-euro-sign"></i>
                </div>
                <div className="card-content">
                  <h3>Economic Benefit</h3>
                  <div className="result-value">€84.5M</div>
                  <div className="result-description">Net present value over 5 years</div>
                </div>
              </div>
              
              <div className="result-card">
                <div className="card-icon">
                  <i className="fas fa-percentage"></i>
                </div>
                <div className="card-content">
                  <h3>ROE Impact</h3>
                  <div className="result-value">+180 bps</div>
                  <div className="result-description">Return on equity improvement</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="performance-tracking">
            <h3>Ongoing Performance Monitoring</h3>
            <div className="monitoring-grid">
              <div className="monitoring-card">
                <h4>Portfolio Performance</h4>
                <div className="performance-metrics">
                  <div className="metric-row">
                    <span className="label">Current Default Rate:</span>
                    <span className="value">1.2%</span>
                    <span className="trend positive">↓ vs. Expected</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Recovery Rate:</span>
                    <span className="value">62%</span>
                    <span className="trend positive">↑ vs. Expected</span>
                  </div>
                  <div className="metric-row">
                    <span className="label">Portfolio Balance:</span>
                    <span className="value">€2.48B</span>
                    <span className="trend neutral">Stable</span>
                  </div>
                </div>
              </div>
              
              <div className="monitoring-card">
                <h4>Regulatory Compliance</h4>
                <div className="compliance-status">
                  <div className="compliance-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Basel III SRT Requirements</span>
                  </div>
                  <div className="compliance-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Capital Relief Recognition</span>
                  </div>
                  <div className="compliance-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Ongoing Reporting</span>
                  </div>
                  <div className="compliance-item">
                    <i className="fas fa-check-circle"></i>
                    <span>Risk Transfer Effectiveness</span>
                  </div>
                </div>
              </div>
              
              <div className="monitoring-card">
                <h4>Investor Relations</h4>
                <div className="investor-updates">
                  <div className="update-item">
                    <span className="date">Q1 2025</span>
                    <span className="description">Quarterly performance report distributed</span>
                  </div>
                  <div className="update-item">
                    <span className="date">Q4 2024</span>
                    <span className="description">Annual investor call conducted</span>
                  </div>
                  <div className="update-item">
                    <span className="date">Q3 2024</span>
                    <span className="description">Portfolio substitution completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lessons-learned">
            <h3>Key Lessons & Best Practices</h3>
            <div className="lessons-grid">
              <div className="lesson-card">
                <i className="fas fa-lightbulb"></i>
                <h4>Early Regulatory Engagement</h4>
                <p>Engaging regulators early in the process ensured smooth approval and avoided potential delays or structure modifications.</p>
              </div>
              <div className="lesson-card">
                <i className="fas fa-users"></i>
                <h4>Investor Education</h4>
                <p>Comprehensive investor education on the portfolio and structure led to strong demand and favorable pricing.</p>
              </div>
              <div className="lesson-card">
                <i className="fas fa-cogs"></i>
                <h4>Operational Readiness</h4>
                <p>Establishing robust operational processes for ongoing monitoring and reporting was crucial for success.</p>
              </div>
              <div className="lesson-card">
                <i className="fas fa-chart-bar"></i>
                <h4>Performance Tracking</h4>
                <p>Implementing comprehensive performance tracking systems enabled proactive portfolio management.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WorkedExample;
