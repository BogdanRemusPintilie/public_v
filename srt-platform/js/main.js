// Main JavaScript for SRT Platform

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
    
    // Initialize charts
    initializeCharts();
    
    // Animate elements on scroll
    initializeScrollAnimations();
});

// Chart initialization
function initializeCharts() {
    // Hero Chart
    const heroCanvas = document.getElementById('heroChart');
    if (heroCanvas) {
        const ctx = heroCanvas.getContext('2d');
        drawHeroChart(ctx, heroCanvas.width, heroCanvas.height);
    }
    
    // Market Chart
    const marketCanvas = document.getElementById('marketChart');
    if (marketCanvas) {
        const ctx = marketCanvas.getContext('2d');
        drawMarketChart(ctx, marketCanvas.width, marketCanvas.height);
    }
}

// Hero dashboard chart
function drawHeroChart(ctx, width, height) {
    const data = [
        { x: 0, y: 120 },
        { x: 50, y: 110 },
        { x: 100, y: 95 },
        { x: 150, y: 85 },
        { x: 200, y: 75 },
        { x: 250, y: 70 },
        { x: 300, y: 65 }
    ];
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
        const y = (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((point, index) => {
        const x = (point.x / 300) * width;
        const y = height - (point.y / 150) * height;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw area under curve
    ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    data.forEach((point, index) => {
        const x = (point.x / 300) * width;
        const y = height - (point.y / 150) * height;
        
        if (index === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    
    // Draw points
    ctx.fillStyle = '#667eea';
    data.forEach(point => {
        const x = (point.x / 300) * width;
        const y = height - (point.y / 150) * height;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// Market growth chart
function drawMarketChart(ctx, width, height) {
    const data = [
        { year: '2016', value: 3.7 },
        { year: '2017', value: 5.2 },
        { year: '2018', value: 7.8 },
        { year: '2019', value: 10.5 },
        { year: '2020', value: 12.1 },
        { year: '2021', value: 16.3 },
        { year: '2022', value: 20.0 }
    ];
    
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
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
    
    // Draw bars
    const barWidth = chartWidth / data.length * 0.6;
    const maxValue = Math.max(...data.map(d => d.value));
    
    data.forEach((item, index) => {
        const x = padding + (chartWidth / data.length) * index + (chartWidth / data.length - barWidth) / 2;
        const barHeight = (item.value / maxValue) * chartHeight;
        const y = height - padding - barHeight;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value labels
        ctx.fillStyle = '#4a5568';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`€${item.value}B`, x + barWidth / 2, y - 5);
        
        // Draw year labels
        ctx.fillText(item.year, x + barWidth / 2, height - padding + 20);
    });
    
    // Draw title
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('SRT Market Growth (€ Billions)', width / 2, 25);
}

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate feature cards
    document.querySelectorAll('.feature-card, .capability-item, .highlight-item, .benefit-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    
    // Animate stats
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
            }
        });
    }, { threshold: 0.5 });
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
}

// Animate statistics counters
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number, .metric-value');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        const numericValue = parseFloat(finalValue.replace(/[^0-9.]/g, ''));
        
        if (!isNaN(numericValue)) {
            let currentValue = 0;
            const increment = numericValue / 50;
            const timer = setInterval(() => {
                currentValue += increment;
                if (currentValue >= numericValue) {
                    currentValue = numericValue;
                    clearInterval(timer);
                }
                
                // Format the value based on original format
                if (finalValue.includes('€')) {
                    if (finalValue.includes('B')) {
                        stat.textContent = `€${currentValue.toFixed(1)}B`;
                    } else if (finalValue.includes('M')) {
                        stat.textContent = `€${Math.round(currentValue)}M`;
                    } else {
                        stat.textContent = `€${Math.round(currentValue)}`;
                    }
                } else if (finalValue.includes('%')) {
                    stat.textContent = `${Math.round(currentValue)}%`;
                } else if (finalValue.includes('+')) {
                    stat.textContent = `${Math.round(currentValue)}+`;
                } else if (finalValue.includes('/')) {
                    stat.textContent = finalValue; // Keep original for 24/7
                } else {
                    stat.textContent = Math.round(currentValue).toString();
                }
            }, 50);
        }
    });
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Form handling (if forms are added later)
function handleFormSubmission(formId, callback) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(form);
            callback(formData);
        });
    }
}

// Loading states
function showLoading(element) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
}

function hideLoading(element) {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
}

// Export functions for use in other scripts
window.SRTPlatform = {
    initializeCharts,
    animateStats,
    showLoading,
    hideLoading,
    handleFormSubmission
};

