# Table Comparison Tool

This is the vanilla js version of my powerful interactive data comparison tool that allows users to visualize, analyze, and compare data across multiple tables.

![Table Comparison Tool](coverpicture.png)

## Overview

This tool enables users to load CSV or JSON data files and visualize them as interactive tables with advanced features like scoring, sorting, filtering, and color-coding. The tables are fully draggable and resizable, allowing for flexible arrangement and comparison of data sets.

## Features

- **Interactive Tables**: Drag, resize, and arrange multiple tables for easy comparison
- **Flexible Resizing**: Resize tables from any edge or corner (except top) like a file explorer window
- **Automatic Scoring**: Calculate scores based on ideal values and priorities
- **Data Visualization**: Color-coding based on data values relative to ideal values
- **Custom Sorting**: Sort tables by any column
- **Column Prioritization**: Assign priorities to columns for weighted scoring
- **Histograms**: Visualize data distribution across columns
- **Table Management**: Pin, minimize, or hide tables
- **State Saving**: Save and restore the current state of all tables and settings
- **Responsive Design**: Tables adapt to available space while maintaining minimum column widths

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server-side installation required

### Usage

1. Open `index.html` in your browser
2. Click the file input field to select CSV or JSON files for visualization
3. Multiple files can be selected at once
4. The tool will automatically create interactive tables for each file

## Working with Tables

### Table Manipulation

- **Drag**: Click and drag the header to move a table
- **Resize**: Drag any edge or corner (except the top) to resize
  - Bottom-right/left corner: Resize both width and height
  - Right/left edge: Resize width only
  - Bottom edge: Resize height only
- **Pin/Unpin**: Click the pin button (📌/📍) to lock/unlock a table's position and size
- **View Modes**:
  - Click 🗕 to minimize (hide the table content)
  - Click ⇲ to enable free resizing
  - Click ⛶ to enable proportional resizing

### Data Analysis

- **Sorting**: Click on any column header to sort the table (cycles through ascending, descending, original order)
- **Column Settings**: Use the sliders to set:
  - Priority: Importance of the column in score calculation
  - Ideal Value: The optimal value for that column
- **Color Coding**:
  - Green: Values close to the ideal
  - White: Moderate distance from ideal
  - Red: Far from the ideal value
- **Progress Bars**: Visual indicator of value relative to ideal
- **Mean Values**: The bottom row shows column averages

## Data Format

The tool accepts both CSV and JSON files. Each file should contain tabular data with consistent columns. The first row of CSVs should be the header row with column names.

Example CSV format:
```
Name,Value1,Value2,Value3
Item1,10,20,30
Item2,15,25,35
```

## Advanced Features

### Categorical Data

The tool can handle both numerical and categorical data. For categorical data, you can define mappings to assign numerical values for comparison.

### Customizable Metrics

Different metrics can be used for:
- Color coding (Distance, Priority, DistanceXPriority)
- Progress bars (Distance, Priority, DistanceXPriority)
- Opacity (Distance, Priority, DistanceXPriority)

## Development

### Project Structure

- `index.html`: Main entry point
- `css/`: Stylesheet files
  - `table.css`: Table-specific styles
  - `styles.css`: General application styles
- `js/`: JavaScript files
  - `main.js`: Application initialization
  - `table.js`: Table creation and management
  - `dragResize.js`: Dragging and resizing functionality
  - `scoring.js`: Score calculation logic
  - `colors.js`: Color management for visualization
  - `histogram.js`: Histogram creation and updates
  - `sorting.js`: Table sorting functionality
  - `state.js`: State saving and loading

### Key Functions

- `createDataTable()`: Creates a new interactive table
- `updateScores()`: Recalculates scores based on current settings
- `updateColors()`: Updates the visual representation of data
- `dragElement()`: Enables table dragging
- `setupResize()`: Enables table resizing
- `updateResize()`: Applies resize changes based on the current mode

## License

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

This means you are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made.
- **NonCommercial** — You may not use the material for commercial purposes.

For more information, visit [Creative Commons BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). 
