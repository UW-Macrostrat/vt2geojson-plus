import { VectorTile } from '@mapbox/vector-tile'
import Protobuf from 'pbf'
import zlib from 'browserify-zlib'

import { point, polygon } from '@turf/helpers'
import explode from '@turf/explode'
import nearestPoint from '@turf/nearest-point'
import distance from '@turf/distance'
import within from '@turf/boolean-within'
import rewind from '@turf/rewind'

function orderByDistance(lng, lat, geojson) {
  let pt = point([lng, lat])

  geojson.features = geojson.features.map(feature => {
    let vertices = explode(feature)
    let nearestVertex = nearestPoint(pt, vertices)

    if (feature.geometry.type === 'MultiPolygon') {
      let contains = feature.geometry.coordinates.map( poly => {
        return within(pt, polygon(poly))
      })
      if (contains.indexOf(true) > -1) {
        feature.properties.distance = 0
      } else {
        feature.properties.distance = distance(pt, nearestVertex, {'units': 'kilometers'})
      }
    } else {
      if (within(pt, feature)) {
        feature.properties.distance = 0
      } else {
        feature.properties.distance = distance(pt, nearestVertex, {'units': 'kilometers'})
      }
    }

    return feature
  }).sort((a, b) => {
    return a.properties.distance - b.properties.distance
  })

  return geojson
}

// adapted from https://github.com/mapbox/vt2geojson/blob/master/index.js#L61
export function toGeoJSON(params, buffer, callback) {
  // handle zipped buffers
  if (buffer[0] === 0x78 && buffer[1] === 0x9C) {
    buffer = zlib.inflateSync(buffer)
  } else if (buffer[0] === 0x1F && buffer[1] === 0x8B) {
    buffer = zlib.gunzipSync(buffer)
  }

  let tile = new VectorTile(new Protobuf(buffer))
  let layers = params.layer || Object.keys(tile.layers)

  if (!Array.isArray(layers)) {
    layers = [layers]
  }

  let collection = {type: 'FeatureCollection', features: []}

  for (let j = 0; j < layers.length; j++) {
    let layer = tile.layers[layers[j]]
    if (layer) {
      for (let i = 0; i < layer.length; i++) {
        // Force coordinates to right hand rule using turf-rewind
        let feature = rewind(layer.feature(i).toGeoJSON(params.x, params.y, params.z))
        if (layers.length > 1) {
          feature.properties.vt_layer = layers[i]
        }
        collection.features.push(feature)
      }
    }
  }

  if (params.lat && params.lng) {
    collection = orderByDistance(params.lng, params.lat, collection)
  }

  callback(null, collection)
}
