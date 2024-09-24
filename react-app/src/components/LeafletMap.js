import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import axios from 'axios'; 

const LeafletMapWithDrawing = () => {
  const [coordinates, setCoordinates] = useState([]); 

  // Custom hook to handle leaflet draw
  const InitializeDrawingTools = () => {
    const map = useMap(); 

    useEffect(() => {
      if (!map) return;

      // Initialize a feature group to store drawn layers
      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      // Add draw controls only if they haven't been added yet
      if (!map.drawControl) {
        const drawControl = new L.Control.Draw({
          draw: {
            polygon: true,    
            rectangle: true, 
            polyline: false,  
            circle: false,    
            circlemarker: false, 
            marker: false,    
          },
          edit: false,  
        });

        // Add controls to the map
        map.addControl(drawControl);
        map.drawControl = drawControl; 
      }

      // Handle when a shape is drawn
      map.on(L.Draw.Event.CREATED, async (event) => {
        const layer = event.layer;
        drawnItems.addLayer(layer); 

        // Get the coordinates of the drawn shape (polygon)
        const shapeCoordinates = layer.getLatLngs();

        
        const firstPoint = shapeCoordinates[0][0];
        shapeCoordinates[0].push(firstPoint);

        // Convert coordinates to the desired GeoJSON format
        const geoJsonFormat = {
          type: "Polygon",
          coordinates: [
            shapeCoordinates[0].map((point) => [point.lng, point.lat]) 
          ]
        }

        setCoordinates(geoJsonFormat.coordinates);  
        console.log('Drawn polygon in GeoJSON format:', geoJsonFormat);  

        
        try {
          const response = await axios.post('http://localhost:7000/intersection', geoJsonFormat);
          console.log('API response:', response.data); 
          
         
          response.data.forEach((feature) => {
            const featureCoordinates = feature.geometry.coordinates[0].map((coord) => [coord[1], coord[0]]); // Flip [lng, lat] to [lat, lng]

            
            const newPolygon = L.polygon(featureCoordinates, { color: 'red' });
            newPolygon.addTo(map);  // Add the red polygon to the map
          });

        } catch (error) {
          console.error('Error sending polygon data to the server:', error);
        }
      });

    }, [map]);

    return null;  
  };

  return (
    <div>
      <MapContainer
        center={[15.3173, 75.7139]}  
        zoom={7}                     
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
