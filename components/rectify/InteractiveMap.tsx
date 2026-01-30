'use client';

// components/rectify/InteractiveMap.tsx
// Interactive OpenStreetMap with zoom, pan, and click-to-select

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface InteractiveMapProps {
    center: { lat: number; lng: number };
    zoom: number;
    marker: { lat: number; lng: number } | null;
    onLocationSelect: (lat: number, lng: number) => void;
    onCenterChange: (center: { lat: number; lng: number }) => void;
}

// Fix Leaflet default marker icon issue in Next.js
const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export default function InteractiveMap({
    center,
    zoom,
    marker,
    onLocationSelect,
    onCenterChange
}: InteractiveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        // Create map
        const map = L.map(mapRef.current, {
            center: [center.lat, center.lng],
            zoom: zoom,
            zoomControl: true,
            attributionControl: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        // Handle click to place marker
        map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            onLocationSelect(lat, lng);
        });

        // Handle move end to track center
        map.on('moveend', () => {
            const newCenter = map.getCenter();
            onCenterChange({ lat: newCenter.lat, lng: newCenter.lng });
        });

        leafletMap.current = map;
        setIsMapReady(true);

        // Cleanup
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    // Update center when it changes from outside
    useEffect(() => {
        if (leafletMap.current && isMapReady) {
            leafletMap.current.setView([center.lat, center.lng], zoom, {
                animate: true,
                duration: 0.5
            });
        }
    }, [center.lat, center.lng, zoom, isMapReady]);

    // Update or create marker
    useEffect(() => {
        if (!leafletMap.current || !isMapReady) return;

        if (marker) {
            if (markerRef.current) {
                markerRef.current.setLatLng([marker.lat, marker.lng]);
            } else {
                markerRef.current = L.marker([marker.lat, marker.lng], {
                    icon: defaultIcon,
                    draggable: true
                }).addTo(leafletMap.current);

                // Handle marker drag
                markerRef.current.on('dragend', () => {
                    const pos = markerRef.current?.getLatLng();
                    if (pos) {
                        onLocationSelect(pos.lat, pos.lng);
                    }
                });
            }
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    }, [marker, isMapReady, onLocationSelect]);

    return (
        <div className="relative w-full h-72 md:h-80 rounded-xl overflow-hidden border-2 border-[#EBE2D6] shadow-lg">
            <div ref={mapRef} className="w-full h-full" />
        </div>
    );
}
