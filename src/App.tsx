import { useCallback, useEffect, useRef, useState } from 'react';
import { type BirdData } from './types';
import BirdsList from './BirdsList';
import './App.css';

const LATITUDE = 42.37;
const LONGITUDE = -71.08;

function App() {
  const mapInitialized = useRef<boolean>(false);
  const [sightings, setSightings] = useState<BirdData[]>([]);
  const [birds, setBirds] = useState<BirdData[] | null>(null);

  useEffect(() => {
    const fetchBirds = async () => {
      const params = new URLSearchParams();

      params.append("lat", `${LATITUDE}`);
      params.append("lng", `${LONGITUDE}`);
      params.append("back", '7');
      params.append("maxResults", "200");
      params.append("dist", "35");

      const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?${params}`;

      try {
        const headers = { "X-eBirdApiToken": "4jv8al3ciioe" };
        const response = await fetch(url, { headers });
        const result = await response.json() as BirdData[];
        setSightings(result.filter(bird => bird.obsReviewed && bird.obsValid));
      } catch {
        setSightings([]);
      }
    };

    if (!sightings.length) {
      fetchBirds();
    }
  }, [sightings]);

  const initializeMap = useCallback(() => {
    if (!mapInitialized.current) {
      mapInitialized.current = true;
      // @ts-expect-error L is defined in the index html
      const map = L.map('map').setView([LATITUDE, LONGITUDE], 11);
      // @ts-expect-error L is defined in the index html
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      if (sightings.length) {
        const sightingsByLoc: Record<string, BirdData[]> = {};

        sightings.forEach((sighting) => {
          const { locName } = sighting;
          if (!sightingsByLoc[locName]) {
            sightingsByLoc[locName] = [];
          }
          sightingsByLoc[locName].push(sighting);
        });

        Object.entries(sightingsByLoc).forEach(([loc, birds]) => {
          const { lat, lng } = birds[0];
          // @ts-expect-error L is defined in the index html
          const marker = L.marker([lat, lng]).addTo(map);
          marker.bindPopup(`<b>${loc}</b><br>Sightings: ${birds.length}`);
          marker.on('click', () => setBirds(birds));
          marker.on('popupclose', () => setBirds(null));
        });
      }
    }
  }, [sightings]);

  if (!sightings.length) {
    return null;
  }

  return (<div className='main-container'>
    <BirdsList birds={birds} />
    <div ref={initializeMap} id="map"></div>
  </div>);
}

export default App;
