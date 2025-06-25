// Demo App JavaScript - SRT Calculator

// Global state for the SRT calculator
let srtState = {
    portfolio: {
        size: 2500, // Million EUR
        avgPD: 1.85, // %
        avgLGD: 42, // %
        riskWeight: 72, // %
        currentCET1: 12.8 // %
    },
    structure: {
        firstLoss: 3.5, // %
        mezzanineSize: 5.0, // %
        seniorSpread: 65, // bps
        mezzanineSpread: 285 // bps
    },
    results: {
        riskTransfer: 0,
        rwaReduction: 0,
        cet1Improvement: 0,
        annualCost: 0,
        netBenefit: 0
    }
};

document.addEventListener("DOMContentLoaded", function() {
    initializeDemoApp();
    initializeDemoCharts();
    initializeDemoTabs();
    initializeSensitivityControls();
    initializeExportFunctions();
    
    // Initial calculation
    calculateSRT();
});

function initializeDemoApp() {
    // Load initial values into inputs
    loadInputValues();
    
    // Add event listeners to all inputs
    const inputs = document.querySelectorAll('.app-sidebar input');
    inputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
    });
    
    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', calculateSRT);
    
    // Auto-calculate on input change
    const autoCalculateInputs = document.querySelectorAll('.app-sidebar input');
    autoCalculateInputs.forEach(input => {
        input.addEventListener('change', () => {
            setTimeout(calculateSRT, 100); // Small delay for better UX
        });
    });
}

function loadInputValues() {
    document.getElementById('portfolioSize').value = srtState.portfolio.size;
    document.getElementById('avgPD').value = srtState.portfolio.avgPD;
    document.getElementById('avgLGD').value = srtState.portfolio.avgLGD;
    document.getElementById('riskWeight').value = srtState.portfolio.riskWeight;
    document.getElementById('currentCET1').value = srtState.portfolio.currentCET1;
    document.getElementById('firstLoss').value = srtState.structure.firstLoss;
    document.getElementById('mezzanineSize').value = srtState.structure.mezzanineSize;
    document.getElementById('seniorSpread').value = srtState.structure.seniorSpread;
    document.getElementById('mezzanineSpread').value = srtState.structure.mezzanineSpread;
}

function handleInputChange(event) {
    const input = event.target;
    const value = parseFloat(input.value);
    
    // Update state based on input ID
    switch(input.id) {
        case 'portfolioSize':
            srtState.portfolio.size = value;
            break;
        case 'avgPD':
            srtState.portfolio.avgPD = value;
            break;
        case 'avgLGD':
            srtState.portfolio.avgLGD = value;
            break;
        case 'riskWeight':
            srtState.portfolio.riskWeight = value;
            break;
        case 'currentCET1':
            srtState.portfolio.currentCET1 = value;
            break;
        case 'firstLoss':
            srtState.structure.firstLoss = value;
            break;
        case 'mezzanineSize':
            srtState.structure.mezzanineSize = value;
            break;
        case 'seniorSpread':
            srtState.structure.seniorSpread = value;
            break;
        case 'mezzanineSpread':
            srtState.structure.mezzanineSpread = value;
            break;
    }
}

function calculateSRT() {
    // Show loading state
    showLoading();
    
    // Simulate calculation delay for better UX
    setTimeout(() => {
        performSRTCalculation();
        updateAllDisplays();
        updateAllCharts();
        hideLoading();
    }, 500);
}

