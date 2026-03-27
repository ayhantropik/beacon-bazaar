import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  startScanning,
  stopScanning,
  setDetectedBeacons,
  setScanError,
} from '../store/slices/beaconSlice';
import { beaconService } from '../services/beacon/BeaconService';
import { env } from '../config/env';

export function useBeacon() {
  const dispatch = useAppDispatch();
  const { isScanning, detectedBeacons, nearestBeacon, scanError } = useAppSelector(
    (state) => state.beacon,
  );

  const startScan = useCallback(async () => {
    try {
      dispatch(startScanning());
      await beaconService.startScanning(env.beaconUUID);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Beacon tarama başarısız';
      dispatch(setScanError(message));
    }
  }, [dispatch]);

  const stopScan = useCallback(async () => {
    await beaconService.stopScanning();
    dispatch(stopScanning());
  }, [dispatch]);

  useEffect(() => {
    const unsubscribe = beaconService.onBeaconsDetected((beacons) => {
      dispatch(setDetectedBeacons(beacons));
    });
    return () => {
      unsubscribe();
      beaconService.stopScanning();
    };
  }, [dispatch]);

  return {
    isScanning,
    detectedBeacons,
    nearestBeacon,
    scanError,
    startScan,
    stopScan,
  };
}
