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
  const [lat, setLat] = useState<string | undefined>(undefined);
  const [long, setLong] = useState<string | undefined>(undefined);
  const [fetchFailed, setFetchFailed] = useState<boolean>(false);
  const sightingsCache = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fetchBirds = async () => {
      const params = new URLSearchParams();

      params.append("lat", `${lat !== undefined ? lat : DEFAULT_LATITUDE}`);
      params.append("lng", `${long !== undefined ? long : DEFAULT_LONGITUDE}`);
      params.append("back", '7');
      params.append("maxResults", "500");
      params.append("dist", "50");

      const url = `https://api.ebird.org/v2/data/obs/geo/recent/notable?${params}`;

      if (fetchFailed) {
        return;
      }

      try {
        const headers = { "X-eBirdApiToken": "4jv8al3ciioe" };
        const response = await fetch(url, { headers });
        const result = await response.json() as BirdData[];
        if (result.length) {
          setLat(undefined);
          setLong(undefined);
          setUpdateLoc(false);
          setSightings(sightings.concat(result.filter(bird => bird.obsReviewed && bird.obsValid)));
        }
      } catch {
        setFetchFailed(true);
        setSightings([]);
      }
    };

    if (!sightings.length || (updateLoc && lat && long)) {
      fetchBirds();
    }
  }, [fetchFailed, lat, long, sightings, updateLoc]);

  const initializeMap = useCallback(() => {
    if (!mapInitialized.current) {
      if (!mapRef.current) {
        const latitude = lat !== undefined ? lat : DEFAULT_LATITUDE;
        const longitude = long !== undefined ? long : DEFAULT_LONGITUDE;

        mapInitialized.current = true;
        // @ts-expect-error L is defined in the index html
        mapRef.current = L.map('map');
        mapRef.current.setView([latitude, longitude], 11);

        // @ts-expect-error L is defined in the index html
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          minZoom: 6,
          maxZoom: 15,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapRef.current);
      }

      mapRef.current.on('movestart', () => {
        setBirds(null);
      });

      mapRef.current.on('moveend', () => {
        const { lat, lng } = mapRef.current.getCenter();
        setLat(lat);
        setLong(lng);
      });
    }
  }, [lat, long]);

  useEffect(() => {
    if (sightings.length && mapRef.current) {
      const sightingsByLoc: Record<string, BirdData[]> = {};

      sightings.forEach((sighting) => {
        const { locName } = sighting;
        if (!sightingsByLoc[locName]) {
          sightingsByLoc[locName] = [];
        }
        sightingsByLoc[locName].push(sighting);
      });

      Object.entries(sightingsByLoc).forEach(([loc, birds]) => {
        const { lat, lng, comName, subId } = birds[0];
        const cacheKey = `${comName}-${subId}`;

        if (!sightingsCache.current[cacheKey]) {
          sightingsCache.current[cacheKey] = true;
          // @ts-expect-error L is defined in the index html
          const marker = L.marker([lat, lng]).addTo(mapRef.current);
          marker.bindPopup(`<b>${loc}</b><br>Sightings: ${birds.length}`);
          marker.on('click', () => setBirds(birds));
          marker.on('popupclose', () => setBirds(null));
        }
      });
    }
  }, [mapRef, sightings]);

  if (!sightings.length) {
    return null;
  }

  const canSubmit = !birds && lat && long;

  return (<div className='main-container'>
    <BirdsList birds={birds} />
    <div ref={initializeMap} id="map"></div>
    {canSubmit && <div className="crosshair scale-up-center">&#128269;</div>}
    <button className="submit scale-up-center" disabled={!canSubmit} onClick={() => setUpdateLoc(true)}>
      Get rare birds!
    </button>
  </div>);
}

export default App;
