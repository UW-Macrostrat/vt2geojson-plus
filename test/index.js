const toGeoJSON = require('../').toGeoJSON
const fs = require('fs')
const geojsonhint = require('@mapbox/geojsonhint')

console.log(toGeoJSON)
let tile = fs.readFileSync(`${__dirname}/tile.mvt`)
let tileGz = fs.readFileSync(`${__dirname}/tile.mvt.gz`)

// Basic conversion
toGeoJSON({
  z: 9,
  x: 128,
  y: 188
}, tile, (error, geojson) => {
  if (error) {
    console.log('ERROR', error)
  }
  let errors = geojsonhint.hint(geojson)
  if (errors.length) {
    console.log('GeoJSON errors - ', errors)
  }
})

// Convert from gzipped buffer and order by distance
toGeoJSON({
  z: 9,
  x: 128,
  y: 188,
  lat: 43,
  lng: -89
}, tileGz, (error, geojson) => {
  if (error) {
    console.log('ERROR', error)
  }
  let errors = geojsonhint.hint(geojson)
  if (errors.length) {
    console.log('GeoJSON errors - ', errors)
  }
  for (let i = 0; i < geojson.features.length; i++) {
    if (i != 0) {
      if (geojson.features[i].properties.distance < geojson.features[i - 1].properties.distance) {
        console.log('Not ordered by distance')
      }
    }
  }
})