function performSRTCalculation() {
    const p = srtState.portfolio;
    const s = srtState.structure;
    
    // Calculate basic metrics
    const portfolioNotional = p.size; // Million EUR
    const currentRWA = portfolioNotional * (p.riskWeight / 100);
    
    // Calculate tranche sizes
    const firstLossSize = portfolioNotional * (s.firstLoss / 100);
    const mezzanineSize = portfolioNotional * (s.mezzanineSize / 100);
    const seniorSize = portfolioNotional - firstLossSize - mezzanineSize;
    
    // Calculate risk transfer
    const transferredNotional = seniorSize + mezzanineSize;
    const riskTransferPct = (transferredNotional / portfolioNotional) * 100;
    
    // Calculate RWA reduction (assuming 90% recognition for transferred portion)
    const rwaReduction = transferredNotional * (p.riskWeight / 100) * 0.9;
    const newRWA = currentRWA - rwaReduction;
    
    // Calculate capital impact (assuming total RWA of 30B)
    const totalRWABefore = 30000; // Million EUR
    const totalRWAAfter = totalRWABefore - rwaReduction;
    const cet1Capital = 4160; // Million EUR (assumed)
    
    const cet1Before = (cet1Capital / totalRWABefore) * 100;
    const cet1After = (cet1Capital / totalRWAAfter) * 100;
    const cet1Improvement = (cet1After - cet1Before) * 100; // in bps
    
    // Calculate annual costs
    const seniorPremium = seniorSize * (s.seniorSpread / 10000);
    const mezzaninePremium = mezzanineSize * (s.mezzanineSpread / 10000);
    const totalAnnualCost = seniorPremium + mezzaninePremium;
    
    // Calculate 5-year economics
    const totalCosts = totalAnnualCost * 5 + portfolioNotional * 0.003; // 30bps transaction costs
    const capitalSavings = rwaReduction * 0.12 * 5; // 12% cost of capital
    const fundingBenefit = rwaReduction * 0.015 * 5; // 15bps funding benefit
    const newBusinessROE = rwaReduction * 0.15 * 0.6; // 15% ROE on 60% of freed capital
    const totalBenefits = capitalSavings + fundingBenefit + newBusinessROE;
    const netBenefit = totalBenefits - totalCosts;
    
    // Update results
    srtState.results = {
        riskTransfer: riskTransferPct,
        rwaReduction: rwaReduction,
        cet1Improvement: cet1Improvement,
        annualCost: totalAnnualCost,
        netBenefit: netBenefit,
        capitalRelief: capitalSavings,
        // Additional metrics for detailed analysis
        seniorSize: seniorSize,
        mezzanineSize: mezzanineSize,
        firstLossSize: firstLossSize,
        seniorPremium: seniorPremium,
        mezzaninePremium: mezzaninePremium,
        totalCosts: totalCosts,
        totalBenefits: totalBenefits,
        capitalSavings: capitalSavings,
        cet1Before: cet1Before,
        cet1After: cet1After,
        currentRWA: currentRWA,
        newRWA: newRWA,
        totalRWABefore: totalRWABefore,
        totalRWAAfter: totalRWAAfter
    };
}

function updateAllDisplays() {
    const r = srtState.results;
    
    // Overview tab
    document.getElementById('riskTransferPct').textContent = `${r.riskTransfer.toFixed(1)}%`;
    document.getElementById('rwaReduction').textContent = `€${(r.rwaReduction / 1000).toFixed(1)}B`;
    document.getElementById('cet1Improvement').textContent = `+${r.cet1Improvement.toFixed(0)} bps`;
    document.getElementById("annualCost").textContent = `€${r.annualCost.toFixed(1)}M`;
    document.getElementById("capitalRelief").textContent = `€${r.capitalRelief.toFixed(1)}M`;
    
    // Structure tab
    updateStructureDisplay();
    
    // Capital tab
    updateCapitalDisplay();
    
    // Economics tab
    updateEconomicsDisplay();
}

function updateStructureDisplay() {
    const r = srtState.results;
    const s = srtState.structure;
    
    // Update tranche visual
    document.getElementById('seniorSize').textContent = `€${(r.seniorSize / 1000).toFixed(2)}B`;
    document.getElementById('mezzanineSize').textContent = `€${r.mezzanineSize.toFixed(0)}M`;
    document.getElementById('juniorSize').textContent = `€${r.firstLossSize.toFixed(1)}M`;
    
    const mezzanineAttachment = s.firstLoss;
    const mezzanineDetachment = s.firstLoss + s.mezzanineSize;
    
    document.getElementById('seniorAttachment').textContent = `${mezzanineDetachment.toFixed(1)}%`;
    document.getElementById('mezzanineAttachment').textContent = `${mezzanineAttachment.toFixed(1)}%`;
    document.getElementById('mezzanineDetachment').textContent = `${mezzanineDetachment.toFixed(1)}%`;
    document.getElementById('juniorDetachment').textContent = `${mezzanineAttachment.toFixed(1)}%`;
    
    // Update table
    document.getElementById('seniorSizeTable').textContent = `€${(r.seniorSize / 1000).toFixed(2)}B`;
    document.getElementById('mezzanineSizeTable').textContent = `€${r.mezzanineSize.toFixed(0)}M`;
    document.getElementById('juniorSizeTable').textContent = `€${r.firstLossSize.toFixed(1)}M`;
    
    document.getElementById('seniorAttachmentTable').textContent = `${mezzanineDetachment.toFixed(1)}%`;
    document.getElementById('mezzanineAttachmentTable').textContent = `${mezzanineAttachment.toFixed(1)}%`;
    document.getElementById('mezzanineDetachmentTable').textContent = `${mezzanineDetachment.toFixed(1)}%`;
    document.getElementById('juniorDetachmentTable').textContent = `${mezzanineAttachment.toFixed(1)}%`;
    
    document.getElementById('seniorSpreadTable').textContent = `${s.seniorSpread} bps`;
    document.getElementById('mezzanineSpreadTable').textContent = `${s.mezzanineSpread} bps`;
    
    document.getElementById('seniorPremiumTable').textContent = `€${r.seniorPremium.toFixed(1)}M`;
    document.getElementById('mezzaninePremiumTable').textContent = `€${r.mezzaninePremium.toFixed(1)}M`;
}

