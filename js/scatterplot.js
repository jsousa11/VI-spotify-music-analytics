let scatterSvg, scatterXScale, scatterYScale;

function createScatterplot() {
    const margin = {top: 20, right: 20, bottom: 50, left: 60};
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    scatterSvg = d3.select('#scatterplot')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Escalas
    scatterXScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, width]);
    
    scatterYScale = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);
    
    // Eixos
    scatterSvg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(scatterXScale));
    
    scatterSvg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(scatterYScale));
    
    // Labels
    scatterSvg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .text('Danceability');
    
    scatterSvg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -45)
        .attr('fill', '#B3B3B3')
        .attr('text-anchor', 'middle')
        .text('Energy');
    
    updateScatterplot();
}

function updateScatterplot() {
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
        .attr('opacity', 0.6)
        .on('mouseover', function(event, d) {
            d3.select(this).attr('opacity', 1).attr('r', 8);
            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>${d.name}</strong><br>
                    Artist: ${d.artist}<br>
                    Year: ${d.year}<br>
                    Genre: ${d.genre}<br>
                    Popularity: ${d.popularity}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this).attr('opacity', 0.6).attr('r', 5);
            tooltip.style('opacity', 0);
        })
        .transition()
        .duration(500)
        .attr('r', d => Math.sqrt(d.popularity) / 2);
    
    // Update
    circles
        .transition()
        .duration(500)
        .attr('cx', d => scatterXScale(d.danceability))
        .attr('cy', d => scatterYScale(d.energy))
        .attr('fill', d => genreColors[d.genre] || '#888');
    
    circles.exit()
        .transition()
        .duration(300)
        .attr('r', 0)
        .remove();
}
