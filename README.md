# Interactive Data Comparison Tool

A powerful web-based tool for visualizing, comparing, and analyzing tabular data with interactive features and real-time scoring.

## Features

- **Interactive Tables**
  - Drag and resize table windows
  - Sort columns
  - Pin tables to fixed positions
  - Collapsible table views
  - Mean value calculations

- **Dynamic Visualizations**
  - Color-coded cells based on data values
  - Progress bars for visual comparison
  - Interactive histograms with multiple binning methods
  - Opacity-based data emphasis
  - Customizable color schemes

- **Data Analysis**
  - Real-time scoring system
  - Priority-based weighting
  - Distance-based comparisons
  - Support for both numerical and categorical data
  - Mean value calculations per column

- **Customization Options**
  - Adjustable priorities per column
  - Customizable ideal values
  - Multiple visualization metrics (Distance, Priority, DistanceXPriority)
  - Histogram binning options (Sturges, Scott, Freedman-Diaconis)
  - Toggle various visualization features

- **State Management**
  - Save and load application states
  - Persistent settings
  - Hot reload capability

## Getting Started

1. Clone this repository
2. Open `index.html` in your web browser
3. Upload your CSV data files using the file input
4. Customize the visualization settings using the settings panel

## Usage

### Loading Data
- Use the file input to load one or more CSV files
- Optionally load a saved state JSON file to restore previous settings

### Customizing Views
- Use the settings panel to toggle various visualization features
- Adjust column priorities and ideal values using the slider controls
- Customize visualization metrics for colors, bars, and opacity

### Table Interactions
- Drag tables to reposition them
- Resize tables using the bottom-right corner handle
- Pin tables to fix their position
- Minimize tables to save space
- Sort data by clicking column headers

## Technical Details

The application is built with vanilla JavaScript and uses:
- D3.js for data visualization
- CSS Grid for layout
- Custom event handling for drag and resize operations
- Dynamic DOM manipulation for UI updates

## Browser Support

Supports modern browsers with ES6+ capabilities:
- Firefox (recommended)
- Chrome 
- Safari
- Edge

## License

This project is open source and available under the MIT License.
