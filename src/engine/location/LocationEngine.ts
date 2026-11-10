// LocationEngine: high-accuracy position + continuous watch
import type { GeoSnap } from '../../lib/types';

export class LocationEngine {
  private watchId: number | null = null;
  last: GeoSnap | null = null;

  async getCurrent(): Promise<GeoSnap | null> {
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.last = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            at: new Date().toISOString(),
          };
          resolve(this.last);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    });
  }

  startWatch(onUpdate: (snap: GeoSnap) => void) {
    if (this.watchId !== null || !('geolocation' in navigator)) return;
    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.last = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          at: new Date().toISOString(),
        };
        onUpdate(this.last);
      },
      () => {
        /* keep last */
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );
  }

  stopWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}
