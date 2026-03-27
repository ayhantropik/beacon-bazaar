import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GeoPoint } from '@beacon-bazaar/shared';

interface MapState {
  userLocation: GeoPoint | null;
  isLocationLoading: boolean;
  locationError: string | null;
  selectedStoreId: string | null;
  trackingEnabled: boolean;
}

const initialState: MapState = {
  userLocation: null,
  isLocationLoading: false,
  locationError: null,
  selectedStoreId: null,
  trackingEnabled: false,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setUserLocation: (state, action: PayloadAction<GeoPoint>) => {
      state.userLocation = action.payload;
      state.isLocationLoading = false;
      state.locationError = null;
    },
    setLocationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLocationLoading = action.payload;
    },
    setLocationError: (state, action: PayloadAction<string>) => {
      state.locationError = action.payload;
      state.isLocationLoading = false;
    },
    selectStore: (state, action: PayloadAction<string | null>) => {
      state.selectedStoreId = action.payload;
    },
    setTrackingEnabled: (state, action: PayloadAction<boolean>) => {
      state.trackingEnabled = action.payload;
    },
  },
});

export const {
  setUserLocation,
  setLocationLoading,
  setLocationError,
  selectStore,
  setTrackingEnabled,
} = mapSlice.actions;
export default mapSlice.reducer;
