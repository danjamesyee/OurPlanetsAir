# Our Planet's Air

[Live Site](https://www.danielyee.dev/OurPlanetsAir/dist/index.html)

![mainpage](https://github.com/danjamesyee/Air/blob/master/airgif.gif?raw=true)

## About

Our Planet's Air is an interactive map visualising the real-time different air pollutants in major cities. This idea arose from the need for people to have a visual representation of a problem to be moved to address it more urgently. My hope is that people will see this as a global issue and feel more motivated to work towards solutions.

## Technologies

Javascript, D3.js, HTML, CSS

## Features

### Filtering display by pollutant

Users can click each button to display or hide the visualisation of that specific pollutant on the map. This pollution data is collected from the World Air Quality Index API upon page refresh. 

![filter](https://github.com/danjamesyee/Air/blob/master/filterbypoll.gif?raw=true)

### Hovering tooltip to display city data

Users can hover over each city to display a tooltip giving the name, population, and pollution numbers for each city. The AQI level and the levels of different pollutants such as NO2 and CO also display real-time data upon page refresh. 

![tooltip](https://github.com/danjamesyee/Air/blob/master/tooltip.gif?raw=true)

### Promise aggregation to obtain data from API

```Javascript
const promises = [];
    for (let j = 0; j < capitals.length; j++) {
      const promise = json(
        `https://api.waqi.info/feed/geo:${capitals[j].lat};${capitals[j].lng}/?token=${aqikey}`
      );
      promises.push(promise);
    }
    const array = Promise.all(promises).then((array) => {
      for (let j = 0; j < capitals.length; j++) {
        capitals[j]["aqi"] = array[j];
      }
```
### Data Sources

##### Thanks to these places for their free data:
  
  * [World Air Quality Index Project](https://waqi.info/)
  * [Simple Maps World Cities Database](https://simplemaps.com/data/world-cities)
  * [World Atlas TopoJSON](https://www.npmjs.com/package/world-atlas)