function updateCapitalDisplay() {
    const r = srtState.results;
    
    // Before SRT
    document.getElementById('beforeRWA').textContent = `€${(r.currentRWA / 1000).toFixed(1)}B`;
    document.getElementById('beforeTotalRWA').textContent = `€${(r.totalRWABefore / 1000).toFixed(1)}B`;
    document.getElementById('beforeCET1').textContent = `${r.cet1Before.toFixed(1)}%`;
    
    // After SRT
    document.getElementById('afterRWA').textContent = `€${(r.newRWA / 1000).toFixed(1)}B`;
    document.getElementById('afterTotalRWA').textContent = `€${(r.totalRWAAfter / 1000).toFixed(1)}B`;
    document.getElementById('afterCET1').textContent = `${r.cet1After.toFixed(1)}%`;
    
    // Calculate excess capital (assuming 12% minimum CET1)
    const minCET1 = 12.0;
    const beforeExcess = Math.max(0, (r.cet1Before - minCET1) / 100 * r.totalRWABefore);
    const afterExcess = Math.max(0, (r.cet1After - minCET1) / 100 * r.totalRWAAfter);
    
    document.getElementById('beforeExcess').textContent = `€${(beforeExcess / 1000).toFixed(2)}B`;
    document.getElementById('afterExcess').textContent = `€${(afterExcess / 1000).toFixed(2)}B`;
}

function updateEconomicsDisplay() {
    const r = srtState.results;
    
    document.getElementById('totalPremiums').textContent = `€${(r.annualCost * 5).toFixed(1)}M`;
    document.getElementById('totalCosts').textContent = `€${r.totalCosts.toFixed(1)}M`;
    document.getElementById('capitalSavings').textContent = `€${r.capitalSavings.toFixed(1)}M`;
    document.getElementById('totalBenefits').textContent = `€${r.totalBenefits.toFixed(1)}M`;
    document.getElementById('netBenefit').textContent = `€${r.netBenefit.toFixed(1)}M`;
    
    const roi = (r.totalBenefits / r.totalCosts - 1) * 100;
    document.getElementById('roiValue').textContent = `${roi.toFixed(0)}%`;
}

function initializeDemoCharts() {
    // Initialize all charts with default data
    updateAllCharts();
}

function updateAllCharts() {
    updateRiskProfileChart();
    updateCapitalImpactChart();
    updateCapitalEvolutionChart();
    updateCashFlowChart();
    updateSensitivityChart();
}

function updateRiskProfileChart() {
    const canvas = document.getElementById('riskProfileChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw risk profile as a simple bar chart
    const metrics = [
        { label: 'PD', value: srtState.portfolio.avgPD, max: 5, color: '#667eea' },
        { label: 'LGD', value: srtState.portfolio.avgLGD, max: 80, color: '#764ba2' },
        { label: 'RW', value: srtState.portfolio.riskWeight, max: 150, color: '#f093fb' }
    ];
    
    const barWidth = width / metrics.length * 0.6;
    const spacing = width / metrics.length;
    
    metrics.forEach((metric, index) => {
        const x = index * spacing + spacing / 2 - barWidth / 2;
        const barHeight = (metric.value / metric.max) * (height - 60);
        const y = height - 40 - barHeight;
        
        // Draw bar
        ctx.fillStyle = metric.color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(metric.label, x + barWidth / 2, height - 25);
        
        // Draw value
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`${metric.value}${metric.label === 'PD' ? '%' : metric.label === 'LGD' ? '%' : '%'}`, 
                    x + barWidth / 2, y - 10);
    });
}

