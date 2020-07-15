// // import "../dist/app.css";
import {
  select,
  json,
  geoPath,
  csv,
  zoom,
  event,
  geoMercator,
  geoOrthographic,
  geoStereographic,
  geoNaturalEarth1,
  scaleOrdinal,
  schemeCategory10,
  schemeSpectral,
  scaleSqrt,
  max,
  tip,
  mouse,
} from "d3";
import { sizeLegend } from "./sizeLegend";
import { feature } from "topojson";
// console.log("Hello");
const aqikey = "97fe6ae1fe494e3775484aaf4968b874996c5e37";
const svg = select("svg");

// const width = +svg.attr("width");
// const height = +svg.attr("height");
const g = svg.append("g");

const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection);
g.append("path")
  .attr("class", "sphere")
  .attr("d", pathGenerator({ type: "Sphere" }));

svg.call(
  zoom().on("zoom", () => {
    g.attr("transform", event.transform);
  })
);
Promise.all([csv("./worldcities.csv"), json("./world.topojson")]).then(
  ([csvData, topoJSONData, aqidata]) => {
    // console.log(csvData);
    // console.log(topoJSONData);
    const rowById = csvData.reduce((accumulator, d) => {
      accumulator[d.city] = d;
      return accumulator;
    }, {});
    const sizeScale = scaleSqrt();
    const radiusValue = (d) => d.aqi.data.aqi;

    const countries = feature(topoJSONData, topoJSONData.objects.countries);
    // console.log(aqidata);
    const paths = g.selectAll("path").data(countries.features);
    const colorScale = scaleOrdinal(schemeCategory10);
    paths
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator)
      // .attr("fill", (d) => colorScale(d.properties.name))
      .append("title")
      .text((d) => d.properties.name);
    // debugger;
    const cities = Object.values(rowById);
    const capitals = [];
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].population > 10000000) {
        capitals.push(cities[i]);
      }
    }

    // console.log(Object.values(rowById));
    // Object.values(rowById).forEach((item) => console.log(item));

    const promises = [];
    for (let j = 0; j < capitals.length; j++) {
      const promise = json(
        `http://api.waqi.info/feed/geo:${capitals[j].lat};${capitals[j].lng}/?token=${aqikey}`
      );
      promises.push(promise);
    }
    const array = Promise.all(promises).then((array) => {
      for (let j = 0; j < capitals.length; j++) {
        capitals[j]["aqi"] = array[j];
      }
      // console.log(capitals);
      sizeScale.domain([0, max(capitals, radiusValue)]).range([0, 10]);

      const radiusValueO3 = (d) => d.aqi.data.iaqi.o3;
      g.selectAll(".o3-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "o3-circle")
        .attr("r", (d) => (radiusValueO3(d) ? radiusValueO3(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          // console.log(radiusValueO3(d));
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .append("title")
        .text(
          (d) =>
            d.city + ": " + "o3: " + (radiusValueO3(d) ? radiusValueO3(d).v : 0)
        );

      const radiusValuePM10 = (d) => d.aqi.data.iaqi.pm10;
      g.selectAll(".pm10-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "pm10-circle")
        .attr("r", (d) => (radiusValuePM10(d) ? radiusValuePM10(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          // console.log(d);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .append("title")
        .text(
          (d) =>
            d.city +
            ": " +
            "pm 10: " +
            (radiusValuePM10(d) ? radiusValuePM10(d).v : 0)
        );
      const radiusValuePM25 = (d) => d.aqi.data.iaqi.pm25;
      g.selectAll(".pm25-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "pm25-circle")
        .attr("r", (d) => (radiusValuePM25(d) ? radiusValuePM25(d).v / 2 : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          // console.log(d);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .append("title")
        .text(
          (d) =>
            d.city +
            ": " +
            "pm 2.5: " +
            (radiusValuePM25(d) ? radiusValuePM25(d).v / 2 : 0)
        );
      // debugger;

      g.append("g").attr("transform", `translate(90,120)`).call(sizeLegend, {
        sizeScale,
        spacing: 40,
        textOffset: 10,
        numTicks: 5,
        circleFill: "rgba(0, 0, 0, 0.5)",
      });

      select("body")
        .append("pre")
        .attr("id", "tooltip")
        .attr("style", "position: absolute; opacity: 0;");
      // .text((d) => d.city + " aqi: " + d.aqi.data.aqi);

      g.selectAll(".city-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "aqi-circle")
        .attr("id", "main-circle")
        .attr("r", (d) => sizeScale(radiusValue(d)))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          // console.log(d);
          return coords[1];
        })
        .on("mouseover", function (d) {
          select("#tooltip")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                "\n AQI: " +
                d.aqi.data.aqi +
                +"   " +
                "\n CO: " +
                (d.aqi.data.iaqi.co ? d.aqi.data.iaqi.co.v : "no data") +
                "\n O3: " +
                (d.aqi.data.iaqi.o3 ? d.aqi.data.iaqi.o3.v : "no data") +
                "\n PM 2.5: " +
                (d.aqi.data.iaqi.pm25 ? d.aqi.data.iaqi.pm25.v : "no data") +
                "\n PM 10: " +
                (d.aqi.data.iaqi.pm10 ? d.aqi.data.iaqi.pm10.v : "no data") +
                "\n SO2: " +
                (d.aqi.data.iaqi.so2 ? d.aqi.data.iaqi.so2.v : "no data") +
                "\n NO2: " +
                (d.aqi.data.iaqi.no2 ? d.aqi.data.iaqi.no2.v : "no data")
            );

          console.log(d);
        })
        .on("mouseout", function (d) {
          select("#tooltip").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      g.selectAll(".city-label")
        .data(capitals)
        .enter()
        .append("text")
        .attr("class", "city-label")
        .attr("x", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("y", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[1];
        })
        .text(function (d) {
          d.city;
        })
        .attr("dx", 1)
        .attr("dy", 0.5);

      const radiusValueCO = (d) => d.aqi.data.iaqi.co;

      g.selectAll(".co-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "co-circle")
        .attr("r", (d) => (radiusValueCO(d) ? radiusValueCO(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          // console.log(d);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .append("title")
        .text(
          (d) => d.city + " CO: " + (radiusValueCO(d) ? radiusValueCO(d).v : 0)
        );
    });
  }
);
