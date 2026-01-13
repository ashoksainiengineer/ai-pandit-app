'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Copy, Check, Search } from 'lucide-react';
import { searchCities } from '@/lib/cities';

interface MapPickerProps {
  initialLat: number;
  initialLon: number;
  onCoordinateSelect: (lat: number, lon: number) => void;
}

export default function MapPicker({ initialLat, initialLon, onCoordinateSelect }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [lat, setLat] = useState<number>(initialLat || 20);
  const [lon, setLon] = useState<number>(initialLon || 77);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => {
      initializeMap();
    };
    document.body.appendChild(script);

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  // Handle city search
  const handleCitySearch = (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchCities(query);
          setSearchResults(results);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error('Search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Handle city selection from search
  const handleSearchSelect = (city: any) => {
    handleCoordinateChange(city.latitude, city.longitude);
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSearchResults([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    
    const mapInstance = L.map(mapRef.current, {
      scrollWheelZoom: true,
      dragging: true,
    }).setView([lat, lon], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add marker
    const markerInstance = L.marker([lat, lon], {
      draggable: true,
      title: 'Birth Location Marker',
    }).addTo(mapInstance)
      .bindPopup(`<div class="text-center">
        <p class="font-bold">Birth Location</p>
        <p class="text-sm">Lat: ${lat.toFixed(4)}</p>
        <p class="text-sm">Lon: ${lon.toFixed(4)}</p>
      </div>`);

    markerInstance.on('dragend', () => {
      const { lat: newLat, lng: newLon } = markerInstance.getLatLng();
      setLat(newLat);
      setLon(newLon);
      onCoordinateSelect(newLat, newLon);
      markerInstance.setPopupContent(`<div class="text-center">
        <p class="font-bold">Birth Location</p>
        <p class="text-sm">Lat: ${newLat.toFixed(4)}</p>
        <p class="text-sm">Lon: ${newLon.toFixed(4)}</p>
      </div>`);
    });

    // Click on map to place marker
    mapInstance.on('click', (e: any) => {
      const { lat: newLat, lng: newLon } = e.latlng;
      markerInstance.setLatLng([newLat, newLon]);
      setLat(newLat);
      setLon(newLon);
      onCoordinateSelect(newLat, newLon);
      markerInstance.setPopupContent(`<div class="text-center">
        <p class="font-bold">Birth Location</p>
        <p class="text-sm">Lat: ${newLat.toFixed(4)}</p>
        <p class="text-sm">Lon: ${newLon.toFixed(4)}</p>
      </div>`);
    });

    setMap(mapInstance);
    setMarker(markerInstance);
    setMapLoaded(true);
  };

  const handleCoordinateChange = (latVal?: number, lonVal?: number) => {
    const newLat = latVal !== undefined ? latVal : lat;
    const newLon = lonVal !== undefined ? lonVal : lon;

    if (latVal !== undefined) setLat(latVal);
    if (lonVal !== undefined) setLon(lonVal);

    if (map && marker) {
      map.setView([newLat, newLon], map.getZoom());
      marker.setLatLng([newLat, newLon]);
      onCoordinateSelect(newLat, newLon);
      marker.setPopupContent(`<div class="text-center">
        <p class="font-bold">Birth Location</p>
        <p class="text-sm">Lat: ${newLat.toFixed(4)}</p>
        <p class="text-sm">Lon: ${newLon.toFixed(4)}</p>
      </div>`);
    }
  };

  const copyCoordinates = () => {
    const text = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Map Container with Sticky Search Inside */}
      <div className="relative w-full rounded-lg border border-vedic-saffron/30 overflow-hidden bg-slate-900 shadow-2xl">
        {/* Sticky Search Box Overlay */}
        <div className="absolute top-0 left-0 right-0 z-40 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" ref={searchDropdownRef}>
          <div className="relative pointer-events-auto">
            <Search className="absolute left-3 top-3 w-5 h-5 text-vedic-saffron/70 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
              placeholder="🔍 Jump to city..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/95 backdrop-blur-sm border border-vedic-saffron/40 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vedic-saffron focus:border-transparent text-sm font-medium shadow-lg hover:bg-white transition-all duration-200"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 w-5 h-5 text-vedic-saffron animate-spin pointer-events-none" />
            )}
            
            {/* Search Dropdown Inside Map - Always Visible */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/98 backdrop-blur-sm border border-vedic-saffron/40 rounded-lg overflow-hidden z-50 shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearchSelect(city)}
                    className="w-full px-4 py-2.5 text-left hover:bg-vedic-saffron/15 transition-colors border-b border-slate-200/50 last:border-b-0 text-sm"
                  >
                    <div className="font-semibold text-slate-900">{city.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">
                      {[city.district, city.state, city.country].filter(Boolean).join(' • ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div 
          ref={mapRef} 
          className="w-full h-[400px] sm:h-[450px] md:h-[500px]"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="w-8 h-8 text-vedic-saffron animate-spin" />
          </div>
        )}
      </div>

      {/* Coordinate Display & Inputs */}
      <div className="bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-vedic-saffron/20 rounded-lg p-4 space-y-3 backdrop-blur-sm">
        {/* Current Coordinates Display */}
        <div className="bg-vedic-saffron/5 border border-vedic-saffron/40 rounded-lg p-3 hover:border-vedic-saffron/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-vedic-saffron flex-shrink-0" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Location:</span>
              <span className="text-sm text-vedic-saffron font-mono font-medium">
                {lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° {lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
            <button
              onClick={copyCoordinates}
              className="p-1.5 hover:bg-vedic-saffron/20 rounded-md transition-colors"
              title="Copy coordinates"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-vedic-saffron/70 hover:text-vedic-saffron" />
              )}
            </button>
          </div>
        </div>

        {/* Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="vedic-label">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={lat.toFixed(4)}
              onChange={(e) => handleCoordinateChange(parseFloat(e.target.value), undefined)}
              className="vedic-input"
              placeholder="Latitude"
            />
          </div>
          <div>
            <label className="vedic-label">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={lon.toFixed(4)}
              onChange={(e) => handleCoordinateChange(undefined, parseFloat(e.target.value))}
              className="vedic-input"
              placeholder="Longitude"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-white/60 space-y-1 bg-white/5 rounded p-2.5 border border-white/10">
          <p className="flex items-center gap-2">
            <span className="text-vedic-saffron text-sm">✓</span> Click on map to set location
          </p>
          <p className="flex items-center gap-2">
            <span className="text-vedic-saffron text-sm">✓</span> Drag marker to fine-tune
          </p>
          <p className="flex items-center gap-2">
            <span className="text-vedic-saffron text-sm">✓</span> Edit coordinates directly
          </p>
        </div>
      </div>
    </div>
  );
}

