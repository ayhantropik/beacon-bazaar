import type { BeaconDetection } from '@beacon-bazaar/shared';

type BeaconCallback = (beacons: BeaconDetection[]) => void;

class BeaconService {
  private isScanning = false;
  private listeners: BeaconCallback[] = [];

  async requestPermissions(): Promise<boolean> {
    // Platform-specific permission requests
    // iOS: Core Location + Bluetooth
    // Android: ACCESS_FINE_LOCATION + BLUETOOTH_SCAN + BLUETOOTH_CONNECT
    return true;
  }

  async checkBluetoothState(): Promise<boolean> {
    // Check if Bluetooth is enabled
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
      throw new Error('Bluetooth kapalı. Lütfen Bluetooth\'u açın');
    }

    this.isScanning = true;

    // BLE scanning implementation
    // Using react-native-ble-plx:
    // manager.startDeviceScan(
    //   [uuid],
    //   { allowDuplicates: true },
    //   (error, device) => { ... }
    // );

    console.log(`Beacon scanning started for UUID: ${uuid}`);
  }

  async stopScanning(): Promise<void> {
    this.isScanning = false;
    // manager.stopDeviceScan();
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
