import { useCallback, useEffect, useRef, useState } from 'react';
import { type BirdData } from './types';
import BirdsList from './BirdsList';
import './App.css';

const DEFAULT_LATITUDE = 42.37;
const DEFAULT_LONGITUDE = -71.08;

function App() {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const mapRef = useRef<any>(null);
  const mapInitialized = useRef<boolean>(false);
  const [sightings, setSightings] = useState<BirdData[]>([]);
  const [birds, setBirds] = useState<BirdData[] | null>(null);
  const [updateLoc, setUpdateLoc] = useState<boolean>(false);
  const [lat, setLat] = useState<string | null>(null);
  const [long, setLong] = useState<string | null>(null);

  useEffect(() => {
    const fetchBirds = async () => {
      const params = new URLSearchParams();

      params.append("lat", `${lat !== null ? lat : DEFAULT_LATITUDE}`);
      params.append("lng", `${long !== null ? long : DEFAULT_LONGITUDE}`);
      params.append("back", '7');
      params.append("maxResults", "200");
      params.append("dist", "35");

      const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?${params}`;

      if (lat && long) {
        setLat(null);
        setLong(null);
      }

      try {
        const headers = { "X-eBirdApiToken": "4jv8al3ciioe" };
        const response = await fetch(url, { headers });
        const result = await response.json() as BirdData[];
        setSightings(result.filter(bird => bird.obsReviewed && bird.obsValid));
      } catch {
        setSightings([]);
      }
    };

    if (!sightings.length || (updateLoc && lat && long)) {
      fetchBirds();
    }
  }, [lat, long, sightings, updateLoc]);

  const initializeMap = useCallback(() => {
    if (!mapInitialized.current || updateLoc) {
      setUpdateLoc(false);

      const latitude = lat !== null ? lat : DEFAULT_LATITUDE;
      const longitude = long !== null ? long : DEFAULT_LONGITUDE;

      if (!mapRef.current) {
        mapInitialized.current = true;
        // @ts-expect-error L is defined in the index html
        mapRef.current = L.map('map');
      }

      mapRef.current.setView([latitude, longitude], 11);
      // @ts-expect-error L is defined in the index html
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current);
    }
  }, [lat, long, updateLoc]);

  useEffect(() => {
    if (sightings.length && mapRef.current) {
      console.log({ sightings });
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
        const marker = L.marker([lat, lng]).addTo(mapRef.current);
        marker.bindPopup(`<b>${loc}</b><br>Sightings: ${birds.length}`);
        marker.on('click', () => setBirds(birds));
        marker.on('popupclose', () => setBirds(null));
      });
    }
  }, [mapRef, sightings]);

  if (!sightings.length) {
    return null;
  }

  const canSubmit = lat
    && long
    && parseInt(lat) >= -90
    && parseInt(lat) <= 90
    && parseInt(long) >= -180
    && parseInt(long) <= 180;

  return (<div className='main-container'>
    <BirdsList birds={birds} />
    <div ref={initializeMap} id="map"></div>
    <div className='inputs'>
      <input onChange={({ target: { value } }) => {
        setLat(value);
      }} placeholder="Latitude" />
      <input onChange={({ target: { value } }) => {
        setLong(value);
      }} placeholder="Longitude" />
      <button className="submit" disabled={!canSubmit} onClick={() => setUpdateLoc(true)}>Submit</button>
    </div>
  </div>);
}

export default App;
