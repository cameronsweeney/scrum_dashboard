const hexagonSize: number = 100;

import { MapHexagonList, HexagonGrid } from "./components/HexagonGrid";

import raw_map_data from './area_data.json';
const map_data: MapHexagonList = raw_map_data.data;

export default function Home() {
  return (
    <>
      <div className="card">
        <h1>Scrum Dashboard</h1>
        <h2>Hexagon Map!!!!</h2>
        <div>
          <HexagonGrid map_data={map_data} />
        </div>
      </div>
    </>
  );
}
