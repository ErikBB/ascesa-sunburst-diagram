function drawViz(data) {
  const container = document.getElementById('sunburst');
  container.innerHTML = ''; // Clear on redraw

  const width = 500;
  const radius = width / 2;

  const d3data = {
    name: "root",
    children: buildHierarchy(data)
  };

  const root = d3.hierarchy(d3data).sum(d => d.size);

  d3.partition().size([2 * Math.PI, radius])(root);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", width)
    .append("g")
    .attr("transform", `translate(${width / 2},${width / 2})`);

  svg.selectAll("path")
    .data(root.descendants())
    .enter().append("path")
    .attr("d", arc)
    .style("fill", d => d.depth === 0 ? "#fff" : `hsl(${Math.random() * 360},70%,70%)`)
    .append("title")
    .text(d => `${d.data.name}: ${d.value}`);
}

function buildHierarchy(data) {
  const result = [];

  data.tables.DEFAULT.forEach(row => {
    const levels = row.dimensions;
    const value = row.metrics[0];

    let currentLevel = result;

    levels.forEach((level, i) => {
      let existingPath = currentLevel.find(d => d.name === level);

      if (!existingPath) {
        existingPath = { name: level };
        if (i < levels.length - 1) {
          existingPath.children = [];
        } else {
          existingPath.size = value;
        }
        currentLevel.push(existingPath);
      }

      if (existingPath.children) {
        currentLevel = existingPath.children;
      }
    });
  });

  return result;
}

// Only use dscc if it exists (Looker Studio)
(function () {
  try {
    if (typeof dscc !== "undefined" && dscc.subscribeToData) {
      dscc.subscribeToData(drawViz, { transform: dscc.tableTransform });
    } else {
      throw new Error("dscc not found, using mock data");
    }
  } catch (e) {
    console.warn("Using mock data:", e.message);
    const mockData = {
      tables: {
        DEFAULT: [
          { dimensions: ["Europe", "Norway", "Oslo"], metrics: [10] },
          { dimensions: ["Europe", "Norway", "Bergen"], metrics: [5] },
          { dimensions: ["Europe", "Sweden", "Stockholm"], metrics: [8] },
          { dimensions: ["Asia", "Japan", "Tokyo"], metrics: [12] }
        ]
      }
    };
    drawViz(mockData);
  }
})();
