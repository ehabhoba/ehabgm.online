export class NavigationManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('.section');
    }

    async init() {
        this.bindEvents();
        this.showSection('dashboard');
    }

    bindEvents() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const section = e.state?.section || 'dashboard';
            this.showSection(section, false);
        });
    }

    showSection(sectionName, pushState = true) {
        // Hide all sections
        this.sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.add('fade-in');
        }

        // Update navigation
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionName) {
                link.classList.add('active');
            }
        });

        // Update browser history
        if (pushState) {
            history.pushState({ section: sectionName }, '', `#${sectionName}`);
        }

        this.currentSection = sectionName;
        window.app.currentSection = sectionName;

        // Trigger section-specific initialization
        this.triggerSectionInit(sectionName);
    }

    triggerSectionInit(sectionName) {
        const manager = window.app.managers[sectionName];
        if (manager && typeof manager.onSectionShow === 'function') {
            manager.onSectionShow();
        }
    }
}