import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import axios from 'axios'; 

const LeafletMapWithDrawing = () => {
  const [coordinates, setCoordinates] = useState([]); // State to store coordinates

  // Custom hook to handle leaflet draw
  const InitializeDrawingTools = () => {
    const map = useMap();  // Get the map instance using the hook

    useEffect(() => {
      if (!map) return;

      // Initialize a feature group to store drawn layers
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      // Add draw controls only if they haven't been added yet
      if (!map.drawControl) {
        const drawControl = new L.Control.Draw({
          draw: {
            polygon: true,    // Allow polygons
            rectangle: true,  // Allow rectangles
            polyline: false,  // Disable polylines (lines)
            circle: false,    // Disable circles
            circlemarker: false, // Disable circle markers
            marker: false,    // Disable markers
          },
          edit: false,  // Disable edit controls, no toolbar for editing and deleting
        });

        // Add controls to the map
        map.addControl(drawControl);
        map.drawControl = drawControl; // Save the control on the map object to avoid adding it again
      }

      // Handle when a shape is drawn
      map.on(L.Draw.Event.CREATED, async (event) => {
        const layer = event.layer;
        drawnItems.addLayer(layer); // Add the drawn layer to the feature group

        // Get the coordinates of the drawn shape (polygon)
        const shapeCoordinates = layer.getLatLngs();

        // Ensure the last point matches the first point (close the polygon)
        const firstPoint = shapeCoordinates[0][0];
        shapeCoordinates[0].push(firstPoint);

        // Convert coordinates to the desired GeoJSON format
        const geoJsonFormat = {
          type: "Polygon",
          coordinates: [
            shapeCoordinates[0].map((point) => [point.lng, point.lat]) // Ensure order is [lng, lat]
          ]
        }

        setCoordinates(geoJsonFormat.coordinates);  // Store coordinates in the desired format
        console.log('Drawn polygon in GeoJSON format:', geoJsonFormat);  // Log to console

        // Make the API call with axios to send the GeoJSON to the server
        try {
          const response = await axios.post('http://localhost:7000/intersection', geoJsonFormat);
          console.log('API response:', response.data);  // Log the response from the server
          
          // Extract coordinates and display each polygon in red
          response.data.forEach((feature) => {
            const featureCoordinates = feature.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]); // Flip [lng, lat] to [lat, lng]

            // Create a new red polygon and add it to the map
            const newPolygon = L.polygon(featureCoordinates, { color: 'red' });
            newPolygon.addTo(map);  // Add the red polygon to the map
          });

        } catch (error) {
          console.error('Error sending polygon data to the server:', error);
        }
      });

    }, [map]);

    return null;  // This hook doesn't need to return anything
  };

  return (
    <div>
      <MapContainer
        center={[15.3173, 75.7139]}  // Center map on Karnataka, India
        zoom={7}                     // Adjust zoom level as needed
        style={{ height: "500px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <InitializeDrawingTools />  {/* Initialize the drawing tools */}
      </MapContainer>

      <div style={{ marginTop: '20px' }}>
        <h3>Coordinates of Drawn Shapes:</h3>
        <pre>{JSON.stringify(coordinates, null, 2)}</pre> {/* Display coordinates */}
      </div>
    </div>
  );
};

export default LeafletMapWithDrawing;
