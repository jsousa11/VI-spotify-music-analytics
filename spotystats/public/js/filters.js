function initializeFilters() {
    const allGenres = getUniqueGenres(appState.data);

    // Limitar a top 20 géneros mais comuns (por contagem)
    const genreCount = d3.rollup(
        appState.data,
        v => v.length,
        d => d.genre
    );

    const topGenres = [...genreCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(d => d[0]);


    // Criar checkboxes de géneros
    const genreContainer = d3.select('#genre-filters');
    genreContainer.selectAll('*').remove(); // Limpar antes

    topGenres.forEach(genre => {
        const label = genreContainer.append('label')
            .attr('class', 'genre-checkbox');

        label.append('input')
            .attr('type', 'checkbox')
            .attr('value', genre)
            .on('change', function () {
                if (this.checked) {
                    appState.selectedGenres.push(genre);
                } else {
                    appState.selectedGenres = appState.selectedGenres.filter(g => g !== genre);
                }
                updateAllVisualizations();
            });

        label.append('span')
            .style('color', genreColors[genre] || '#888')
            .text(` ${genre}`);
    });

    // Slider de popularidade
    // Popularity slider (if present)
    const popSlider = d3.select('#popularity-slider');
    if (!popSlider.empty()) {
        // Calculate min and max popularity from dataset
        const minPop = d3.min(appState.data, d => d.popularity) || 0;
        const maxPop = d3.max(appState.data, d => d.popularity) || 100;

        // Update slider attributes
        popSlider
            .attr('min', minPop)
            .attr('max', maxPop)
            .attr('value', minPop);

        // Update display
        d3.select('#popularity-value').text(minPop + '+');

        // Set initial state
        appState.minPopularity = minPop;

        popSlider.on('input', function () {
            appState.minPopularity = +this.value;
            d3.select('#popularity-value').text(this.value + '+');
            updateAllVisualizations();
        });
    }



    // Adicionar filtro de ano
    const yearFilterHTML = `
        <div class="filter-group">
            <h3>Year Range</h3>
            <input type="range" id="year-min" min="2000" max="2023" value="2000">
            <input type="range" id="year-max" min="2000" max="2023" value="2023">
            <span id="year-range-display">2000 - 2023</span>
        </div>
    `;
    d3.select('#sidebar-filters').insert('div', '#reset-filters')
        .html(yearFilterHTML);

    d3.select('#year-min').on('input', function () {
        appState.yearRange[0] = +this.value;
        // Normalize: ensure [0] <= [1]
        if (appState.yearRange[0] > appState.yearRange[1]) {
            [appState.yearRange[0], appState.yearRange[1]] = [appState.yearRange[1], appState.yearRange[0]];
            // Update slider positions to match swapped values
            d3.select('#year-min').property('value', appState.yearRange[0]);
            d3.select('#year-max').property('value', appState.yearRange[1]);
        }
        d3.select('#year-range-display').text(`${appState.yearRange[0]} - ${appState.yearRange[1]}`);
        updateAllVisualizations();
    });

    d3.select('#year-max').on('input', function () {
        appState.yearRange[1] = +this.value;
        // Normalize: ensure [0] <= [1]
        if (appState.yearRange[0] > appState.yearRange[1]) {
            [appState.yearRange[0], appState.yearRange[1]] = [appState.yearRange[1], appState.yearRange[0]];
            // Update slider positions to match swapped values
            d3.select('#year-min').property('value', appState.yearRange[0]);
            d3.select('#year-max').property('value', appState.yearRange[1]);
        }
        d3.select('#year-range-display').text(`${appState.yearRange[0]} - ${appState.yearRange[1]}`);
        updateAllVisualizations();
    });

    // Reset filters
    d3.select('#reset-filters').on('click', () => {
        appState.selectedGenres = [];
        const minPop = d3.min(appState.data, d => d.popularity) || 0;
        appState.minPopularity = minPop;
        appState.yearRange = [2000, 2023];
        d3.selectAll('.genre-checkbox input').property('checked', false);
        // Reset popularity slider if it exists
        const popSlider = d3.select('#popularity-slider');
        if (!popSlider.empty()) {
            popSlider.property('value', minPop);
            d3.select('#popularity-value').text(minPop + '+');
        }
        d3.select('#year-min').property('value', 2000);
        d3.select('#year-max').property('value', 2023);
        d3.select('#year-range-display').text('2000 - 2023');

        // Clear artist selection if on artist page
        if (typeof selectedArtistForSongs !== 'undefined') {
            selectedArtistForSongs = null;
        }

        updateAllVisualizations();
    });

    // Accordion functionality for genre filter
    const genreAccordionHeader = document.getElementById('genre-accordion-header');
    const genreAccordionContent = document.getElementById('genre-filters');

    if (genreAccordionHeader && genreAccordionContent) {
        genreAccordionHeader.addEventListener('click', function () {
            this.classList.toggle('collapsed');
            genreAccordionContent.classList.toggle('collapsed');
        });
    }
}
