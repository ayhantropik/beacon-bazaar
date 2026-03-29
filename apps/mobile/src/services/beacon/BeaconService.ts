import { Platform, PermissionsAndroid } from 'react-native';
import type { BeaconDetection } from '@beacon-bazaar/shared';

type BeaconCallback = (beacons: BeaconDetection[]) => void;

class BeaconService {
  private isScanning = false;
  private listeners: BeaconCallback[] = [];
  private scanInterval: ReturnType<typeof setInterval> | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];
        // Android 12+ needs BLUETOOTH_SCAN and BLUETOOTH_CONNECT
        if (Platform.Version >= 31) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          );
        }
        const results = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(results).every(
          (r) => r === PermissionsAndroid.RESULTS.GRANTED,
        );
      } catch {
        return false;
      }
    }
    // iOS: Bluetooth and location permissions handled by Info.plist
    return true;
  }

  async checkBluetoothState(): Promise<boolean> {
    // In production: Use react-native-ble-plx BleManager.state()
    // Returns true optimistically; actual BLE state check requires native module
    return true;
  }

  async startScanning(uuid: string): Promise<void> {
    if (this.isScanning) return;

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Beacon tarama izni verilmedi');
    }

    const btEnabled = await this.checkBluetoothState();
    if (!btEnabled) {
      throw new Error("Bluetooth kapalı. Lütfen Bluetooth'u açın");
    }

    this.isScanning = true;

    // Production implementation with react-native-ble-plx:
    // const manager = new BleManager();
    // manager.startDeviceScan([uuid], { allowDuplicates: true }, (error, device) => {
    //   if (error) { console.warn('BLE scan error:', error); return; }
    //   if (device) {
    //     const beacon: BeaconDetection = {
    //       uuid, major: parseMajor(device), minor: parseMinor(device),
    //       rssi: device.rssi || -100, distance: this.calculateDistance(device.rssi || -100, -59),
    //       proximity: this.getProximity(this.calculateDistance(device.rssi || -100, -59)),
    //       timestamp: new Date(),
    //     };
    //     this.notifyListeners([beacon]);
    //   }
    // });

    console.log(`Beacon scanning started for UUID: ${uuid}`);
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    // Production: manager.stopDeviceScan();
    console.log('Beacon scanning stopped');
  }

  onBeaconsDetected(callback: BeaconCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(beacons: BeaconDetection[]): void {
    this.listeners.forEach((cb) => cb(beacons));
  }

  calculateDistance(rssi: number, txPower: number): number {
    if (rssi === 0) return -1;
    const ratio = (rssi * 1.0) / txPower;
    if (ratio < 1.0) {
      return Math.pow(ratio, 10);
    }
    return 0.89976 * Math.pow(ratio, 7.7095) + 0.111;
  }

  getProximity(distance: number): 'immediate' | 'near' | 'far' | 'unknown' {
    if (distance < 0) return 'unknown';
    if (distance < 0.5) return 'immediate';
    if (distance < 3) return 'near';
    return 'far';
  }
}

export const beaconService = new BeaconService();
