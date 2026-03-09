import { Protocol } from "pmtiles";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import { scaleLog } from "d3-scale";
import { interpolateViridis } from "d3-scale-chromatic";

// 1. Create a D3 Log Scale
// We map density (1 to 255) to a color ramp
const colorScale = scaleLog()
  .domain([0.15, 255])
  .interpolate(() => interpolateViridis);

// 2. Generate 10 "stops" to pass to MapLibre
// MapLibre will linearly interpolate between these 10 log-spaced points
const densities = [1, 2, 4, 8, 16, 32, 64, 128, 255];
const stops = [
  "interpolate",
  ["linear"],
  ["get", "tippecanoe_feature_density"],
];

densities.forEach(d => {
  stops.push(d);
  stops.push(colorScale(d));
});

console.log(stops);

const { tile } = new Protocol({ metadata: true });
maplibregl.addProtocol("pmtiles", tile);

const map = new maplibregl.Map({
  container: "map",
  zoom: 12,
  center: [-74.01, 40.71],
  renderWorldCopies: false,
  style: {
    version: 8,
    sources: {
      "world-basemap": {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution: "&copy; OpenStreetMap contributors",
        maxzoom: 19,
      },
      "pmtiles-source": {
        type: "vector",
        url: `pmtiles://http://localhost:5173/nyctiles-13m.pmtiles`,
      },
    },
    layers: [
      {
        id: "world-basemap",
        source: "world-basemap",
        type: "raster",
      },
      {
        id: "pmtiles",
        source: "pmtiles-source",
        type: "circle",
        "source-layer": "nyc_taxi_points",
        paint: {
          "circle-color": stops,
          "circle-radius": 4,
          // "circle-opacity": [
          //   "interpolate",
          //   ["linear"],
          //   ["get", "tippecanoe_feature_density"],
          //   1,
          //   1.0,
          //   255,
          //   0.7,
          // ],
          "circle-opacity": 0.8,
        },
      },
    ],
  },
});

map.on("click", "pmtiles", e => {
  if (e.features.length > 0) {
    const props = e.features[0].properties;
    console.log("Feature Properties:", props);
    console.log("Density Value:", props.tippecanoe_feature_density);
  }
});
