/**
 * BirthPlacePicker Component
 * Sacred Ivory Light Theme - Compact God Tier Design
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { debounce } from '@/lib/debounce';
import { MapPin, Search, Crosshair, Globe } from 'lucide-react';

const InteractiveMap = dynamic(() => import('./InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-[#F5EFE7] rounded-lg flex items-center justify-center border border-[#E8E0D5]">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#7A756F] text-xs mt-2">Loading map...</p>
      </div>
    </div>
  )
});

interface LocationResult {
  id: string;
  city: string;
  district: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  displayName: string;
}

interface BirthPlacePickerProps {
  birthPlace: string;
  latitude: number;
  longitude: number;
  timezone: number;
  onUpdate: (updates: { birthPlace: string; latitude: number; longitude: number; timezone: number; }) => void;
}

type InputMode = 'search' | 'manual' | 'map';

export default function BirthPlacePicker({ birthPlace, latitude, longitude, timezone, onUpdate }: BirthPlacePickerProps) {
  const [mode, setMode] = useState<InputMode>('search');
  const [searchQuery, setSearchQuery] = useState(birthPlace);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);

  const [manualLat, setManualLat] = useState(latitude ? latitude.toString() : '');
  const [manualLng, setManualLng] = useState(longitude ? longitude.toString() : '');
  const [manualTimezone, setManualTimezone] = useState(timezone ? timezone.toString() : '5.5');

  const [mapQuery, setMapQuery] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: latitude || 28.6139, lng: longitude || 77.2090 });
  const [mapZoom, setMapZoom] = useState(5);
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(latitude && longitude ? { lat: latitude, lng: longitude } : null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTimezoneForCountry = (country: string, lng: number): string => {
    const countryTimezones: Record<string, string> = {
      'India': '5.5', 'Nepal': '5.75', 'Pakistan': '5', 'Bangladesh': '6',
      'Sri Lanka': '5.5', 'Myanmar': '6.5', 'Thailand': '7', 'Vietnam': '7',
      'Malaysia': '8', 'Singapore': '8', 'Indonesia': '7', 'Philippines': '8',
      'China': '8', 'Japan': '9', 'South Korea': '9', 'Australia': '10',
      'New Zealand': '12', 'United Kingdom': '0', 'United States': '-5',
      'Canada': '-5', 'Brazil': '-3', 'Germany': '1', 'France': '1',
      'Italy': '1', 'Spain': '1', 'Russia': '3', 'UAE': '4',
      'Saudi Arabia': '3', 'South Africa': '2', 'Egypt': '2', 'Kenya': '3',
      'Nigeria': '1',
    };
    for (const [countryName, tz] of Object.entries(countryTimezones)) {
      if (country.toLowerCase().includes(countryName.toLowerCase())) return tz;
    }
    const offset = Math.round(lng / 15 * 2) / 2;
    return offset.toString();
  };

  const searchCities = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) { setSearchResults([]); return; }
      setIsSearching(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`, { headers: { 'User-Agent': 'AIPandit/1.0' } });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        const results: LocationResult[] = data.map((item: any, index: number) => ({
          id: `${index}-${item.place_id}`,
          city: item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || item.name || '',
          district: item.address?.county || item.address?.state_district || '',
          state: item.address?.state || '',
          country: item.address?.country || '',
          pincode: item.address?.postcode || '',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          timezone: getTimezoneForCountry(item.address?.country || '', parseFloat(item.lon)),
          displayName: item.display_name
        }));
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('City search failed:', error);
        setSearchResults([]);
      } finally { setIsSearching(false); }
    }, 300), []
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchCities(value);
  };

  const handleSelectLocation = (location: LocationResult) => {
    setSelectedLocation(location);
    const formattedPlace = [location.city, location.district, location.state, location.country].filter(Boolean).join(', ');
    setSearchQuery(formattedPlace);
    setShowDropdown(false);
    onUpdate({ birthPlace: formattedPlace, latitude: location.latitude, longitude: location.longitude, timezone: parseFloat(location.timezone) });
  };

  const handleManualUpdate = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    const tz = parseFloat(manualTimezone);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    onUpdate({ birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, latitude: lat, longitude: lng, timezone: tz });
  };

  const handleMapSearch = async () => {
    if (!mapQuery.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapQuery)}&limit=1&addressdetails=1`, { headers: { 'User-Agent': 'AIPandit/1.0' } });
      const data = await response.json();
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setMapCenter({ lat, lng });
        setMapZoom(12);
        setMapMarker({ lat, lng });
        const location: LocationResult = { id: result.place_id, city: result.address?.city || result.address?.town || result.name || '', district: result.address?.county || '', state: result.address?.state || '', country: result.address?.country || '', pincode: result.address?.postcode || '', latitude: lat, longitude: lng, timezone: getTimezoneForCountry(result.address?.country || '', lng), displayName: result.display_name };
        const formattedPlace = [location.city, location.district, location.state, location.country].filter(Boolean).join(', ');
        onUpdate({ birthPlace: formattedPlace, latitude: lat, longitude: lng, timezone: parseFloat(location.timezone) });
      }
    } catch (error) { console.error('Map search failed:', error); }
  };

  return (
    <div className="space-y-3">
      {/* Mode Selector - Compact Tabs */}
      <div className="flex gap-1 p-1 bg-[#F5EFE7] rounded-lg border border-[#E8E0D5]">
        {[
          { id: 'search', label: 'Search', icon: Search },
          { id: 'manual', label: 'Manual Coordinates', icon: Crosshair },
          { id: 'map', label: 'Map', icon: MapPin }
        ].map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} type="button" onClick={() => setMode(m.id as InputMode)} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${mode === m.id ? 'bg-white text-[#B8860B] shadow-sm border border-[#E8E0D5]' : 'text-[#7A756F] hover:text-[#4A453F]'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode 1: City Search */}
      {mode === 'search' && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              className="w-full h-10 px-4 pr-10 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm placeholder-[#A8A39D] focus:border-[#D4A853] focus:ring-2 focus:ring-[#D4A853]/10 outline-none"
              placeholder="Type city name..."
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-[#E8E0D5] rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => handleSelectLocation(result)}
                  className="w-full text-left px-4 py-3 hover:bg-[#F5EFE7] transition-colors border-b border-[#F0E8DE] last:border-0"
                >
                  <div className="font-medium text-[#1A1612] text-sm">{result.city || 'Unknown Location'}{result.district && <span className="text-[#7A756F]"> • {result.district}</span>}</div>
                  <div className="text-xs text-[#7A756F]">{[result.state, result.country].filter(Boolean).join(', ')}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#B8860B]">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {result.latitude.toFixed(4)}°, {result.longitude.toFixed(4)}°</span>
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> UTC{parseFloat(result.timezone) >= 0 ? '+' : ''}{result.timezone}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="mt-3 p-3 bg-[#2D7A5C]/5 border border-[#2D7A5C]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[#2D7A5C] text-xs font-semibold mb-2"><span>✓</span><span>Location Selected</span></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div><span className="text-[#7A756F]">City:</span><span className="text-[#1A1612] ml-1 font-medium">{selectedLocation.city}</span></div>
                {selectedLocation.district && (<div><span className="text-[#7A756F]">District:</span><span className="text-[#1A1612] ml-1">{selectedLocation.district}</span></div>)}
                <div><span className="text-[#7A756F]">State:</span><span className="text-[#1A1612] ml-1">{selectedLocation.state}</span></div>
                <div><span className="text-[#7A756F]">Country:</span><span className="text-[#1A1612] ml-1">{selectedLocation.country}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Manual Coordinates - Compact */}
      {mode === 'manual' && (
        <div className="space-y-3">
          <div className="p-3 bg-[#B8860B]/5 border border-[#B8860B]/20 rounded-lg text-xs text-[#4A453F]">
            <span className="font-semibold">💡 Tip:</span> Find coordinates from Google Maps
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-[#7A756F] mb-1 uppercase tracking-wider">Latitude</label>
              <input type="number" step="0.0001" min="-90" max="90" value={manualLat} onChange={(e) => setManualLat(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm font-mono focus:border-[#D4A853] outline-none" placeholder="28.6139" />
            </div>
            <div>
              <label className="block text-[10px] text-[#7A756F] mb-1 uppercase tracking-wider">Longitude</label>
              <input type="number" step="0.0001" min="-180" max="180" value={manualLng} onChange={(e) => setManualLng(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm font-mono focus:border-[#D4A853] outline-none" placeholder="77.2090" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-[#7A756F] mb-1 uppercase tracking-wider">Timezone</label>
            <select value={manualTimezone} onChange={(e) => setManualTimezone(e.target.value)} className="w-full h-10 px-3 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm focus:border-[#D4A853] outline-none">
              <option value="-12">UTC-12:00</option>
              <option value="-11">UTC-11:00</option>
              <option value="-10">UTC-10:00 (Hawaii)</option>
              <option value="-9">UTC-09:00 (Alaska)</option>
              <option value="-8">UTC-08:00 (Pacific)</option>
              <option value="-7">UTC-07:00 (Mountain)</option>
              <option value="-6">UTC-06:00 (Central)</option>
              <option value="-5">UTC-05:00 (Eastern)</option>
              <option value="-4">UTC-04:00 (Atlantic)</option>
              <option value="-3">UTC-03:00 (Brazil)</option>
              <option value="-2">UTC-02:00</option>
              <option value="-1">UTC-01:00</option>
              <option value="0">UTC+00:00 (London)</option>
              <option value="1">UTC+01:00 (Paris)</option>
              <option value="2">UTC+02:00 (Cairo)</option>
              <option value="3">UTC+03:00 (Moscow)</option>
              <option value="3.5">UTC+03:30 (Tehran)</option>
              <option value="4">UTC+04:00 (Dubai)</option>
              <option value="4.5">UTC+04:30 (Kabul)</option>
              <option value="5">UTC+05:00 (Pakistan)</option>
              <option value="5.5">UTC+05:30 (India)</option>
              <option value="5.75">UTC+05:45 (Nepal)</option>
              <option value="6">UTC+06:00 (Bangladesh)</option>
              <option value="6.5">UTC+06:30 (Myanmar)</option>
              <option value="7">UTC+07:00 (Bangkok)</option>
              <option value="8">UTC+08:00 (Singapore)</option>
              <option value="9">UTC+09:00 (Japan)</option>
              <option value="9.5">UTC+09:30 (Australia)</option>
              <option value="10">UTC+10:00 (Sydney)</option>
              <option value="11">UTC+11:00</option>
              <option value="12">UTC+12:00 (New Zealand)</option>
            </select>
          </div>
          <button type="button" onClick={handleManualUpdate} className="w-full h-10 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm">Apply Coordinates</button>
          {latitude !== undefined && longitude !== undefined && latitude !== 0 && longitude !== 0 && (
            <div className="p-3 bg-[#2D7A5C]/5 border border-[#2D7A5C]/20 rounded-lg text-xs">
              <span className="text-[#2D7A5C] font-semibold">✓ Current:</span>
              <span className="text-[#1A1612] ml-2 font-mono">{latitude.toFixed(4)}°, {longitude.toFixed(4)}° (UTC{timezone >= 0 ? '+' : ''}{timezone})</span>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Map Picker - Compact */}
      {mode === 'map' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input type="text" value={mapQuery} onChange={(e) => setMapQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()} className="flex-1 h-10 px-4 bg-white border border-[#E8E0D5] rounded-lg text-[#1A1612] text-sm focus:border-[#D4A853] outline-none" placeholder="Search location..." />
            <button type="button" onClick={handleMapSearch} className="px-4 h-10 bg-gradient-to-r from-[#B8860B] to-[#D4A853] text-white font-semibold rounded-lg hover:shadow-md transition-all text-sm">Search</button>
          </div>
          <InteractiveMap center={mapCenter} zoom={mapZoom} marker={mapMarker} onLocationSelect={async (lat, lng) => {
            setMapMarker({ lat, lng });
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, { headers: { 'User-Agent': 'AIPandit/1.0' } });
              const data = await response.json();
              const country = data.address?.country || '';
              const city = data.address?.city || data.address?.town || data.address?.village || '';
              const state = data.address?.state || '';
              const formattedPlace = [city, state, country].filter(Boolean).join(', ') || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
              onUpdate({ birthPlace: formattedPlace, latitude: lat, longitude: lng, timezone: parseFloat(getTimezoneForCountry(country, lng)) });
            } catch {
              onUpdate({ birthPlace: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, latitude: lat, longitude: lng, timezone: parseFloat(getTimezoneForCountry('', lng)) });
            }
          }} onCenterChange={setMapCenter} />
          {mapMarker && (
            <div className="p-3 bg-[#2D7A5C]/5 border border-[#2D7A5C]/20 rounded-lg">
              <div className="flex items-center gap-2 text-[#2D7A5C] text-xs font-semibold mb-1"><MapPin className="w-3.5 h-3.5" /><span>Selected</span></div>
              <div className="font-mono text-xs text-[#1A1612]">Lat: {mapMarker.lat.toFixed(6)}°, Lng: {mapMarker.lng.toFixed(6)}°</div>
            </div>
          )}
          <p className="text-[10px] text-[#7A756F] flex items-center gap-1"><span>💡</span> Search city, then click map to fine-tune</p>
        </div>
      )}

      {/* Current Selection */}
      {(latitude && longitude && mode !== 'search') && (
        <div className="p-3 bg-[#F5EFE7] rounded-lg border border-[#E8E0D5]">
          <div className="text-[10px] text-[#7A756F] mb-1 uppercase tracking-wider">Selected Location</div>
          <div className="text-sm text-[#1A1612] font-medium">{birthPlace || 'Not set'}</div>
          <div className="text-xs text-[#B8860B] font-mono mt-1">{latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E • UTC{timezone >= 0 ? '+' : ''}{timezone}</div>
        </div>
      )}
    </div>
  );
}
