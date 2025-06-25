// Example page specific JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize example page functionality
    initializeExamplePage();
    initializeExampleCharts();
    initializeTabNavigation();
    initializeScrollNavigation();
});

function initializeExamplePage() {
    // Animate metrics on scroll
    const metricsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateMetrics(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.metrics-grid, .risk-grid').forEach(el => {
        metricsObserver.observe(el);
    });
    
    // Animate progress bars
    const progressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateProgressBars(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.geographic-breakdown').forEach(el => {
        progressObserver.observe(el);
    });
}

function initializeExampleCharts() {
    // Portfolio composition chart
    const portfolioCanvas = document.getElementById('portfolioChart');
    if (portfolioCanvas) {
        const ctx = portfolioCanvas.getContext('2d');
        drawPortfolioChart(ctx, portfolioCanvas.width, portfolioCanvas.height);
    }
    
    // Sector breakdown chart
    const sectorCanvas = document.getElementById('sectorChart');
    if (sectorCanvas) {
        const ctx = sectorCanvas.getContext('2d');
        drawSectorChart(ctx, sectorCanvas.width, sectorCanvas.height);
    }
    
    // Sensitivity analysis chart
    const sensitivityCanvas = document.getElementById('sensitivityChart');
    if (sensitivityCanvas) {
        const ctx = sensitivityCanvas.getContext('2d');
        drawSensitivityChart(ctx, sensitivityCanvas.width, sensitivityCanvas.height);
    }
}

function drawPortfolioChart(ctx, width, height) {
    const data = [
        { label: 'Large Corporate', value: 45, color: '#667eea' },
        { label: 'Mid-Market', value: 35, color: '#764ba2' },
        { label: 'SME', value: 20, color: '#f093fb' }
    ];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    let currentAngle = -Math.PI / 2;
    
    data.forEach(segment => {
        const sliceAngle = (segment.value / 100) * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add center text
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('€2.5B', centerX, centerY - 5);
    ctx.font = '12px Inter';
    ctx.fillText('Portfolio', centerX, centerY + 15);
}

function drawSectorChart(ctx, width, height) {
    const sectors = [
        { name: 'Manufacturing', value: 25, color: '#667eea' },
        { name: 'Real Estate', value: 20, color: '#764ba2' },
        { name: 'Technology', value: 15, color: '#f093fb' },
        { name: 'Healthcare', value: 12, color: '#4ecdc4' },
        { name: 'Retail', value: 10, color: '#45b7d1' },
        { name: 'Energy', value: 8, color: '#96ceb4' },
        { name: 'Other', value: 10, color: '#feca57' }
    ];
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    let currentAngle = -Math.PI / 2;
    
    sectors.forEach(sector => {
        const sliceAngle = (sector.value / 100) * 2 * Math.PI;
        
        // Draw slice
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = sector.color;
        ctx.fill();
        
        // Draw border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        currentAngle += sliceAngle;
    });
}

function drawSensitivityChart(ctx, width, height) {
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw axes
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    
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
    
    // Data points for sensitivity analysis
    const scenarios = [
        { defaultRate: 1.0, netBenefit: 95 },
        { defaultRate: 1.5, netBenefit: 90 },
        { defaultRate: 2.0, netBenefit: 85 },
        { defaultRate: 2.5, netBenefit: 78 },
        { defaultRate: 3.0, netBenefit: 70 },
        { defaultRate: 3.5, netBenefit: 60 },
        { defaultRate: 4.0, netBenefit: 48 },
        { defaultRate: 4.5, netBenefit: 35 },
        { defaultRate: 5.0, netBenefit: 20 }
    ];
    
    // Draw sensitivity line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    scenarios.forEach((point, index) => {
        const x = padding + (point.defaultRate / 5.0) * chartWidth;
        const y = height - padding - (point.netBenefit / 100) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = '#667eea';
    scenarios.forEach(point => {
        const x = padding + (point.defaultRate / 5.0) * chartWidth;
        const y = height - padding - (point.netBenefit / 100) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Add labels
    ctx.fillStyle = '#4a5568';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = 0; i <= 5; i++) {
        const x = padding + (i / 5) * chartWidth;
        ctx.fillText(`${i}%`, x, height - padding + 20);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 100; i += 20) {
        const y = height - padding - (i / 100) * chartHeight;
        ctx.fillText(`€${i}M`, padding - 10, y + 5);
    }
    
    // Add axis titles
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Default Rate (%)', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Net Benefit (€M)', 0, 0);
    ctx.restore();
}

function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

function initializeScrollNavigation() {
    const navSteps = document.querySelectorAll('.nav-step');
    const sections = document.querySelectorAll('.example-section');
    
    // Update active nav step based on scroll position
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navSteps.forEach(step => {
            step.classList.remove('active');
            if (step.getAttribute('data-step') === current) {
                step.classList.add('active');
            }
        });
    });
    
    // Smooth scroll to sections when nav steps are clicked
    navSteps.forEach(step => {
        step.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = step.getAttribute('data-step');
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function animateMetrics(container) {
    const metricValues = container.querySelectorAll('.metric-value, .risk-value, .result-value');
    
    metricValues.forEach(metric => {
        const finalValue = metric.textContent;
        const numericValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numericValue) && numericValue > 0) {
            let currentValue = 0;
            const increment = numericValue / 30;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    currentValue = numericValue;
                    clearInterval(timer);
                }
                
                // Format the value based on original format
                if (finalValue.includes('€')) {
                    if (finalValue.includes('B')) {
                        metric.textContent = `€${currentValue.toFixed(1)}B`;
                    } else if (finalValue.includes('M')) {
                        metric.textContent = `€${Math.round(currentValue)}M`;
                    } else {
                        metric.textContent = `€${Math.round(currentValue)}`;
                    }
                } else if (finalValue.includes('%')) {
                    metric.textContent = `${currentValue.toFixed(1)}%`;
                } else if (finalValue.includes('bps')) {
                    metric.textContent = `+${Math.round(currentValue)} bps`;
                } else {
                    metric.textContent = Math.round(currentValue).toString();
                }
            }, 50);
        }
    });
}

function animateProgressBars(container) {
    const progressBars = container.querySelectorAll('.progress-fill');
    
    progressBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = targetWidth;
        }, 100);
    });
}

// Copy functionality for code examples
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show success message
        showNotification('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showNotification('Failed to copy', 'error');
    });
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
        background: ${type === 'success' ? '#48bb78' : '#f56565'};
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

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
window.ExamplePage = {
    animateMetrics,
    animateProgressBars,
    copyToClipboard,
    showNotification
};

