import { Component } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false  // ← Ajouter cette ligne
})
export class Tab1Page {
  currentPosition: any = null;
  positions: any[] = [];      // historique des positions + photos
  watchId: string | null = null;
  isTracking = false;

  constructor() {
    this.loadPositions();
  }

  // Charger les positions depuis localStorage
  loadPositions() {
    const savedPositions = localStorage.getItem('geoPositions');
    if (savedPositions) {
      this.positions = JSON.parse(savedPositions);
    }
  }

  // Sauvegarder les positions dans localStorage
  savePositions() {
    localStorage.setItem('geoPositions', JSON.stringify(this.positions));
  }

  // 1) Position unique
  async getCurrentPosition() {
    try {
      // Vérifier si on est en mode web
      const isWeb = (window as any).Capacitor?.getPlatform() === 'web' || 
                    !(window as any).Capacitor;
      
      if (isWeb) {
        // Utiliser l'API Geolocation du navigateur
        if (!navigator.geolocation) {
          alert('La géolocalisation n\'est pas supportée par votre navigateur.');
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed
            };
            
            this.currentPosition = { coords, timestamp: position.timestamp };
            this.positions.unshift({
              coords: coords,
              timestamp: new Date().toLocaleString('fr-FR'),
              photo: null,
            });
            this.savePositions(); // Sauvegarder
          },
          (error) => {
            let errorMsg = 'Erreur de géolocalisation';
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMsg = 'Permission de géolocalisation refusée';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMsg = 'Position indisponible';
                break;
              case error.TIMEOUT:
                errorMsg = 'Délai d\'attente dépassé';
                break;
            }
            alert(errorMsg);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        // Mode Android/iOS - utiliser Capacitor Geolocation
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          alert('Permission GPS refusée.');
          return;
        }
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
        this.currentPosition = coordinates;
        this.positions.unshift({
          coords: coordinates.coords,
          timestamp: new Date().toLocaleString('fr-FR'),
          photo: null,
        });
        this.savePositions(); // Sauvegarder
      }
    } catch (error: any) {
      alert('Erreur GPS : ' + (error?.message || 'Inconnue'));
    }
  }

  // 2) Suivi continu
  async toggleTracking() {
    try {
      // Si déjà en suivi → on arrête
      if (this.isTracking) {
        if (this.watchId) {
          await Geolocation.clearWatch({ id: this.watchId });
        }
        this.isTracking = false;
        this.watchId = null;
        return;
      }

      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') {
        alert('Permission GPS refusée.');
        return;
      }

      const watchPromise = Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 10000 },
        (position, err) => {
          if (err) {
            console.error('Erreur watchPosition:', err);
            return;
          }
          if (position) {
            this.currentPosition = position;
            this.positions.unshift({
              coords: position.coords,
              timestamp: new Date().toLocaleString('fr-FR'),
              photo: null,
            });
            this.savePositions(); // Sauvegarder
          }
        }
      ); // retourne un ID de watch

      this.watchId = await watchPromise;
      this.isTracking = true;
    } catch (error: any) {
      const errorMsg = error?.message || 'Inconnue';
      if (errorMsg.includes('not implemented') || errorMsg.includes('Not implemented')) {
        alert('⚠️ Le suivi continu ne fonctionne qu\'en mode Android.\nUtilisez "Position actuelle" pour tester en mode web.');
      } else {
        alert('Erreur suivi : ' + errorMsg);
      }
    }
  }

  // 3) Prendre une photo pour une position donnée (Objectif 2)
  async takePhoto(index: number) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      }); // image.webPath pour <img>
      this.positions[index].photo = image.webPath;
      this.savePositions(); // Sauvegarder
    } catch (error: any) {
      const errorMsg = error?.message || 'Inconnue';
      if (errorMsg.includes('not implemented') || errorMsg.includes('Not implemented') || errorMsg.includes('not available')) {
        alert('⚠️ La caméra ne fonctionne qu\'en mode Android.\nTestez sur un appareil réel ou émulateur.');
      } else {
        alert('Erreur photo : ' + errorMsg);
      }
    }
  }
}