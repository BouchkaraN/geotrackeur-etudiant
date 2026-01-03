import { Component, OnInit } from '@angular/core';

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
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {
  positions: Position[] = [];
  statistics = {
    totalPositions: 0,
    withPhotos: 0,
    averageAccuracy: 0,
    totalDistance: 0,
    firstDate: '',
    lastDate: ''
  };

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    const savedPositions = localStorage.getItem('geoPositions');
    if (savedPositions) {
      this.positions = JSON.parse(savedPositions);
      this.calculateStatistics();
    }
  }

  calculateStatistics() {
    if (this.positions.length === 0) {
      return;
    }

    // Total positions
    this.statistics.totalPositions = this.positions.length;

    // Positions avec photos
    this.statistics.withPhotos = this.positions.filter(p => p.photo).length;

    // Précision moyenne
    const totalAccuracy = this.positions.reduce((sum, p) => sum + p.coords.accuracy, 0);
    this.statistics.averageAccuracy = totalAccuracy / this.positions.length;

    // Distance totale parcourue (formule de Haversine)
    this.statistics.totalDistance = this.calculateTotalDistance();

    // Dates
    if (this.positions.length > 0) {
      this.statistics.lastDate = this.positions[0].timestamp;
      this.statistics.firstDate = this.positions[this.positions.length - 1].timestamp;
    }
  }

  calculateTotalDistance(): number {
    if (this.positions.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < this.positions.length - 1; i++) {
      const pos1 = this.positions[i];
      const pos2 = this.positions[i + 1];
      totalDistance += this.haversineDistance(
        pos1.coords.latitude, pos1.coords.longitude,
        pos2.coords.latitude, pos2.coords.longitude
      );
    }
    return totalDistance;
  }

  // Formule de Haversine pour calculer la distance entre deux points GPS
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  exportToCSV() {
    if (this.positions.length === 0) {
      alert('Aucune position à exporter');
      return;
    }

    // Créer le contenu CSV
    let csvContent = 'Date/Heure,Latitude,Longitude,Précision (m),Photo\n';
    
    this.positions.forEach(pos => {
      const row = [
        pos.timestamp,
        pos.coords.latitude.toFixed(6),
        pos.coords.longitude.toFixed(6),
        pos.coords.accuracy.toFixed(0),
        pos.photo ? 'Oui' : 'Non'
      ].join(',');
      csvContent += row + '\n';
    });

    // Créer le fichier et le télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `positions_gps_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Fichier CSV exporté avec succès !');
  }

  exportToJSON() {
    if (this.positions.length === 0) {
      alert('Aucune position à exporter');
      return;
    }

    const jsonContent = JSON.stringify(this.positions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `positions_gps_${new Date().getTime()}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Fichier JSON exporté avec succès !');
  }

  clearAllData() {
    if (confirm('⚠️ Voulez-vous vraiment supprimer TOUTES les données ?\nCette action est irréversible.')) {
      localStorage.removeItem('geoPositions');
      this.positions = [];
      this.calculateStatistics();
      alert('Toutes les données ont été supprimées.');
    }
  }
}