function saveState() {
    const state = {
        // Save table data without visual elements
        tableList: tableList.map(table => ({
            index: table.index,
            name: table.name,
            data: table.data,
            position: table.position,
            sortOrder: table.sortOrder,
            sortColumn: table.sortColumn,
            resizeMode: table.resizeMode,
            pin: table.pin,
            keys: table.keys,
            minVal: table.minVal,
            maxVal: table.maxVal,
            numericValues: table.numericValues,
            columnMeans: table.columnMeans
        })),
        // Save settings state
        settings: {
            activateHistograms,
            activateColors,
            activateBars,
            activateOpacity,
            activatePriority,
            activateScores,
            activateTOffPriorityMode,
            colorMetric,
            barsMetric,
            opacityMetric,
            histBinFunction
        },
        // Save column configurations
        columns: {
            priorities,
            idealValues,
            includedColumns,
            categoricalMappings
        },
        // Save range values
        ranges: {
            globalMin,
            globalMax,
            minRangeValues,
            maxRangeValues
        },
        fileNames
    };

    const stateJSON = JSON.stringify(state);
    downloadState(stateJSON);
}

function downloadState(stateJSON) {
    const blob = new Blob([stateJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'state.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadState(stateJSON) {
    try {
        const state = JSON.parse(stateJSON);
        
        // Reset state first
        resetState();
        
        // Restore settings one by one
        Object.assign(window, state.settings);

        // Restore column configurations
        Object.assign(window, state.columns);

        // Restore ranges
        Object.assign(window, state.ranges);

        // Restore file names
        fileNames = [...state.fileNames];

        // Remove existing tables
        const existingTables = document.querySelectorAll('[id^="mydiv"]');
        existingTables.forEach(table => table.remove());
        
        // Clear tableList before restoring
        tableList = [];
        
        // Restore tables with deep copy
        state.tableList.forEach(tableData => {
            const table = {
                index: tableData.index,
                name: tableData.name,
                data: [...tableData.data],
                position: {...tableData.position},
                sortOrder: tableData.sortOrder,
                sortColumn: tableData.sortColumn,
                resizeMode: tableData.resizeMode,
                pin: tableData.pin,
                keys: [...tableData.keys],
                minVal: {...tableData.minVal},
                maxVal: {...tableData.maxVal},
                numericValues: {...tableData.numericValues},
                columnMeans: {...tableData.columnMeans}
            };
            
            // Add table to list
            tableList.push(table);
            
            // Create table
            createDataTable(table);
            
            // Restore sorting if needed
            if (table.sortColumn && table.sortOrder !== 0) {
                const columnIndex = table.keys.indexOf(table.sortColumn);
                const headerIndex = columnIndex === -1 ? 
                    table.keys.length : 
                    columnIndex;
                const header = document.querySelector(`#dataTable${table.index} th:nth-child(${headerIndex + 1})`);
                if (header) {
                    sortTable(table.sortColumn, header, table);
                }
            }
        });

        // Update UI to reflect loaded state
        updateUI();
        
        // Update slider table with loaded values
        updateSliderTable();
        
    } catch (error) {
        console.error("Error loading state:", error);
        alert("Error loading state file");
    }
}

function handleStateLoad(event) {
    if (!event) return;
    
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            loadState(e.target.result);
        };
        reader.readAsText(file);
    }
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