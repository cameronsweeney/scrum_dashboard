// type & interface definitions
type MapHexagon = {
    "q": number,
    "r": number,
    "name": string,
    "description": string,
    "color": string
}
export type MapHexagonList = MapHexagon[];

interface HexagonGridProps {
  map_data: MapHexagonList
}

const s: number = 70;

const hexagonConfig = {
    // size = distance from center to point
    size: s,
    // assuming pointy top hexagons
    // width = distance left edge to right edge
    width: s * Math.sqrt(3),
    // height = distance top point to bottom point
    height: 2 * s
}

interface GridSizeResult {
  cols: number;
  rows: number;
  gridWidth: number;
  gridHeight: number;
  min_q: number;
  min_r: number;
  min_q_even_row: boolean;
  max_q_even_row: boolean;
}

type ProcessedHexagonRow = [ MapHexagonList, MapHexagonList ]

type ProcessedHexagonGrid = {
  grid: ProcessedHexagonRow[],
  min_q: number,
  max_q: number,
  min_r: number,
  max_r: number,
  min_q_even_row: boolean,
  max_q_even_row: boolean
}

export const getGridSize = (map_data: MapHexagonList): GridSizeResult => {
  // initialize multidimensional array
  let processedHexagonGrid: ProcessedHexagonGrid = {
    grid: [],
    min_q: Infinity,
    max_q: -Infinity,
    min_r: Infinity,
    max_r: -Infinity,
    min_q_even_row: false,
    max_q_even_row: false
  };

  for (const map_hex of map_data) {
  // place in array in correct place
  const hasPositiveColumn = map_hex.q >= 0 ? 1 : 0;
  if (!processedHexagonGrid.grid[map_hex.r]) {
    processedHexagonGrid.grid[map_hex.r] = [[], []];
  }
  processedHexagonGrid.grid[map_hex.r][hasPositiveColumn][Math.abs(map_hex.q)] = map_hex;

  // based on indices, update min/max q/r stuff:

    if (map_hex.q < processedHexagonGrid.min_q) {
      processedHexagonGrid.min_q = map_hex.q;
      processedHexagonGrid.min_q_even_row = map_hex.r % 2 === 0;
    }
    if (map_hex.q > processedHexagonGrid.max_q) {
      processedHexagonGrid.max_q = map_hex.q;
      processedHexagonGrid.max_q_even_row = map_hex.r % 2 === 0;
    }
    if (map_hex.r < processedHexagonGrid.min_r) {
      processedHexagonGrid.min_r = map_hex.r;
    }
    if (map_hex.r > processedHexagonGrid.max_r) {
      processedHexagonGrid.max_r = map_hex.r;
    }
  }

  const cols = processedHexagonGrid.max_q - processedHexagonGrid.min_q + 1;
  const rows = processedHexagonGrid.max_r - processedHexagonGrid.min_r + 1;

  const gridWidth = (cols + 1) * hexagonConfig.width;
  const gridHeight = (0.75 * rows + 0.75) * hexagonConfig.height;

  const result = {
    cols,
    rows,
    gridWidth,
    gridHeight,
    min_q: processedHexagonGrid.min_q,
    min_r: processedHexagonGrid.min_r,
    min_q_even_row: processedHexagonGrid.min_q_even_row,
    max_q_even_row: processedHexagonGrid.max_q_even_row
};
  return (result);
}

// Function to calculate the points of a hexagon - pointy top
const calculateHexagonPoints = () => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      let angle = (Math.PI / 3 * i) + (Math.PI / 6);
      let x = Math.floor(hexagonConfig.size * Math.cos(angle) + hexagonConfig.size);
      let y = Math.floor(hexagonConfig.size * Math.sin(angle) + hexagonConfig.size);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

interface HexagonSVGProps {
    hex_data: MapHexagon
}

// create single HexagonSVG component
export const HexagonSVG: React.FC<HexagonSVGProps> = ({ hex_data }) => {
  const size = hexagonConfig.size;
  const fontSize = 16;
  const points = calculateHexagonPoints();

  return (
    <svg width={hexagonConfig.width} height={hexagonConfig.height} viewBox={`0 0 ${size*2} ${size*2}`}>
      <polygon points={points} fill={hex_data.color} />
      <text x={size} y={size + fontSize / 2} fontSize={fontSize} textAnchor="middle" fill="white">
        {hex_data.name}
      </text>
      <polygon className="stroke-0 hover:stroke-2" points={points} fill="transparent" stroke="white" />
    </svg>
  );
};

export const HexagonGrid: React.FC<HexagonGridProps> = ({ map_data }) => {
  const { cols, rows, gridWidth, gridHeight, min_q, min_r, min_q_even_row, max_q_even_row } = getGridSize(map_data);

  const center = {
    x: (gridWidth - hexagonConfig.width) / 2,
    y: (gridHeight - hexagonConfig.height) / 2
  };

  const offset = {
    x: hexagonConfig.width * (min_q + cols / 2 - 0.5),
    y: hexagonConfig.height * (min_r + rows / 2 - 0.5)
  }

  const gridItems = [];

  for (let row = min_r; row < (min_r + rows); row++) {
    for (let col = min_q; col < (min_q + cols); col++) {
      const empty_hex_data = {
        q: col,
        r: row,
        "name": "",
        "description": "empty hex",
        "color": "blue"
      }
      let current_hex_data: MapHexagon | undefined = map_data.find(item => item.q === col && item.r === row);
      // don't draw any empty hexagons in odd rows that would be left of the leftmost nonempty hexagon (lol I know it's a lot of conditions)
      if (!current_hex_data && col == min_q && (col % 2) && min_q_even_row) {
        continue;
      }
      if (!current_hex_data) {
        continue; // REMOVE THIS LINE LATER
        current_hex_data = empty_hex_data
      }
 
      const x = center.x - offset.x + hexagonConfig.width * (col - 0.5 * Math.abs(row % 2));
      const y = center.y + offset.y - (0.75 * hexagonConfig.height * row);

      gridItems.push(
        <g key={`${row}-${col}`} transform={`translate(${x}, ${y})`}>
          <HexagonSVG hex_data={current_hex_data}/>
        </g>
      );
    }
  }

  return (
    <svg width={gridWidth} height={gridHeight} style={{ margin: 'auto', display: 'block', border: 'solid thin white' }}>
      {gridItems}
    </svg>
  );
}