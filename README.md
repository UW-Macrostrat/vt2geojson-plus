# vt2geojson-plus

Forked from [https://github.com/mapbox/vt2geojson](@mapbox/vt2geojson), vt2geojson-plus:

+ Works in the browser and Node.js
+ Ensures right-hand rule winding order
+ Adds the ability to sort the result by distance from a point
+ Does not handle the fetching of the tile

## Installation

````
npm install --save @macrostrat/vt2geojson-plus
````

## Usage

Node.js

````
const toGeoJSON = require('@macrostrat/vt2geojson-plus').toGeoJSON

let tile = {
  z: 0,
  x: 0,
  y: 0
}
/*
  Get a tile from somewhere as a buffer. Can be gzipped.
*/

toGeoJSON({
  z: tile.z,
  x: tile.x,
  y: tile.y
}, tile, (error, geojson) => {
  // geojson is a valid GeoJSON FeatureCollection
})

````

Browser
Simply add `dist/vt2geojson-plus.min.js` to your HTML

````
<script src='./dist/vt2geojson-browser.min.js'></script>
````

ES6 Module

````
import { toGeoJSON } from '@macrostrat/vt2geojson-plus'
````

## API

#### `toGeoJSON(params, buffer, callback)`

**params**  

| key | required                 | description        |
| --------- | -------------------- | ------------------ |
| z   | yes | the `z` coordinate of the tile  |
| x   | yes | the `x` coordinate of the tile |
| y   | yes | the `y` coordinate of the tile  |
| lng   | no | a valid longitude |
| lat   | no | a valid latitude |

If `lat` and `lng` are specified, the returned features will be ordered by distance relative to the provided point and also contain a property `distance` that indicates the distance from the given point to the nearest vertex of that feature.


**buffer**   
a valid vector tile as a buffer. Can be gzipped

**callback**  
A nodejs-style callback that accepts two parameters, and `error` and a `result`. The `result` is a valid GeoJSON FeatureCollection.
