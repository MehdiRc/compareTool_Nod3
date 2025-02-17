const colorScale = (value) => {
    // Use the same colors as in Oldindex.html
    if (value === 1) return 'rgb(0, 128, 0)';  // Dark green
    if (value === 0) return 'rgb(255, 0, 0)';  // Pure red
    
    // Interpolate between red and green through white
    if (value <= 0.5) {
        // Red to white
        const r = 255;
        const g = Math.round(255 * (value * 2));
        const b = Math.round(255 * (value * 2));
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // White to green
        const factor = (value - 0.5) * 2;
        const r = Math.round(255 * (1 - factor));
        const g = Math.round(128 * factor + 255 * (1 - factor));
        const b = Math.round(255 * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
};

function updateColors(table) {
    // Update progress bar colors
    table.dataTbody.querySelectorAll('.progress-bar').forEach(bar => {
        const cell = bar.closest('td');
        const data = {
            column: cell.dataset.column,
            value: cell.dataset.value
        };

        if (!activateColors && !activateBars) {
            bar.style.backgroundColor = null;
        } else if (!activateColors && activateBars) {
            bar.style.backgroundColor = "Silver";
        } else {
            bar.style.backgroundColor = calculateColor(data, table);
        }
    });

    // Update progress bar widths
    if (activateBars) {
        updateBars(table);
    } else {
        table.dataTbody.querySelectorAll('.progress-bar').forEach(bar => {
            bar.style.width = "100%";
        });
    }

    // Update cell opacity
    updateOpacity(table);

    // Update score colors
    updateScoreColors(table);

    // Update mean row colors
    updateMeanColors(table);

    // Update histogram colors
    if (activateHistograms) {
        updateHistogramColors(table);
    }
}

function calculateColor(d, table) {
    if (isNaN(parseFloat(d.value)) && includedColumns[d.column]) {
        return calculateCategoricalColor(d);
    }
    return calculateNumericalColor(d);
}

function calculateCategoricalColor(d) {
    if (!categoricalMappings[d.column] || categoricalMappings[d.column][d.value] === undefined) {
        return null;
    }

    const mappedValue = categoricalMappings[d.column][d.value];
    const distance = Math.abs(mappedValue - 100);
    const maxDistance = 200;

    switch (colorMetric) {
        case "Distance":
            return colorScale(1 - distance / maxDistance);
        case "Priority":
            return colorScale(priorities[d.column]/100);
        case "DistanceXPriority":
            return colorScale(1 - ((distance/maxDistance)*priorities[d.column])/100);
        default:
            return null;
    }
}

function calculateNumericalColor(d) {
    if (!includedColumns[d.column] || d.column === "Score") {
        return null;
    }

    const value = parseFloat(d.value);
    if (isNaN(value)) return null;

    const distance = Math.abs(value - idealValues[d.column]);
    const maxDistance = Math.max(
        Math.abs(globalMax[d.column] - idealValues[d.column]),
        Math.abs(globalMin[d.column] - idealValues[d.column])
    );

    switch (colorMetric) {
        case "Distance":
            return colorScale(maxDistance !== 0 ? 1 - distance / maxDistance : 0);
        case "Priority":
            return colorScale(priorities[d.column]/100);
        case "DistanceXPriority":
            return colorScale(maxDistance !== 0 ? 
                1 - ((distance/maxDistance)*priorities[d.column])/100 : 0);
        default:
            return null;
    }
}

function updateHistogramColors(table) {
    if (!activateHistograms || !table.histogramRow) return;

    // Get all histogram cells for THIS table's thead
    const histogramCells = table.dataThead.querySelectorAll('[id^="hist"]');

    // Update each histogram
    table.keys.concat(["Score"]).forEach((columnName, i) => {
        const cell = table.dataThead.querySelector(`#hist${i}`);
        if (!cell) return;

        const bars = cell.querySelectorAll('rect.data');
        bars.forEach(bar => {
            const d = {
                x0: parseFloat(bar.dataset.x0),
                x1: parseFloat(bar.dataset.x1)
            };

            if (!activateColors) {
                bar.style.fill = "steelblue";
            } else {
                const midpoint = (d.x0 + d.x1) / 2;
                if (columnName === "Score") {
                    const distance = Math.abs(midpoint - 1);
                    const t = distance;
                    bar.style.fill = t < 0.5 ? 
                        interpolateColor('green', 'white', t * 2) : 
                        interpolateColor('white', 'red', (t - 0.5) * 2);
                } else {
                    const distance = Math.abs(midpoint - idealValues[columnName]);
                    const maxDistance = Math.abs(globalMax[columnName] - globalMin[columnName]);
                    const scaledDistance = maxDistance !== 0 ? distance / maxDistance : 1;
                    bar.style.fill = scaledDistance <= 0.5 ?
                        interpolateColor('green', 'white', scaledDistance * 2) :
                        interpolateColor('white', 'red', (scaledDistance - 0.5) * 2);
                }
            }
        });

        // Update cursor visibility
        if (columnName !== "Score") {
            const cursors = cell.querySelectorAll('.ideal-cursor, .ideal-cursor-arrow');
            cursors.forEach(cursor => {
                cursor.style.opacity = activateColors ? 1 : 0.3;
            });
        }
    });
}

function interpolateColor(color1, color2, factor) {
    // Handle special case for green-white-red scale
    if (color1 === 'green' && color2 === 'white') {
        const r = Math.round(255 * factor);
        const g = Math.round(128 + (255 - 128) * factor);
        const b = Math.round(255 * factor);
        return `rgb(${r}, ${g}, ${b})`;
    }
    if (color1 === 'white' && color2 === 'red') {
        const r = 255;
        const g = Math.round(255 * (1 - factor));
        const b = Math.round(255 * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }

    // For other colors, use the existing logic
    const rgb1 = parseColor(color1);
    const rgb2 = parseColor(color2);
    
    const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * factor);
    const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * factor);
    const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
}

function parseColor(color) {
    // Handle named colors with the correct values
    if (color === 'red') return [255, 0, 0];
    if (color === 'green') return [0, 128, 0];  // Dark green
    if (color === 'white') return [255, 255, 255];
    if (color === 'steelblue') return [70, 130, 180];
    
    // Handle rgb strings
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    
    return [0, 0, 0]; // Default to black
}

function updateBars(table) {
    table.dataTbody.querySelectorAll('.progress-bar').forEach(bar => {
        const cell = bar.closest('td');
        const data = {
            column: cell.dataset.column,
            value: cell.dataset.value
        };

        if (!includedColumns[data.column]) {
            bar.style.width = "0%";
        } else if (data.column === "Score") {
            bar.style.width = "100%";
        } else {
            let result;
            if (isNaN(parseFloat(data.value))) {
                // Categorical bars
                // Check if mapping exists for this column and value
                if (!categoricalMappings[data.column] || 
                    categoricalMappings[data.column][data.value] === undefined) {
                    bar.style.width = "0%";
                    return;
                }

                const idealValue = 100;
                const distance = Math.abs(categoricalMappings[data.column][data.value] - idealValue);
                const maxDistance = 200;

                switch (barsMetric) {
                    case "Distance":
                        result = maxDistance !== 0 ? (1 - distance / maxDistance)*100 : 0;
                        break;
                    case "Priority":
                        result = priorities[data.column];
                        break;
                    case "DistanceXPriority":
                        result = maxDistance !== 0 ? 
                            (((1-distance/maxDistance)*priorities[data.column])/100) * 100 : 100;
                        break;
                    default:
                        result = 0;
                }
            } else {
                // Numerical bars
                const value = parseFloat(data.value);
                const distance = Math.abs(value - idealValues[data.column]);
                const maxDistance = Math.max(
                    Math.abs(globalMax[data.column] - idealValues[data.column]),
                    Math.abs(globalMin[data.column] - idealValues[data.column])
                );

                switch (barsMetric) {
                    case "Distance":
                        result = maxDistance !== 0 ? (1 - distance / maxDistance)*100 : 0;
                        break;
                    case "Priority":
                        result = priorities[data.column];
                        break;
                    case "DistanceXPriority":
                        result = maxDistance !== 0 ? 
                            (((1-distance/maxDistance)*priorities[data.column])/100) * 100 : 100;
                        break;
                    default:
                        result = 0;
                }
            }
            bar.style.width = result + "%";
        }
    });
}

function updateOpacity(table) {
    if (!activateOpacity) {
        // When opacity is deactivated, set all progress bars to full opacity
        table.dataTbody.querySelectorAll('.progress-bar').forEach(bar => {
            bar.style.opacity = 1; // Full opacity when deactivated
        });
        return;
    }

    table.dataTbody.querySelectorAll('td').forEach(td => {
        const progressBar = td.querySelector('.progress-bar');
        if (!progressBar) return;

        const data = {
            column: td.dataset.column,
            value: td.dataset.value
        };

        if (data.column === "Score") {
            progressBar.style.opacity = 0.3;
            return;
        }

        if (!includedColumns[data.column]) {
            progressBar.style.opacity = 0.1; // Very transparent for non-included columns
            return;
        }

        let distance, maxDistance;
        if (isNaN(parseFloat(data.value))) {
            // Check if mapping exists for this column and value
            if (!categoricalMappings[data.column] || 
                categoricalMappings[data.column][data.value] === undefined) {
                progressBar.style.opacity = 0.1;
                return;
            }

            // Categorical opacity
            const idealValue = 100;
            distance = Math.abs(categoricalMappings[data.column][data.value] - idealValue);
            maxDistance = 200;
        } else {
            // Numerical opacity
            const value = parseFloat(data.value);
            distance = Math.abs(value - idealValues[data.column]);
            maxDistance = Math.max(
                Math.abs(globalMax[data.column] - idealValues[data.column]),
                Math.abs(globalMin[data.column] - idealValues[data.column])
            );
        }

        let result;
        switch (opacityMetric) {
            case "Distance":
                result = maxDistance !== 0 ? 0.75 * (1 - distance / maxDistance) + 0.25 : 0.25;
                break;
            case "Priority":
                result = 0.75 * (priorities[data.column] / 100) + 0.25;
                break;
            case "DistanceXPriority":
                result = maxDistance !== 0 ? 
                    0.75 * (1 - ((distance/maxDistance)*priorities[data.column])/100) + 0.25 : 0.25;
                break;
            default:
                result = 0.25;
        }
        progressBar.style.opacity = result;
    });
}

function updateScoreColors(table) {
    if (!activateColors) {
        table.dataTbody.querySelectorAll("td").forEach(td => {
            if (td.cellIndex === td.parentNode.cells.length - 1) {
                td.style.backgroundColor = null;
            }
        });
        return;
    }

    table.dataTbody.querySelectorAll("td").forEach(td => {
        if (td.cellIndex === td.parentNode.cells.length - 1) {
            td.style.backgroundColor = colorScale(parseFloat(td.dataset.value));
        }
    });
}

function updateMeanColors(table) {
    if (!activateColors) {
        table.dataTbody.querySelectorAll("tr.mean-row td").forEach(td => {
            td.style.backgroundColor = null;
        });
        return;
    }

    table.dataTbody.querySelectorAll("tr.mean-row td").forEach((td, i) => {
        const column = table.keys.concat(["Score"])[i];
        if (column === "Score" && !isNaN(parseFloat(td.dataset.value))) {
            td.style.backgroundColor = colorScale(parseFloat(td.dataset.value));
        } else if (includedColumns[column] && !isNaN(parseFloat(td.dataset.value))) {
            const distance = Math.abs(parseFloat(td.dataset.value) - idealValues[column]);
            const maxDistance = Math.max(
                Math.abs(globalMax[column] - idealValues[column]),
                Math.abs(globalMin[column] - idealValues[column])
            );
            td.style.backgroundColor = maxDistance !== 0 ? 
                colorScale(1 - distance / maxDistance) : 
                colorScale(0);
        }
    });
}

// ... Additional helper functions for numerical colors, bars, opacity, etc. 