let scatterSvg, scatterXScale, scatterYScale, scatterRadiusScale;

function createScatterplot() {
    const container = document.getElementById('scatterplot');
    const containerRect = container.getBoundingClientRect();

    // Use container dimensions or defaults
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = (containerRect.width || 800) - margin.left - margin.right;
    const height = (containerRect.height || 500) - margin.top - margin.bottom;

    // Clear existing SVG if any
    d3.select('#scatterplot').selectAll('*').remove();

    scatterSvg = d3.select('#scatterplot')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    scatterXScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);

    scatterYScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

    // Radius Scale - Normalized for better contrast
    // Find min/max popularity in the full dataset to keep scale consistent
    const minPop = d3.min(appState.data, d => d.popularity) || 0;
    const maxPop = d3.max(appState.data, d => d.popularity) || 100;

    scatterRadiusScale = d3.scalePow()
        .exponent(7)
        .domain([minPop, maxPop])
        .range([3, 12]);


    // Eixos
    scatterSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(scatterXScale).ticks(10));

    scatterSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(scatterYScale).ticks(10));

    // Grid lines
    scatterSvg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(scatterXScale)
            .tickSize(-height)
            .tickFormat('')
        )
        .attr('opacity', 0.1);

    scatterSvg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(scatterYScale)
            .tickSize(-width)
            .tickFormat('')
        )
        .attr('opacity', 0.1);

    // Labels
    scatterSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Danceability');

    scatterSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#EDEDED')
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', '600')
        .text('Energy');

    // Add bubble size legend
    scatterSvg.append('text')
        .attr('x', width - 10)
        .attr('y', 15)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('font-style', 'italic')
        .text('Bubble size = Popularity');

    updateScatterplot();
}

function updateScatterplot() {
    if (!scatterSvg) return;

    const tooltip = d3.select('#scatter-tooltip');

    // Bind data
    const circles = scatterSvg.selectAll('circle')
        .data(appState.filteredData, d => d.id);

    // Enter
    circles.enter()
        .append('circle')
        .attr('cx', d => scatterXScale(d.danceability))
        .attr('cy', d => scatterYScale(d.energy))
        .attr('r', 0)
        .attr('fill', d => genreColors[d.genre] || '#888')
        .attr('opacity', 0.7)
        .attr('stroke', '#000')
        .attr('stroke-width', 0.5)
        .on('mouseover', function (event, d) {
            d3.select(this)
                .attr('opacity', 1)
                .attr('stroke', '#fff')
                .attr('stroke-width', 2)
                .transition().duration(200)
                .attr('r', d => scatterRadiusScale(d.popularity) * 1.5);

            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${d.name}</strong>
                    <div style="margin-top:4px; color:#ccc; font-size:12px;">
                    Artist: <span style="color:#fff">${d.artist}</span><br>
                    Year: <span style="color:#fff">${d.year}</span><br>
                    Genre: <span style="color:#fff">${d.genre}</span><br>
                    Popularity: <span style="color:#1DB954">${d.popularity}</span>
                    </div>
                `)
                .style('left', (event.pageX) + 'px')
                .style('top', (event.pageY) + 'px');
        })
        .on('mousemove', function (event) {
            tooltip
                .style('left', (event.pageX + 5) + 'px')
                .style('top', (event.pageY + 5) + 'px');
        })
        .on('mouseout', function (event, d) {
            d3.select(this)
                .attr('opacity', 0.7)
                .attr('stroke', '#000')
                .attr('stroke-width', 0.5)
                .transition().duration(200)
                .attr('r', d => scatterRadiusScale(d.popularity));

            tooltip.style('opacity', 0);
        })
        .transition()
        .duration(800)
        .attr('r', d => scatterRadiusScale(d.popularity));

    // Update
    circles
        .transition()
        .duration(800)
        .attr('cx', d => scatterXScale(d.danceability))
        .attr('cy', d => scatterYScale(d.energy))
        .attr('fill', d => genreColors[d.genre] || '#888')
        .attr('r', d => scatterRadiusScale(d.popularity));

    circles.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();
}

// Handle resize
window.addEventListener('resize', () => {
    // Debounce resize
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        if (document.getElementById('scatterplot').offsetParent) { // Only if visible
            createScatterplot();
        }
    }, 250);
});
