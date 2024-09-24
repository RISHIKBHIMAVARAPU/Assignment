import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import GeoJSONModel from "./models/geoJsonSchema.js"; // Adjust based on your actual schema
import * as turf from '@turf/turf';


const app = express();
app.use(express.json());
dotenv.config();
app.use(cors());

const port = process.env.PORT || 7000;

(async function start() {
  try {
    console.log("inside start function");
    await mongoose.connect(process.env.MONGODB_CONNECTION_URL);
    app.listen(port, () => console.log(`server is running on port ${port}`));
  } catch (err) {
    console.log("mongodb connection error ", err.message);
  }
})();


app.post("/intersection", async (req, res) => {
    const geoJsonData = req.body; 
    console.log('Received GeoJSON:', geoJsonData); 
  const intersectingFeatures = [];
  const features = await GeoJSONModel.find({});
  const userPolygon = geoJsonData

  features.forEach((feature) => {
    if (feature.geometry && feature.geometry.type === "Polygon") {
      const intersection = geojsonIntersection(userPolygon, feature.geometry);
      if (intersection) {
        intersectingFeatures.push(feature);
      }
    }
  });
  return res.json(intersectingFeatures);
});

// Helper function to perform intersection
const geojsonIntersection = (polygonA, polygonB) => {
    try {
      const polyA = turf.polygon(polygonA.coordinates);
      const polyB = turf.polygon(polygonB.coordinates);
      const featureCollection = turf.featureCollection([polyA, polyB]);
      const intersection = turf.intersect(featureCollection);
      if (!intersection) {
        return null;
      }
      return intersection;
    } catch (error) {
      console.error("Error performing intersection:", error.message);
      return null;
    }
  };
