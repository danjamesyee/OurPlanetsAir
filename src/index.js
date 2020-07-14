// import "../dist/app.css";
import { select, json, geoPath, geoMercator } from "d3";
import { feature } from "topojson";
console.log("Hello");

const svg = select("svg");

const width = +svg.attr("width");
const height = +svg.attr("height");

const projection = geoMercator();
const pathGenerator = geoPath().projection(projection);

json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(
  (data) => {
    const countries = feature(data, data.objects.countries);
    console.log();

    const paths = svg.selectAll("path").data(countries.features);

    paths
      .enter()
      .append("path")
      .attr("d", (d) => pathGenerator(d));
  }
);
