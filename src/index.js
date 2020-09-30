import {
  select,
  json,
  geoPath,
  csv,
  event,
  geoNaturalEarth1,
  scaleOrdinal,
  schemeCategory10,
  scaleSqrt,
  max,
} from "d3";
import * as d3 from "d3";
import { sizeLegend } from "./sizeLegend";
import { feature } from "topojson";
const aqikey = "97fe6ae1fe494e3775484aaf4968b874996c5e37";
const svg = select("svg");

const instBtn = document.getElementById("instructions");
const modal = document.getElementById("myModal");
const span = document.getElementsByClassName("close")[0];

const instBtn2 = document.getElementById("about");
const modal2 = document.getElementById("myModal2");
const span2 = document.getElementsByClassName("close2")[0];

instBtn.onclick = function () {
  modal.style.display = "block";
};

instBtn2.onclick = function () {
  modal2.style.display = "block";
};

span.onclick = function () {
  modal.style.display = "none";
};

span2.onclick = function () {
  modal2.style.display = "none";
};

modal.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};
modal2.onclick = function (event) {
  if (event.target == modal2) {
    modal2.style.display = "none";
  }
};

const g = svg.append("g");

const projection = geoNaturalEarth1();
const pathGenerator = geoPath().projection(projection);
g.append("path")
  .attr("class", "sphere")
  .attr("d", pathGenerator({ type: "Sphere" }));
const zom = d3.zoom();

svg.call(
  zom.on("zoom", () => {
    g.attr("transform", event.transform);
  })
);

// const zoom = d3.zoom().on("zoom", function () {
//   g.attr("transform", event.transform);
// });

