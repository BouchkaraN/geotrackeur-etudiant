import { Component, OnInit, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: string;
  photo: string | null;
}

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements AfterViewInit {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  positions: Position[] = [];

  ngAfterViewInit() {
    // Récupérer les positions depuis le localStorage
    this.loadPositions();
    this.initMap();
  }

  loadPositions() {
    const savedPositions = localStorage.getItem('geoPositions');
    if (savedPositions) {
      this.positions = JSON.parse(savedPositions);
      console.log('Positions chargées:', this.positions.length);
    }
  }

  initMap() {
    // Centre par défaut: Casablanca
    const defaultLat = 33.5731;
    const defaultLng = -7.5898;

    // Créer la carte
    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Fixer l'icône par défaut de Leaflet
    const iconDefault = L.icon({
      iconUrl: 'assets/marker-icon.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'assets/marker-shadow.png',
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    // Afficher les positions sur la carte
    this.displayPositions();
  }

  displayPositions() {
    // Supprimer les anciens markers
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    if (this.positions.length === 0) {
      return;
    }

    // Ajouter un marker pour chaque position
    this.positions.forEach((pos, index) => {
      const marker = L.marker([pos.coords.latitude, pos.coords.longitude])
        .addTo(this.map);

      // Popup avec informations
      const popupContent = `
        <div>
          <b>Position ${index + 1}</b><br>
          <small>${pos.timestamp}</small><br>
          Lat: ${pos.coords.latitude.toFixed(6)}<br>
          Lng: ${pos.coords.longitude.toFixed(6)}<br>
          Précision: ${pos.coords.accuracy.toFixed(0)}m
          ${pos.photo ? '<br><img src="' + pos.photo + '" width="100"/>' : ''}
        </div>
      `;
      marker.bindPopup(popupContent);

      this.markers.push(marker);
    });

    // Tracer une ligne entre les positions
    if (this.positions.length > 1) {
      const latlngs: [number, number][] = this.positions.map(pos => 
        [pos.coords.latitude, pos.coords.longitude]
      );
      L.polyline(latlngs, { color: 'blue', weight: 3 }).addTo(this.map);
    }

    // Centrer la carte sur les positions
    const bounds = L.latLngBounds(
      this.positions.map(pos => [pos.coords.latitude, pos.coords.longitude])
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  refreshMap() {
    this.loadPositions();
    this.displayPositions();
  }

  clearAllPositions() {
    if (confirm('Voulez-vous vraiment supprimer toutes les positions ?')) {
      localStorage.removeItem('geoPositions');
      this.positions = [];
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    }
  }
}