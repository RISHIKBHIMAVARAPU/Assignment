import { readFileSync } from 'fs';
import { Schema, model, connect } from 'mongoose';

const geoDataSchema = new Schema({
  type: {
    type: String,
    enum: ['Feature'],  
    required: true,
  },
  properties: {
    fill: { type: String },
  },
  geometry: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true,
    },
    coordinates: {
      type: [[[Number]]],  
      required: true,
    },
  },
});

const GeoJSONModel = model('GeoData', geoDataSchema);
export default GeoJSONModel;


export const importGeoJSON = async (filePath) => {
  try {
    const data = readFileSync(filePath, 'utf8');
    const geoJSONData = JSON.parse(data);
    const features = geoJSONData.features;
    for (let feature of features) {
      const res = await GeoJSONModel.create(feature);
      console.log('Inserted feature:', res);
    }
  } catch (error) {
    console.error('Error importing GeoJSON data:', error);
  }
};

