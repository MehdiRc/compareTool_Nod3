document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById("csvFile");

    fileInput.addEventListener("change", async function () {
        try {
            const files = this.files;
            const csvFiles = Array.from(files).filter(file => file.name.endsWith('.csv'));
            const jsonFile = Array.from(files).filter(file => file.name.endsWith('.json'));

            // Update fileNames global variable
            fileNames.length = 0;
            fileNames.push(...csvFiles.map(file => file.name));

            // Load CSV files
            const texts = await readFiles(csvFiles);
            if (texts.length === 0) {
                alert("No CSV files selected");
                return;
            }

            // Process CSV data
            load(texts);

            // Load state if JSON file is present
            if (jsonFile.length === 1) {
                const stateTexts = await readFiles(jsonFile);
                loadState(stateTexts[0]);
            } else if (jsonFile.length > 1) {
                alert("Only one state JSON can be loaded at a time\nJSON files will be ignored");
            }

            // Update file input visibility
            fileInput.style.display = restrictedMode ? "none" : "block";

            // Store files for hot reload
            localStorage.setItem('files', JSON.stringify(texts));
        } catch (error) {
            console.error("Error loading files:", error);
            alert("Error loading files. Please check the console for details.");
        }
    });

    // Hot reload functionality
    const params = new URLSearchParams(document.location.search);
    const hotreload = params.get('hotreload');
    if (hotreload && localStorage.getItem('files')) {
        load(JSON.parse(localStorage.getItem('files')));
    }
});

function load(texts) {
    // Initialize state
    resetState();
    
    // Remove existing elements except file input
    const elements = document.body.querySelectorAll('*:not(input[type="file"])');
    elements.forEach(element => element.remove());
    
    // Process data
    texts.forEach((text, i) => {
        // Parse CSV using custom function or a CSV library
        const data = parseCSV(text);
        onData(data, i);
    });

    // Create UI elements first
    createUI();
    
    // Update UI to reflect current state
    updateUI();
    
    // Create tables
    tableList.forEach(createDataTable);
}

function parseCSV(text) {
    // Simple CSV parser (you might want to use a more robust solution)
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, j) => {
            row[header] = values[j];
        });
        data.push(row);
    }
    
    return data;
}

async function readFiles(files) {
    const promises = Array.from(files).map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(e);
            reader.readAsText(file);
        });
    });
    
    return Promise.all(promises);
} 