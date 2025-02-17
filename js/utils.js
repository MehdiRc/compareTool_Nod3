// Global state variables
let activateHistograms = true;
let activateColors = true;
let colorMetric = "Distance";
let activateBars = true;
let barsMetric = "Priority";
let activateOpacity = true;
let opacityMetric = "Priority";
let activatePriority = true;
let activateScores = true;
let activateTOffPriorityMode = true;
let restrictedMode = false;
let histBinFunction = "sturges";
let resizeFunction;

// Global data structures
let priorities = {};
let idealValues = {};
let includedColumns = {};
let categoricalMappings = {};
let globalMin = {};
let globalMax = {};
let minRangeValues = {};
let maxRangeValues = {};
let tableList = [];
let fileNames = [];

// Helper functions
function isEqual(objA, objB) {
    const objAKeys = Object.keys(objA);
    const objBKeys = Object.keys(objB);
    if (objAKeys.length !== objBKeys.length) return false;
    for (let key of objAKeys) {
        if (objA[key] !== objB[key]) return false;
    }
    return true;
}

function defaultCategoricalMapping(column) {
    const categories = [...new Set(tableList[0].data.map(row => row[column]))];
    const mapping = {};
    categories.forEach(cat => mapping[cat] = 0);
    return mapping;
}

async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(e) {
            reject(new Error("File reading failed"));
        };
        reader.readAsText(file);
    });
}

async function readFiles(files) {
    const texts = [];
    for (let i = 0; i < files.length; i++) {
        texts.push(await readFile(files[i]));
    }
    return texts;
} 