Promise.all([csv("./worldcities.csv"), json("./world.topojson")]).then(
  ([csvData, topoJSONData, aqidata]) => {
    const rowById = csvData.reduce((accumulator, d) => {
      accumulator[d.city] = d;
      return accumulator;
    }, {});
    const sizeScale = scaleSqrt();
    const radiusValue = (d) => d.aqi.data.aqi;

    select("body")
      .append("pre")
      .attr("id", "tooltip3")
      .attr("style", "position: absolute; opacity: 0;");

    const countries = feature(topoJSONData, topoJSONData.objects.countries);
    const paths = g.selectAll("path").data(countries.features);
    paths
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("d", pathGenerator)
      .on("click", function (d) {
        select("#tooltip3")
          .transition()
          .duration(200)
          .style("opacity", 1)
          .text(d.properties.name);
      })
      .on("mouseout", function (d) {
        select("#tooltip3").style("opacity", 0);
      })
      .on("mousemove", function (d) {
        select("#tooltip3")
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY + 10 + "px");
      });

    const cities = Object.values(rowById);
    const capitals = [];
    for (let i = 0; i < cities.length; i++) {
      if (cities[i].population > 3000000) {
        capitals.push(cities[i]);
      }
    }

    const promises = [];
    for (let j = 0; j < capitals.length; j++) {
      const promise = json(
        `https://api.waqi.info/feed/geo:${capitals[j].lat};${capitals[j].lng}/?token=${aqikey}`
      );
      promises.push(promise);
    }
    Promise.all(promises).then((array) => {
      for (let j = 0; j < capitals.length; j++) {
        capitals[j]["aqi"] = array[j];
      }
      sizeScale.domain([0, max(capitals, radiusValue)]).range([0, 10]);

      // setTimeout(function () {
      //   modal.style.display = "none";
      // }, 15000);
      select("body")
        .append("pre")
        .attr("id", "tooltip")
        .attr("style", "position: absolute; display: none;");

      select("body")
        .append("pre")
        .attr("id", "tooltip2")
        .attr("style", "position: absolute; opacity: 0;");

      const radiusValueO3 = (d) => d.aqi.data.iaqi.o3;
      const o3circles = g
        .selectAll(".o3-circle")
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
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n O3:       ${
                  d.aqi.data.iaqi.o3 ? d.aqi.data.iaqi.o3.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#o3-btn").on("click", function () {
        if (select(".o3-circle").classed("selected")) {
          o3circles.style("display", "none");
          select(this).style("opacity", 0.5);

          select(".o3-circle").classed("selected", false);
        } else {
          o3circles.style("display", "block");
          select(this).style("opacity", 1);

          select(".o3-circle").classed("selected", true);
        }
      });

      select("#zoom-in").on("click", function () {
        zom.scaleBy(svg, 1.5);
      });
      select("#zoom-out").on("click", function () {
        zom.scaleBy(svg, 1 / 1.5);
      });

      const radiusValueSO2 = (d) => d.aqi.data.iaqi.so2;
      const so2circles = g
        .selectAll(".so2-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "so2-circle")
        .attr("r", (d) => (radiusValueSO2(d) ? radiusValueSO2(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n SO2:       ${
                  d.aqi.data.iaqi.so2 ? d.aqi.data.iaqi.so2.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#so2-btn").on("click", function () {
        if (select(".so2-circle").classed("selected")) {
          so2circles.style("display", "none");
          select(this).style("opacity", 0.5);

          select(".so2-circle").classed("selected", false);
        } else {
          so2circles.style("display", "block");
          select(this).style("opacity", 1);

          select(".so2-circle").classed("selected", true);
        }
      });

      const radiusValueNO2 = (d) => d.aqi.data.iaqi.no2;
      const no2circles = g
        .selectAll(".no2-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "no2-circle")
        .attr("r", (d) => (radiusValueNO2(d) ? radiusValueNO2(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n NO2:       ${
                  d.aqi.data.iaqi.no2 ? d.aqi.data.iaqi.no2.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#no2-btn").on("click", function () {
        if (select(".no2-circle").classed("selected")) {
          no2circles.style("display", "none");
          select(this).style("opacity", 0.5);

          select(".no2-circle").classed("selected", false);
        } else {
          no2circles.style("display", "block");
          select(this).style("opacity", 1);

          select(".no2-circle").classed("selected", true);
        }
      });

      const radiusValuePM10 = (d) => d.aqi.data.iaqi.pm10;
      const pm10circles = g
        .selectAll(".pm10-circle")
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
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n PM10:       ${
                  d.aqi.data.iaqi.pm10 ? d.aqi.data.iaqi.pm10.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#pm10-btn").on("click", function () {
        if (select(".pm10-circle").classed("selected")) {
          pm10circles.style("display", "none");
          select(this).style("opacity", 0.5);
          select(".pm10-circle").classed("selected", false);
        } else {
          pm10circles.style("display", "block");
          select(this).style("opacity", 1);

          select(".pm10-circle").classed("selected", true);
        }
      });

      const radiusValuePM25 = (d) => d.aqi.data.iaqi.pm25;
      const pm25circles = g
        .selectAll(".pm25-circle")
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
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n PM2.5:       ${
                  d.aqi.data.iaqi.pm25 ? d.aqi.data.iaqi.pm25.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#pm25-btn").on("click", function () {
        if (select(".pm25-circle").classed("selected")) {
          pm25circles.style("display", "none");
          select(this).style("opacity", 0.5);

          select(".pm25-circle").classed("selected", false);
        } else {
          pm25circles.style("display", "block");
          select(this).style("opacity", 1);

          select(".pm25-circle").classed("selected", true);
        }
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

      const coCircles = g
        .selectAll(".co-circle")
        .data(capitals)
        .enter()
        .append("circle")
        .attr("class", "city-circle")
        .attr("class", "co-circle")
        .attr("r", (d) => (radiusValueCO(d) ? +radiusValueCO(d).v : 0))
        .attr("cx", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[0];
        })
        .attr("cy", function (d) {
          const coords = projection([d.lng, d.lat]);
          return coords[1];
        })
        .attr("dx", 1)
        .attr("dy", 0.5)
        .on("click", function (d) {
          select("#tooltip2")
            .transition()
            .duration(200)
            .style("opacity", 1)
            .text(
              d.city +
                `\n CO:       ${
                  d.aqi.data.iaqi.co ? d.aqi.data.iaqi.co.v : "no data"
                }`
            );
        })
        .on("mouseout", function (d) {
          select("#tooltip2").style("opacity", 0);
        })
        .on("mousemove", function (d) {
          select("#tooltip2")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        });

      select("#co-btn").on("click", function () {
        if (select(".co-circle").classed("selected")) {
          coCircles.style("display", "none");
          select(this).style("opacity", 0.5);

          select(".co-circle").classed("selected", false);
        } else {
          coCircles.style("display", "block");
          select(this).style("opacity", 1);

          select(".co-circle").classed("selected", true);
        }
      });

      function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }

      g.append("g").attr("transform", `translate(75, 170)`).call(sizeLegend, {
        sizeScale,
        spacing: 40,
        textOffset: 10,
        numTicks: 5,
        circleFill: "rgba(0, 0, 0, 0.5)",
      });

      g.append("text")
        .attr("x", 100)
        .attr("y", 145)
        .attr("text-anchor", "middle")
        .style("font-size", "23px")
        .style("text-decoration", "underline")
        .text("AQI");

      const circles = g
        .selectAll(".city-circle")
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
          return coords[1];
        })
        .on("click", function (d) {
          select("#tooltip")
            .transition()
            .duration(200)
            .style("display", "block")
            .text(
              d.city +
                `\n Pop:     ${numberWithCommas(d.population)}` +
                `\n AQI:     ${d.aqi.data.aqi}` +
                `\n CO:       ${
                  d.aqi.data.iaqi.co ? d.aqi.data.iaqi.co.v : "no data"
                }` +
                `\n O3:       ${
                  d.aqi.data.iaqi.o3 ? d.aqi.data.iaqi.o3.v : "no data"
                }` +
                `\n PM2.5: ${
                  d.aqi.data.iaqi.pm25 ? d.aqi.data.iaqi.pm25.v : "no data"
                }` +
                `\n PM10:  ${
                  d.aqi.data.iaqi.pm10 ? d.aqi.data.iaqi.pm10.v : "no data"
                }` +
                `\n SO2:     ${
                  d.aqi.data.iaqi.so2 ? d.aqi.data.iaqi.so2.v : "no data"
                }` +
                `\n NO2:    ${
                  d.aqi.data.iaqi.no2 ? d.aqi.data.iaqi.no2.v : "no data"
                }`
            );
        })
        .on("mousemove", function (d) {
          select("#tooltip")
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY + 10 + "px");
        })
        .on("mouseout", function (d) {
          select("#tooltip").style("display", "none");
        });
    });
  }
);
