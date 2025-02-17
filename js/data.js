function onData(data, index) {
    // Create table object
    const table = {
        index: index,
        name: fileNames[index],
        data: data,
        position: {
            "top": (200 + 150 * index) + "px",
            "left": (100 + 150 * index) + "px",
            "z-index": 0
        },
        sortOrder: 0,
        sortColumn: null,
        resizeMode: "both",
        pin: false
    };

    // Extract column keys
    table.keys = Object.keys(data[0]);

    // Initialize numeric values and ranges
    table.numericValues = {};
    table.minVal = {};
    table.maxVal = {};
    table.columnMeans = {};

    // Process each column
    table.keys.forEach(column => {
        // Get numeric values for this column
        const values = data.map(row => {
            const val = row[column];
            if (!isNaN(parseFloat(val))) {
                return parseFloat(val);
            } else if (categoricalMappings[column]?.[val] !== undefined) {
                return categoricalMappings[column][val];
            }
            return NaN;
        }).filter(val => !isNaN(val));

        // Store numeric values
        table.numericValues[column] = values;

        // Update min/max values
        if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);

            // Update table min/max
            table.minVal[column] = min;
            table.maxVal[column] = max;

            // Update global min/max
            if (globalMin[column] === undefined || min < globalMin[column]) {
                globalMin[column] = min;
            }
            if (globalMax[column] === undefined || max > globalMax[column]) {
                globalMax[column] = max;
            }
        }

        // Handle categorical values
        if (values.length < data.length) {
            const categories = [...new Set(data.map(row => row[column]))];
            if (!categoricalMappings[column]) {
                categoricalMappings[column] = {};
                categories.forEach(cat => {
                    if (cat !== undefined && cat !== null) {
                        categoricalMappings[column][cat] = 0;
                    }
                });
            }
        }
    });

    // Initialize Score column
    table.minVal["Score"] = 0;
    table.maxVal["Score"] = 0;
    if (globalMin["Score"] === undefined) globalMin["Score"] = 0;
    if (globalMax["Score"] === undefined) globalMax["Score"] = 0;

    // Add table to list
    tableList.push(table);

    // Set initial ideal values if not set
    table.keys.forEach(column => {
        if (idealValues[column] === undefined) {
            idealValues[column] = table.minVal[column];
        }
    });
}

function resetState() {
    tableList = [];
    priorities = {};
    idealValues = {};
    includedColumns = {};
    categoricalMappings = {};
    globalMin = {};
    globalMax = {};

    activateHistograms = true;
    activateColors = true;
    activateBars = true;
    activateOpacity = true;
    activatePriority = true;
    activateScores = true;
    activateTOffPriorityMode = true;

    colorMetric = "Distance";
    barsMetric = "Priority";
    opacityMetric = "Priority";
    histBinFunction = "sturges";
} 