function createMappingTable(column, tableList) {
    d3.select("#mappingTable").remove();

    const mappingTable = d3.select("body").append("table")
        .attr("id", "mappingTable");
    const mappingThead = mappingTable.append("thead");
    const mappingTbody = mappingTable.append("tbody");

    // Get unique values
    const allValues = tableList.reduce((acc, table) => 
        acc.concat(table.data.map(row => row[column])), []);
    const uniqueValues = [...new Set(allValues)];

    // Create headers
    mappingThead.append("tr")
        .selectAll("th")
        .data([column, "Score"])
        .enter()
        .append("th")
        .text(d => d);

    // Create rows
    const rows = mappingTbody.selectAll("tr")
        .data(uniqueValues)
        .enter()
        .append("tr");

    // Add value cells
    rows.append("td")
        .text(d => d);

    // Add slider cells
    rows.append("td")
        .each(function(value) {
            d3.select(this).append("input")
                .attr("type", "range")
                .attr("min", -100)
                .attr("max", 100)
                .attr("value", categoricalMappings[column]?.[value] ?? 0)
                .on("input", function() {
                    if (!categoricalMappings[column]) {
                        categoricalMappings[column] = {};
                    }
                    categoricalMappings[column][value] = +this.value;
                    this.nextSibling.textContent = this.value;
                    updateAllTables();
                });

            d3.select(this).append("span")
                .text(categoricalMappings[column]?.[value] ?? 0);
        });
} 