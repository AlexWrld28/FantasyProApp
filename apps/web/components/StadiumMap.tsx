"use client";

import { useEffect, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { StadiumMapEntry } from "../lib/stadium-data";

type StadiumMapProps = {
  stadiums: StadiumMapEntry[];
  selectedStadium: StadiumMapEntry;
  onSelectStadium: (stadiumId: string) => void;
};

export function StadiumMap({ stadiums, selectedStadium, onSelectStadium }: StadiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function drawMap() {
      const L = await import("leaflet");

      if (!containerRef.current || cancelled) {
        return;
      }

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          attributionControl: false,
          scrollWheelZoom: true,
          zoomControl: false
        }).setView([selectedStadium.latitude, selectedStadium.longitude], 14);

        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        L.control.attribution({ position: "bottomleft" }).addTo(mapRef.current);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap"
        }).addTo(mapRef.current);
      }

      markerLayerRef.current?.remove();
      const markers = L.layerGroup().addTo(mapRef.current);

      for (const stadium of stadiums) {
        const selected = stadium.id === selectedStadium.id;
        const marker = L.circleMarker([stadium.latitude, stadium.longitude], {
          color: selected ? "#ffffff" : "#172027",
          fillColor: stadium.color || "#2d6a4f",
          fillOpacity: selected ? 0.96 : 0.72,
          opacity: 0.92,
          radius: selected ? 10 : 6,
          weight: selected ? 3 : 1
        });

        marker.bindTooltip(`${stadium.team} - ${stadium.stadium}`);
        marker.bindPopup(popupHtml(stadium));
        marker.on("click", () => onSelectStadium(stadium.id));
        marker.addTo(markers);
      }

      markerLayerRef.current = markers;
      mapRef.current.setView([selectedStadium.latitude, selectedStadium.longitude], 15, {
        animate: true
      });
      window.setTimeout(() => mapRef.current?.invalidateSize(), 120);
    }

    drawMap();

    return () => {
      cancelled = true;
    };
  }, [onSelectStadium, selectedStadium, stadiums]);

  return <div className="stadium-map-canvas" ref={containerRef} />;
}

function popupHtml(stadium: StadiumMapEntry): string {
  const logo = stadium.logoUrl
    ? `<img src="${stadium.logoUrl}" alt="" style="width:42px;height:42px;object-fit:contain;" />`
    : "";

  return `
    <div style="min-width:180px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        ${logo}
        <div>
          <strong style="display:block;">${escapeHtml(stadium.team)}</strong>
          <span style="color:#68717a;">${escapeHtml(stadium.conference || "Independent")}</span>
        </div>
      </div>
      <div style="font-weight:700;">${escapeHtml(stadium.stadium)}</div>
      <div>${escapeHtml(stadium.city)}, ${escapeHtml(stadium.state)}</div>
      <div>Capacity: ${stadium.capacity?.toLocaleString() ?? "Unknown"}</div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
