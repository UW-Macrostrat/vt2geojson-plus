import { VectorTile } from '@mapbox/vector-tile'
import Protobuf from 'pbf'
import zlib from 'browserify-zlib'

import rewind from '@turf/rewind'

import { point } from '@turf/helpers'
import within from '@turf/boolean-within'
import pointToLineDistance from '@turf/point-to-line-distance'
import { segmentReduce } from '@turf/meta'
import flatten from '@turf/flatten'

function sortByDistance(lng, lat, geojson) {
  let pt = point([lng, lat])

  geojson.features = geojson.features.map(feature => {
    feature.distance = segmentReduce(feature, (previousSegment, currentSegment) => {
      let currentDistance = pointToLineDistance(pt, currentSegment)
      if (currentDistance < previousSegment) {
        return currentDistance
      }
      return previousSegment
    }, Infinity)

    // Flatten multi geometries and check if any fall within the polygon
    // NB: As of writing turf/within does not accept multi geometries, thus why flattening is needed
    flatten(feature).features.forEach(f => {
      if (within(pt, f)) {
        feature.distance = 0
      }
    })


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
    collection = sortByDistance(params.lng, params.lat, collection)
  }

  callback(null, collection)
}
