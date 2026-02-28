let timelineSvg, timelineXScale, timelineYScale;
let visibleGenres = new Set();

function createTimeline() {
    const container = document.getElementById('timeline');
    const containerRect = container.getBoundingClientRect();

    const margin = { top: 20, right: 200, bottom: 70, left: 70 };
    const width = (containerRect.width || 1200) - margin.left - margin.right;
    const height = (containerRect.height || 400) - margin.top - margin.bottom;

    // Limpar gráfico anterior
    d3.select('#timeline').selectAll('*').remove();

    // Criar SVG principal
    const svg = d3.select('#timeline')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);

    // Grupo principal
    timelineSvg = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Agregar dados por ano e género
    // Expand year range if too small (1-2 years) to show context
    let displayYearRange = [...appState.yearRange];
    if (displayYearRange[0] > displayYearRange[1]) {
        displayYearRange = [displayYearRange[1], displayYearRange[0]];
    }

    const selectedYearSpan = displayYearRange[1] - displayYearRange[0];

    if (selectedYearSpan <= 1) {
        const minAvailable = 2000; // Dataset minimum
        const maxAvailable = 2023; // Dataset maximum

        displayYearRange[0] = Math.max(minAvailable, displayYearRange[0] - 1);
        displayYearRange[1] = Math.min(maxAvailable, displayYearRange[1] + 1);
    }

    // Use filteredData (which already has genre/popularity filters applied)
    // but expand the year range for better visualization context
    const displayData = appState.filteredData.map(d => d.year >= displayYearRange[0] && d.year <= displayYearRange[1] ? d : null).filter(d => d !== null);

    // Also include data from expanded years (if any) that match genre/popularity filters
    if (selectedYearSpan <= 1) {
        const expandedYearData = appState.data.filter(d => {
            const genreMatch = appState.selectedGenres.length === 0 ||
                appState.selectedGenres.some(g => d.genre === g.toLowerCase());
            const popularityMatch = d.popularity >= appState.minPopularity;
            const inExpandedRange = d.year >= displayYearRange[0] && d.year <= displayYearRange[1];
            const notInOriginalRange = d.year < displayYearRange[0] || d.year > displayYearRange[1];
            return genreMatch && popularityMatch && inExpandedRange && notInOriginalRange;
        });
        displayData.push(...expandedYearData);
    }

    const yearGenreData = d3.rollup(
        displayData,
        v => v.length,
        d => d.year,
        d => d.genre
    );

    // Get top 20 genres (same as filter sidebar) instead of all genres
    const genreTotals = d3.rollup(
        displayData,
        v => v.length,
        d => d.genre
    );

    const topGenres = Array.from(genreTotals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(d => d[0]);

    // Preparar dados por género com TOTAIS CUMULATIVOS
    // Create a complete range of years from displayYearRange
    const allYears = [];
    for (let year = displayYearRange[0]; year <= displayYearRange[1]; year++) {
        allYears.push(year);
    }

    const minYear = displayYearRange[0];
    const maxYear = displayYearRange[1];

    const genreData = topGenres.map(genre => {
        // Calculate base count from ALL data prior to the display range
        const baseCount = appState.data
            .filter(d => d.genre === genre && d.year < minYear)
            .length;

        let cumulativeCount = baseCount;

        // Create values for ALL years in the range, even if no songs
        const values = allYears.map(year => {
            const yearData = yearGenreData.get(year) || new Map();
            const yearCount = yearData.get(genre) || 0;
            cumulativeCount += yearCount; // Add to cumulative total
            return {
                year: year,
                count: cumulativeCount // Use cumulative (will stay flat if no new songs)
            };
        });

        return {
            genre: genre,
            values: values
        };
    });

    // Escalas
    timelineXScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, width]);

    const maxCount = d3.max(genreData, g => d3.max(g.values, v => v.count));

    timelineYScale = d3.scaleLinear()
        .domain([0, maxCount * 1.1])
        .range([height, 0]);

    // Fundo escuro
    timelineSvg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#1A1A1A')
        .attr('opacity', 0.3);

    // Grid horizontal
    timelineSvg.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.15)
        .call(d3.axisLeft(timelineYScale)
            .tickSize(-width)
            .tickFormat(''))
        .selectAll('line')
        .style('stroke', '#444');

    // Eixo X
    // Calculate number of ticks based on year span to avoid duplicates
    const yearSpan = maxYear - minYear;
    const numTicks = Math.min(yearSpan, 12);

    timelineSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(timelineXScale)
            .tickFormat(d3.format('d'))
            .ticks(numTicks))
        .selectAll('text')
        .style('fill', '#B3B3B3')
        .style('font-size', '13px');

    // Eixo Y
    timelineSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(timelineYScale)
            .ticks(10))
        .selectAll('text')
        .style('fill', '#B3B3B3')
        .style('font-size', '13px');

    // Labels dos eixos
    timelineSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 50)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Year');

    timelineSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -50)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Number of Songs');

    // Gerador de linhas
    const line = d3.line()
        .x(d => timelineXScale(d.year))
        .y(d => timelineYScale(d.count))
        .curve(d3.curveMonotoneX);

    // Desenhar LINHAS para cada género
    genreData.forEach((g, index) => {
        const color = getGenreColor(g.genre);

        // Linha
        const path = timelineSvg.append('path')
            .datum(g.values)
            .attr('class', `genre-line line-${index}`)
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 3)
            .attr('d', line)
            .style('opacity', 0.85)
            .style('cursor', 'pointer');

        // Animação de entrada
        const totalLength = path.node().getTotalLength();
        path
            .attr('stroke-dasharray', totalLength + ' ' + totalLength)
            .attr('stroke-dashoffset', totalLength)
            .transition()
            .duration(1200)
            .delay(index * 80)
            .attr('stroke-dashoffset', 0);

        // Pontos interativos (invisíveis por defeito)
        const points = timelineSvg.selectAll(`.point-${index}`)
            .data(g.values)
            .enter()
            .append('circle')
            .attr('class', `point-${index}`)
            .attr('cx', d => timelineXScale(d.year))
            .attr('cy', d => timelineYScale(d.count))
            .attr('r', 4)
            .attr('fill', color)
            .attr('stroke', '#1A1A1A')
            .attr('stroke-width', 2)
            .style('opacity', 0)
            .style('cursor', 'pointer');

        // HOVER NA LINHA (mostra pontos)
        path.on('mouseover', function () {
            d3.select(this)
                .style('opacity', 1)
                .attr('stroke-width', 5);

            d3.selectAll('.genre-line').style('opacity', 0.2);
            d3.select(this).style('opacity', 1);

            // MOSTRAR pontos
            timelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);

            d3.select(`.legend-item-${g.genre.replace(/\s+/g, '-')}`)
                .select('text')
                .style('font-weight', 'bold');
        })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('stroke-width', 3);

                d3.selectAll('.genre-line')
                    .style('opacity', 0.85);

                // ESCONDER pontos
                timelineSvg.selectAll(`.point-${index}`)
                    .style('opacity', 0);

                d3.selectAll('.legend-item text')
                    .style('font-weight', '500');
            });

        // HOVER NOS PONTOS (tooltip)
        points.on('mouseover', function (event, d) {
            d3.select(this)
                .style('opacity', 1)
                .attr('r', 6);

            // Mostrar todos os pontos da linha
            timelineSvg.selectAll(`.point-${index}`)
                .style('opacity', 1);

            d3.selectAll('.timeline-tooltip').remove();

            d3.select('body').append('div')
                .attr('class', 'timeline-tooltip')
                .style('position', 'absolute')
                .style('background', '#1A1A1A')
                .style('color', '#EDEDED')
                .style('padding', '12px 16px')
                .style('border', `2px solid ${color}`)
                .style('border-radius', '8px')
                .style('pointer-events', 'none')
                .style('font-size', '13px')
                .style('box-shadow', '0 6px 16px rgba(0,0,0,0.7)')
                .style('z-index', 1000)
                .html(`
                    <div style="font-weight: bold; color: ${color}; margin-bottom: 6px; font-size: 14px;">${g.genre}</div>
                    <div><strong>Year:</strong> ${d.year}</div>
                    <div><strong>Songs:</strong> ${d.count}</div>
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 15) + 'px');
        })
            .on('mouseout', function () {
                d3.select(this)
                    .style('opacity', 0)
                    .attr('r', 4);

                d3.selectAll('.timeline-tooltip').remove();
            });
    });

    // Legenda com hover highlight
    const legend = timelineSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 20}, ${height / 2 - (genreData.length * 25) / 2})`);

    legend.append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('fill', '#1DB954')
        .style('font-size', '13px')
        .style('font-weight', 'bold')
        .text('Genres:');

    genreData.forEach((g, i) => {
        const genre = g.genre;
        const genreId = genre.replace(/\s+/g, '-');

        const legendRow = legend.append('g')
            .attr('class', `legend-item legend-item-${genreId}`)
            .attr('transform', `translate(0, ${i * 25})`)
            .style('cursor', 'default')
            .on('mouseover', function () {
                // Highlight this genre's line
                d3.select(`.line-${i}`)
                    .attr('stroke-width', 5)
                    .style('opacity', 1);

                // Dim all other lines
                d3.selectAll('.genre-line').style('opacity', 0.2);
                d3.select(`.line-${i}`).style('opacity', 1);

                // Show points for this genre
                timelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 1);

                // Bold the legend text
                d3.select(this).select('text')
                    .style('font-weight', 'bold');
            })
            .on('mouseout', function () {
                // Reset all lines to normal
                d3.selectAll('.genre-line')
                    .attr('stroke-width', 3)
                    .style('opacity', 0.85);

                // Hide points
                timelineSvg.selectAll(`.point-${i}`)
                    .style('opacity', 0);

                // Reset legend text
                d3.select(this).select('text')
                    .style('font-weight', '500');
            });

        // Linha da legenda
        legendRow.append('line')
            .attr('x1', 0)
            .attr('x2', 25)
            .attr('y1', 9)
            .attr('y2', 9)
            .attr('stroke', getGenreColor(genre))
            .attr('stroke-width', 3);

        // Texto
        legendRow.append('text')
            .attr('x', 30)
            .attr('y', 13)
            .attr('fill', '#EDEDED')
            .style('font-size', '13px')
            .style('font-weight', '500')
            .text(genre);
    });
}

function updateTimeline() {
    createTimeline();
}

// Handle resize
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimerTimeline);
    window.resizeTimerTimeline = setTimeout(() => {
        if (document.getElementById('timeline').offsetParent) {
            createTimeline();
        }
    }, 250);
});
