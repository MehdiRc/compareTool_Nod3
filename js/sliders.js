function createSliderTable() {
    // Create table container
    const sliderTable = document.createElement('table');
    sliderTable.id = 'sliderTable';
    document.body.appendChild(sliderTable);

    // Create tbody
    const sliderTbody = document.createElement('tbody');
    sliderTable.appendChild(sliderTbody);

    // Create priority row
    const priorityRow = document.createElement('tr');
    sliderTbody.appendChild(priorityRow);

    // Create cells for each column
    Object.keys(tableList[0].data[0]).forEach(column => {
        const td = document.createElement('td');
        priorities[column] = 50;  // Initial priority value
        includedColumns[column] = false;

        // Create checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'checkbox' + column;
        checkbox.name = column;
        checkbox.addEventListener('change', function() {
            includedColumns[column] = this.checked;

            // Update slider state
            const slider = document.getElementById('prioritySlider' + column);
            if (slider) {
                slider.classList.toggle('disabled', !includedColumns[column]);
            }

            resetScoreMinMax();
            tableList.forEach(table => {
                updateScores(table);
                updateColors(table);
            });
        });
        td.appendChild(checkbox);

        // Create priority slider
        let updateScheduled = false;
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'prioritySlider' + column;
        slider.min = 0;
        slider.max = 100;
        slider.value = priorities[column];
        slider.addEventListener('input', function() {
            const newValue = parseFloat(this.value);
            this.nextElementSibling.textContent = restrictedMode ? 
                Math.floor(newValue) : 
                newValue.toFixed(2);
            
            priorities[column] = newValue;

            if (!updateScheduled) {
                updateScheduled = true;
                requestAnimationFrame(() => {
                    updateScheduled = false;
                    if (activateTOffPriorityMode) {
                        updateTOffPriorities(column);
                        updateSliderTable();
                    }
                    updateAllTables();
                });
            }
        });
        td.appendChild(slider);

        // Create value display
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = restrictedMode ? 
            Math.floor(priorities[column]) : 
            priorities[column].toFixed(2);
        td.appendChild(valueDisplay);

        priorityRow.appendChild(td);
    });

    // Create ideal value row
    const idealValueRow = document.createElement('tr');
    sliderTbody.appendChild(idealValueRow);

    // Create cells for ideal value sliders
    Object.keys(tableList[0].data[0]).forEach(column => {
        const td = document.createElement('td');
        const minVal = globalMin[column];
        const maxVal = globalMax[column];

        if (minVal !== undefined && maxVal !== undefined) {
            idealValues[column] = minVal;

            // Create ideal value slider
            let updateScheduled = false;
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = 'IdealSlider' + column;
            slider.min = minVal;
            slider.max = maxVal;
            slider.value = idealValues[column];
            slider.addEventListener('input', function() {
                this.nextElementSibling.textContent = this.value;
                idealValues[column] = parseFloat(this.value);

                if (!updateScheduled) {
                    updateScheduled = true;
                    requestAnimationFrame(() => {
                        updateScheduled = false;
                        updateAllTables();
                    });
                }
            });
            td.appendChild(slider);

            // Create value display
            const valueDisplay = document.createElement('span');
            valueDisplay.textContent = restrictedMode ? 
                Math.floor(idealValues[column]) : 
                idealValues[column].toFixed(2);
            td.appendChild(valueDisplay);
        }

        idealValueRow.appendChild(td);
    });
}

function updateTOffPriorities(changedColumn) {
    if (!activateTOffPriorityMode || !includedColumns[changedColumn]) return;

    // Get sum of all priorities except the changed one
    const otherColumns = Object.keys(includedColumns)
        .filter(col => includedColumns[col] && col !== changedColumn);
    
    const changedValue = priorities[changedColumn];
    const remainingTotal = 100 - changedValue;
    
    // Calculate sum of other priorities for normalization
    const otherSum = otherColumns.reduce((sum, col) => sum + priorities[col], 0);

    // Adjust other priorities proportionally
    if (otherSum > 0) {  // Only adjust if there are other active priorities
        otherColumns.forEach(col => {
            priorities[col] = (priorities[col] / otherSum) * remainingTotal;
        });
    } else if (otherColumns.length > 0) {  // If other columns exist but sum is 0
        const equalShare = remainingTotal / otherColumns.length;
        otherColumns.forEach(col => {
            priorities[col] = equalShare;
        });
    }
}

function updateAllTables() {
    resetScoreMinMax();
    tableList.forEach(table => {
        updateScores(table);
        updateColors(table);
        updateHistogram(table);
    });
}

function updateSliderTable() {
    // Update checkboxes
    for (const column in includedColumns) {
        const checkbox = document.getElementById(`checkbox${column}`);
        if (checkbox) {
            checkbox.checked = includedColumns[column];
        }
    }

    // Update priority sliders
    for (const column in priorities) {
        const slider = document.getElementById(`prioritySlider${column}`);
        if (slider) {
            slider.value = priorities[column];
            slider.nextElementSibling.textContent = restrictedMode ? 
                Math.floor(priorities[column]) : 
                priorities[column].toFixed(2);
        }
    }

    // Update ideal value sliders
    for (const column in idealValues) {
        const slider = document.getElementById(`IdealSlider${column}`);
        if (slider) {
            slider.value = idealValues[column];
            slider.nextElementSibling.textContent = restrictedMode ? 
                Math.floor(idealValues[column]) : 
                idealValues[column].toFixed(2);
        }
    }
}

function updateColumnState(tableList) {
    const rows = sliderTbody.getElementsByTagName("tr");
    for (let row of rows) {
        const cells = row.getElementsByTagName("td");
        for (let cell of cells) {
            const inputs = cell.getElementsByTagName("input");
            for (let input of inputs) {
                if (input.name === cell.dataset.column) {
                    input.classList.toggle("disabled", !includedColumns[input.name]);
                }
            }
        }
    }

    resetScoreMinMax();
    for (let i = 0; i < tableList.length; i++) {
        updateScores(tableList[i]);
        updateColors(tableList[i]);
        updateHistogram(tableList[i]);
    }
} 