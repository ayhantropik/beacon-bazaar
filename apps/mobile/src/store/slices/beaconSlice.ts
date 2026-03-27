import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BeaconDetection } from '@beacon-bazaar/shared';

interface BeaconState {
  isScanning: boolean;
  detectedBeacons: BeaconDetection[];
  nearestBeacon: BeaconDetection | null;
  scanError: string | null;
  bluetoothEnabled: boolean;
  permissionGranted: boolean;
}

const initialState: BeaconState = {
  isScanning: false,
  detectedBeacons: [],
  nearestBeacon: null,
  scanError: null,
  bluetoothEnabled: false,
  permissionGranted: false,
};

const beaconSlice = createSlice({
  name: 'beacon',
  initialState,
  reducers: {
    startScanning: (state) => {
      state.isScanning = true;
      state.scanError = null;
    },
    stopScanning: (state) => {
      state.isScanning = false;
    },
    setDetectedBeacons: (state, action: PayloadAction<BeaconDetection[]>) => {
      state.detectedBeacons = action.payload;
      state.nearestBeacon =
        action.payload.length > 0
          ? action.payload.reduce((nearest, current) =>
              current.distance < nearest.distance ? current : nearest,
            )
          : null;
    },
    addDetectedBeacon: (state, action: PayloadAction<BeaconDetection>) => {
      const index = state.detectedBeacons.findIndex(
        (b) => b.beaconId === action.payload.beaconId,
      );
      if (index >= 0) {
        state.detectedBeacons[index] = action.payload;
      } else {
        state.detectedBeacons.push(action.payload);
      }
    },
    setScanError: (state, action: PayloadAction<string>) => {
      state.scanError = action.payload;
      state.isScanning = false;
    },
    setBluetoothEnabled: (state, action: PayloadAction<boolean>) => {
      state.bluetoothEnabled = action.payload;
    },
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionGranted = action.payload;
    },
    clearBeacons: (state) => {
      state.detectedBeacons = [];
      state.nearestBeacon = null;
    },
  },
});

export const {
  startScanning,
  stopScanning,
  setDetectedBeacons,
  addDetectedBeacon,
  setScanError,
  setBluetoothEnabled,
  setPermissionGranted,
  clearBeacons,
} = beaconSlice.actions;
export default beaconSlice.reducer;
