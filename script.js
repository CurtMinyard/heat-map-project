const url = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

d3.json(url).then(data => {
  const baseTemp = data.baseTemperature;
  const dataset = data.monthlyVariance;
  drawHeatMap(dataset, baseTemp);
});

function drawHeatMap(dataset, baseTemp) {
  const margin = { top: 100, right: 40, bottom: 100, left: 100 };
  const width = 1200 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#heatmap")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const years = dataset.map(d => d.year);
  const months = Array.from({ length: 12 }, (_, i) => i);

  const xScale = d3.scaleBand()
    .domain([...new Set(years)])
    .range([0, width])
    .padding(0);

  const yScale = d3.scaleBand()
    .domain(months)
    .range([0, height])
    .padding(0);

  const temps = dataset.map(d => baseTemp + d.variance);
  const colorScale = d3.scaleQuantize()
    .domain([d3.min(temps), d3.max(temps)])
    .range(d3.schemeRdYlBu[9].reverse());

  drawAxes(svg, xScale, yScale, width, height);
  drawCells(svg, dataset, xScale, yScale, colorScale, baseTemp);
  drawLegend(svg, colorScale, width, height);
}

function drawAxes(svg, xScale, yScale, width, height) {
  const xAxis = d3.axisBottom(xScale)
    .tickValues(xScale.domain().filter(year => year % 10 === 0))
    .tickFormat(d3.format("d"));

  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(month => monthNames[month]);

  svg.append("g")
    .attr("id", "y-axis")
    .call(yAxis);
}

function drawCells(svg, dataset, xScale, yScale, colorScale, baseTemp) {
  svg.selectAll("rect")
    .data(dataset)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("data-month", d => d.month - 1)
    .attr("data-year", d => d.year)
    .attr("data-temp", d => baseTemp + d.variance)
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.month - 1))
    .attr("width", xScale.bandwidth())
    .attr("height", yScale.bandwidth())
    .attr("fill", d => colorScale(baseTemp + d.variance))
    .on("mouseover", function (event, d) {
      const temp = (baseTemp + d.variance).toFixed(2);
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      d3.select("#tooltip")
        .style("opacity", 0.9)
        .attr("data-year", d.year)
        .html(`
          <strong>${d.year} - ${monthNames[d.month - 1]}</strong><br>
          Temp: ${temp}℃<br>
          Variance: ${d.variance.toFixed(2)}℃
        `)
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 40 + "px");
    })
    .on("mouseout", () => {
      d3.select("#tooltip").style("opacity", 0);
    });
}

function drawLegend(svg, colorScale, width, height) {
  const legendWidth = 400;
  const legendHeight = 30;
  const legendRectWidth = legendWidth / colorScale.range().length;

  const legend = svg.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${(width - legendWidth) / 2}, ${height + 50})`);

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickSize(13)
    .tickValues(colorScale.thresholds())
    .tickFormat(d3.format(".1f"));

  legend.selectAll("rect")
    .data(colorScale.range())
    .enter()
    .append("rect")
    .attr("x", (_, i) => i * legendRectWidth)
    .attr("y", 0)
    .attr("width", legendRectWidth)
    .attr("height", legendHeight)
    .attr("fill", d => d);

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis);
}
