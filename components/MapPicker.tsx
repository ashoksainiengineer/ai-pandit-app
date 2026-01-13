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

  // Prevent map interactions when interacting with search
  const handleSearchContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    
    // Fix Leaflet default icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    
    const mapInstance = L.map(mapRef.current, {
      scrollWheelZoom: true,
      dragging: true,
      zoomControl: true,
      attributionControl: false,
    }).setView([lat, lon], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add marker with custom icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background: linear-gradient(135deg, #E8A849, #F5A623); width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">📍</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const markerInstance = L.marker([lat, lon], {
      draggable: true,
      title: 'Birth Location Marker',
      icon: customIcon,
      zIndexOffset: 1000,
    }).addTo(mapInstance)
      .bindPopup(`<div style="text-align: center; padding: 8px;">
        <p style="font-weight: bold; margin: 0 0 4px 0; color: #E8A849;">Birth Location</p>
        <p style="font-size: 12px; margin: 2px 0; color: #333;">Lat: ${lat.toFixed(4)}</p>
        <p style="font-size: 12px; margin: 2px 0; color: #333;">Lon: ${lon.toFixed(4)}</p>
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
      {/* Map Container with Fixed Search Inside */}
      <div className="relative w-full rounded-lg border border-vedic-saffron/30 overflow-hidden bg-slate-900 shadow-2xl z-0 isolate">
        {/* Fixed Search Box - Always Visible */}
        <div
          className="absolute top-3 left-3 right-3 sm:left-4 sm:right-4 sm:top-4 z-10 pointer-events-none max-w-md mx-auto"
          ref={searchDropdownRef}
          onClick={handleSearchContainerClick}
        >
          <div className="relative pointer-events-auto">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-vedic-saffron pointer-events-none z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleCitySearch(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSearchDropdown(true)}
              placeholder="🔍 Search city..."
              className="w-full pl-9 pr-9 py-2.5 bg-white/95 border-2 border-vedic-saffron/70 rounded-lg text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-vedic-saffron focus:border-vedic-saffron text-sm font-medium shadow-lg hover:bg-white hover:border-vedic-saffron transition-all duration-200 backdrop-blur-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-2.5 top-2.5 w-4 h-4 text-vedic-saffron animate-spin" />
            )}
            
            {/* Search Dropdown - Always Visible When Results */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 backdrop-blur-sm border-2 border-vedic-saffron/50 rounded-lg overflow-hidden z-20 shadow-lg max-h-48 overflow-y-auto">
                <div className="bg-vedic-saffron/5 px-3 py-1.5 border-b border-vedic-saffron/30 sticky top-0">
                  <p className="text-xs font-semibold text-vedic-saffron uppercase tracking-wide">{searchResults.length} Results</p>
                </div>
                {searchResults.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchSelect(city);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-vedic-saffron/20 transition-colors border-b border-slate-200/50 last:border-b-0 text-sm"
                  >
                    <div className="font-semibold text-slate-900 text-sm">{city.name}</div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">
                      {[city.district, city.state, city.country].filter(Boolean).join(' • ')}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* No Results Message */}
            {showSearchDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white/95 border-2 border-vedic-saffron/50 rounded-lg z-20 shadow-lg p-3">
                <p className="text-sm text-slate-600 text-center">No cities found. Try a different name.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map with proper z-index and isolation */}
        <div
          ref={mapRef}
          className="w-full h-[400px] sm:h-[450px] md:h-[500px] relative"
          style={{ zIndex: 0, isolation: 'isolate' }}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-lg z-0">
            <Loader2 className="w-8 h-8 text-vedic-saffron animate-spin" />
          </div>
        )}
      </div>

      {/* Coordinate Display & Inputs */}
      <div className="bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-vedic-saffron/20 rounded-lg p-4 space-y-3 backdrop-blur-sm">
        {/* Current Coordinates Display */}
        <div className="bg-amber-500/5 border border-amber-500/40 rounded-lg p-3 hover:border-amber-500/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Location:</span>
              <span className="text-sm text-amber-500 font-mono font-medium">
                {lat.toFixed(4)}° N, {Math.abs(lon).toFixed(4)}° {lon >= 0 ? 'E' : 'W'}
              </span>
            </div>
            <button
              onClick={copyCoordinates}
              className="p-1.5 hover:bg-amber-500/20 rounded-md transition-colors"
              title="Copy coordinates"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-amber-500/70 hover:text-amber-500" />
              )}
            </button>
          </div>
        </div>

        {/* Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Latitude</label>
            <input
              type="number"
              step="0.0001"
              value={lat.toFixed(4)}
              onChange={(e) => handleCoordinateChange(parseFloat(e.target.value), undefined)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Latitude"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Longitude</label>
            <input
              type="number"
              step="0.0001"
              value={lon.toFixed(4)}
              onChange={(e) => handleCoordinateChange(undefined, parseFloat(e.target.value))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Longitude"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-white/60 space-y-1 bg-white/5 rounded p-2.5 border border-white/10">
          <p className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">✓</span> Click on map to set location
          </p>
          <p className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">✓</span> Drag marker to fine-tune
          </p>
          <p className="flex items-center gap-2">
            <span className="text-amber-500 text-sm">✓</span> Edit coordinates directly
          </p>
        </div>
      </div>
    </div>
  );
}
