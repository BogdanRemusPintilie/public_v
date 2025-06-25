
// Component loader utility
function loadComponent(elementId, componentPath) {
    fetch(componentPath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading component:', error);
        });
}

// Load all components when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    loadComponent('header-placeholder', 'components/header.html');
    loadComponent('hero-placeholder', 'components/hero.html');
    loadComponent('platform-overview-placeholder', 'components/platform-overview.html');
    loadComponent('market-context-placeholder', 'components/market-context.html');
    loadComponent('capabilities-placeholder', 'components/capabilities.html');
    loadComponent('why-choose-placeholder', 'components/why-choose.html');
    loadComponent('cta-placeholder', 'components/cta.html');
    loadComponent('footer-placeholder', 'components/footer.html');
});
