
class Router {
    constructor() {
        this.links = document.querySelectorAll('.nav-links a');
        this.sections = document.querySelectorAll('.page-section');
        this.sidebarFilters = document.getElementById('sidebar-filters');
        this.pageTitle = document.getElementById('page-title');
        this.pageSubtitle = document.getElementById('page-subtitle');

        this.pages = {
            'energy-danceability': {
                title: 'Energy vs. Danceability with Popularity',
                subtitle: 'Exploring the relationship between energy and danceability across genres.',
                showFilters: true,
                init: () => {
                    if (typeof createScatterplot === 'function') createScatterplot();
                }
            },
            'genre-evolution': {
                title: 'Genres Evolution',
                subtitle: 'Tracking how genres have evolved from 2000 to 2023.',
                showFilters: true,
                init: () => {
                    if (typeof createTimeline === 'function') createTimeline();
                }
            },
            'variables-evolution': {
                title: 'Music Variables Evolution',
                subtitle: 'Tracking how musical characteristics have changed from 2000 to 2023.',
                showFilters: true,
                init: () => {
                    if (typeof createVariablesTimeline === 'function') createVariablesTimeline();
                }
            },

            'artist-comparison': {
                title: 'Artist Comparison',
                subtitle: 'Compare the musical profiles of different artists.',
                showFilters: false,
                init: () => {
                    if (typeof createRadarChart === 'function') createRadarChart();
                }
            },
            'artists': {
                title: 'Artist Deep Dive',
                subtitle: 'Explore individual artist discographies and preview their top tracks.',
                showFilters: false,
                init: () => {
                    if (typeof initArtistsPage === 'function') initArtistsPage();
                }
            }
        };

        this.init();
    }

    init() {
        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                this.navigateTo(pageId);
            });
        });

        // Initial load
        const activeLink = document.querySelector('.nav-links a.active');
        if (activeLink) {
            this.navigateTo(activeLink.getAttribute('data-page'));
        }
    }

    navigateTo(pageId) {
        // Update Active Link
        this.links.forEach(link => link.classList.remove('active'));
        document.querySelector(`.nav-links a[data-page="${pageId}"]`).classList.add('active');

        // Show Section
        this.sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`page-${pageId}`).classList.add('active');

        // Update Header
        const pageInfo = this.pages[pageId];
        this.pageTitle.textContent = pageInfo.title;
        this.pageSubtitle.textContent = pageInfo.subtitle;

        // Toggle Filters
        if (pageInfo.showFilters) {
            this.sidebarFilters.classList.add('visible');

            // Hide popularity filter on Artist Deep Dive page (show only genre filters)
            const popularityFilter = document.querySelector('.filter-popularity');
            if (popularityFilter) {
                if (pageId === 'artists') {
                    popularityFilter.style.display = 'none';
                } else {
                    popularityFilter.style.display = 'block';
                }
            }
        } else {
            this.sidebarFilters.classList.remove('visible');
        }

        // Trigger specific page init
        if (pageInfo.init) {
            // Small timeout to ensure DOM is visible/layout calculated
            setTimeout(() => {
                pageInfo.init();
            }, 50);
        }

        // Trigger resize events for D3 charts to adjust
        window.dispatchEvent(new Event('resize'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
});