function updateCapitalImpactChart() {
    const canvas = document.getElementById('capitalImpactChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const r = srtState.results;
    const data = [
        { label: 'Before', value: r.cet1Before, color: '#ed8936' },
        { label: 'After', value: r.cet1After, color: '#48bb78' }
    ];
    
    const barWidth = width / data.length * 0.4;
    const spacing = width / data.length;
    const maxValue = Math.max(...data.map(d => d.value)) * 1.2;
    
    data.forEach((item, index) => {
        const x = index * spacing + spacing / 2 - barWidth / 2;
        const barHeight = (item.value / maxValue) * (height - 60);
        const y = height - 40 - barHeight;
        
        // Draw bar
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw label
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + barWidth / 2, height - 25);
        
        // Draw value
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 14px Inter';
        ctx.fillText(`${item.value.toFixed(1)}%`, x + barWidth / 2, y - 10);
    });
    
    // Draw improvement arrow and text
    if (data.length === 2) {
        const improvement = r.cet1Improvement;
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`+${improvement.toFixed(0)} bps`, width / 2, 30);
    }
}

function updateCapitalEvolutionChart() {
    const canvas = document.getElementById('capitalEvolutionChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw a simple line chart showing capital evolution
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const r = srtState.results;
    const timePoints = ['Current', 'Post-SRT', 'Year 1', 'Year 2', 'Year 3'];
    const cet1Values = [
        r.cet1Before,
        r.cet1After,
        r.cet1After + 0.1,
        r.cet1After + 0.2,
        r.cet1After + 0.3
    ];
    
    const minValue = Math.min(...cet1Values) - 0.5;
    const maxValue = Math.max(...cet1Values) + 0.5;
    
    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    cet1Values.forEach((value, index) => {
        const x = padding + (index / (cet1Values.length - 1)) * chartWidth;
        const y = height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw points and labels
    ctx.fillStyle = '#667eea';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    
    cet1Values.forEach((value, index) => {
        const x = padding + (index / (cet1Values.length - 1)) * chartWidth;
        const y = height - padding - ((value - minValue) / (maxValue - minValue)) * chartHeight;
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = '#4a5568';
        ctx.fillText(timePoints[index], x, height - padding + 20);
        ctx.fillText(`${value.toFixed(1)}%`, x, y - 10);
        ctx.fillStyle = '#667eea';
    });
}

function updateCashFlowChart() {
    const canvas = document.getElementById('cashFlowChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const r = srtState.results;
    const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const costs = Array(5).fill(-r.annualCost);
    const benefits = [
        r.capitalSavings / 5,
        r.capitalSavings / 5,
        r.capitalSavings / 5,
        r.capitalSavings / 5,
        r.capitalSavings / 5
    ];
    
    const maxValue = Math.max(...benefits) * 1.2;
    const minValue = Math.min(...costs) * 1.2;
    
    // Draw bars
    const barWidth = chartWidth / years.length * 0.3;
    const spacing = chartWidth / years.length;
    
    years.forEach((year, index) => {
        const x = padding + index * spacing + spacing / 2;
        const zeroY = height - padding - ((-minValue) / (maxValue - minValue)) * chartHeight;
        
        // Cost bar (negative)
        const costHeight = Math.abs(costs[index] / (maxValue - minValue)) * chartHeight;
        ctx.fillStyle = '#f56565';
        ctx.fillRect(x - barWidth, zeroY, barWidth, costHeight);
        
        // Benefit bar (positive)
        const benefitHeight = (benefits[index] / (maxValue - minValue)) * chartHeight;
        ctx.fillStyle = '#48bb78';
        ctx.fillRect(x, zeroY - benefitHeight, barWidth, benefitHeight);
        
        // Year label
        ctx.fillStyle = '#4a5568';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(year, x, height - padding + 20);
    });
    
    // Draw zero line
    const zeroY = height - padding - ((-minValue) / (maxValue - minValue)) * chartHeight;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.stroke();
}

function updateSensitivityChart() {
    const canvas = document.getElementById('sensitivityChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw sensitivity tornado chart
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const baseValue = srtState.results.netBenefit;
    const sensitivities = [
        { label: 'PD +/-50%', low: baseValue * 0.7, high: baseValue * 1.3 },
        { label: 'LGD +/-25%', low: baseValue * 0.8, high: baseValue * 1.2 },
        { label: 'Spreads +/-50bps', low: baseValue * 0.85, high: baseValue * 1.15 },
        { label: 'Recovery +/-20%', low: baseValue * 0.9, high: baseValue * 1.1 }
    ];
    
    const maxRange = Math.max(...sensitivities.map(s => Math.max(Math.abs(s.low - baseValue), Math.abs(s.high - baseValue))));
    const barHeight = chartHeight / sensitivities.length * 0.6;
    const spacing = chartHeight / sensitivities.length;
    
    // Draw base line
    const centerX = padding + chartWidth / 2;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, height - padding);
    ctx.stroke();
    
    sensitivities.forEach((item, index) => {
        const y = padding + index * spacing + spacing / 2;
        
        const lowX = centerX + ((item.low - baseValue) / maxRange) * (chartWidth / 2);
        const highX = centerX + ((item.high - baseValue) / maxRange) * (chartWidth / 2);
        
        // Draw sensitivity bar
        ctx.fillStyle = index % 2 === 0 ? '#667eea' : '#764ba2';
        ctx.fillRect(Math.min(lowX, highX), y - barHeight / 2, Math.abs(highX - lowX), barHeight);
        
        // Draw label
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(item.label, padding - 10, y + 4);
    });
}

function initializeDemoTabs() {
    const tabButtons = document.querySelectorAll('.app-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.app-main .tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Update charts when tab becomes active
            setTimeout(() => {
                updateAllCharts();
            }, 100);
        });
    });
}

function initializeScenarios() {
    const scenarioButtons = document.querySelectorAll('.scenario-btn');
    
    scenarioButtons.forEach(button => {
        button.addEventListener('click', () => {
            const scenarioName = button.getAttribute('data-scenario');
            loadScenario(scenarioName);
        });
    });
}

function loadScenario(scenarioName) {
    if (!scenarios[scenarioName]) return;
    
    const scenario = scenarios[scenarioName];
    
    // Update state
    srtState.portfolio = { ...scenario.portfolio };
    srtState.structure = { ...scenario.structure };
    
    // Update inputs
    loadInputValues();
    
    // Recalculate
    calculateSRT();
    
    // Show notification
    showNotification(`Loaded ${scenarioName} scenario`, 'success');
}

function initializeSensitivityControls() {
    const stressDefaultRate = document.getElementById('stressDefaultRate');
    const stressRecoveryRate = document.getElementById('stressRecoveryRate');
    const spreadWidening = document.getElementById('spreadWidening');
    
    if (stressDefaultRate) {
        stressDefaultRate.addEventListener('input', (e) => {
            document.getElementById('stressDefaultValue').textContent = `${e.target.value}%`;
            updateSensitivityResults();
        });
    }
    
    if (stressRecoveryRate) {
        stressRecoveryRate.addEventListener('input', (e) => {
            document.getElementById('stressRecoveryValue').textContent = `${e.target.value}%`;
            updateSensitivityResults();
        });
    }
    
    if (spreadWidening) {
        spreadWidening.addEventListener('input', (e) => {
            document.getElementById('spreadWideningValue').textContent = `${e.target.value} bps`;
            updateSensitivityResults();
        });
    }
}

function updateSensitivityResults() {
    const stressDefault = parseFloat(document.getElementById('stressDefaultRate').value);
    const stressRecovery = parseFloat(document.getElementById('stressRecoveryRate').value);
    const spreadWidening = parseFloat(document.getElementById('spreadWidening').value);
    
    // Calculate stress scenarios
    const baseNetBenefit = srtState.results.netBenefit;
    
    // Stress case: higher defaults, lower recovery, wider spreads
    const stressImpact = (stressDefault / srtState.portfolio.avgPD - 1) * 0.3 + 
                        (1 - stressRecovery / (100 - srtState.portfolio.avgLGD)) * 0.2 +
                        (spreadWidening / 100) * 0.1;
    const stressNetBenefit = baseNetBenefit * (1 - stressImpact);
    const stressIRR = 18.2 * (1 - stressImpact * 0.8);
    
    // Severe stress case
    const severeImpact = stressImpact * 1.8;
    const severeNetBenefit = baseNetBenefit * (1 - severeImpact);
    const severeIRR = 18.2 * (1 - severeImpact * 0.8);
    
    // Update displays
    document.getElementById('baseNetBenefit').textContent = `€${baseNetBenefit.toFixed(1)}M`;
    document.getElementById('stressNetBenefit').textContent = `€${Math.max(0, stressNetBenefit).toFixed(1)}M`;
    document.getElementById('stressIRR').textContent = `${Math.max(0, stressIRR).toFixed(1)}%`;
    document.getElementById('severeNetBenefit').textContent = `€${Math.max(0, severeNetBenefit).toFixed(1)}M`;
    document.getElementById('severeIRR').textContent = `${Math.max(0, severeIRR).toFixed(1)}%`;
}

function initializeExportFunctions() {
    document.getElementById('exportPDF').addEventListener('click', exportPDF);
    document.getElementById('exportExcel').addEventListener('click', exportExcel);
    document.getElementById('exportJSON').addEventListener('click', exportJSON);
    document.getElementById('shareLink').addEventListener('click', shareAnalysis);
}

function exportPDF() {
    showNotification('PDF export functionality would be implemented in production', 'info');
}

function exportExcel() {
    showNotification('Excel export functionality would be implemented in production', 'info');
}

function exportJSON() {
    const data = {
        portfolio: srtState.portfolio,
        structure: srtState.structure,
        results: srtState.results,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'srt-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('JSON data exported successfully', 'success');
}

function shareAnalysis() {
    const url = new URL(window.location);
    url.searchParams.set('portfolio', btoa(JSON.stringify(srtState.portfolio)));
    url.searchParams.set('structure', btoa(JSON.stringify(srtState.structure)));
    
    navigator.clipboard.writeText(url.toString()).then(() => {
        showNotification('Analysis link copied to clipboard', 'success');
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
}

function showLoading() {
    document.querySelector('.app-main').classList.add('loading');
}

function hideLoading() {
    document.querySelector('.app-main').classList.remove('loading');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load scenario from URL parameters on page load
function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('portfolio')) {
        try {
            const portfolio = JSON.parse(atob(urlParams.get('portfolio')));
            srtState.portfolio = { ...srtState.portfolio, ...portfolio };
        } catch (e) {
            console.error('Failed to load portfolio from URL');
        }
    }
    
    if (urlParams.has('structure')) {
        try {
            const structure = JSON.parse(atob(urlParams.get('structure')));
            srtState.structure = { ...srtState.structure, ...structure };
        } catch (e) {
            console.error('Failed to load structure from URL');
        }
    }
}

// Initialize from URL on load
document.addEventListener('DOMContentLoaded', () => {
    loadFromURL();
});

// Export functions for use in other scripts
window.SRTDemo = {
    calculateSRT,
    loadScenario,
    exportJSON,
    shareAnalysis,
    showNotification
};



// Capital Savings Calculator Logic

document.addEventListener("DOMContentLoaded", function() {
    const portfolioSizeInput = document.getElementById("calcPortfolioSize");
    const riskTransferredInput = document.getElementById("calcRiskTransferred");
    const capitalBeforeSpan = document.getElementById("capitalBefore");
    const capitalAfterSpan = document.getElementById("capitalAfter");
    const capitalFreedSpan = document.getElementById("capitalFreed");

    const capitalRatio = 0.08; // 8% capital ratio

    function calculateCapitalSavings() {
        const portfolio = Number(portfolioSizeInput.value);
        const percent = Number(riskTransferredInput.value);

        const originalCapital = portfolio * capitalRatio;
        const transferred = portfolio * (percent / 100);
        const newCapital = (portfolio - transferred) * capitalRatio;
        const capitalSaved = originalCapital - newCapital;

        capitalBeforeSpan.textContent = `£${originalCapital.toFixed(1)}m`;
        capitalAfterSpan.textContent = `£${newCapital.toFixed(1)}m`;
        capitalFreedSpan.textContent = `£${capitalSaved.toFixed(1)}m`;
    }

    // Add event listeners for input changes
    portfolioSizeInput.addEventListener("input", calculateCapitalSavings);
    riskTransferredInput.addEventListener("input", calculateCapitalSavings);

    // Initial calculation on page load
    calculateCapitalSavings();
});


