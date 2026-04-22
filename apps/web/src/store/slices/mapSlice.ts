import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GeoPoint } from '@beacon-bazaar/shared';

interface MapState {
  center: GeoPoint;
  zoom: number;
  userLocation: GeoPoint | null;
  isLocationLoading: boolean;
  locationError: string | null;
  selectedMarkerId: string | null;
  showHeatmap: boolean;
  mapStyle: 'default' | 'satellite' | 'terrain' | 'dark' | 'hybrid';
  // Indoor Maps
  indoorEnabled: boolean;
  activeIndoorMapId: string | null;
  activeFloor: number;
}

const ISTANBUL_CENTER: GeoPoint = { latitude: 41.0082, longitude: 28.9784 };

const initialState: MapState = {
  center: ISTANBUL_CENTER,
  zoom: 13,
  userLocation: null,
  isLocationLoading: false,
  locationError: null,
  selectedMarkerId: null,
  showHeatmap: false,
  mapStyle: 'hybrid',
  indoorEnabled: false,
  activeIndoorMapId: null,
  activeFloor: 0,
};

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCenter: (state, action: PayloadAction<GeoPoint>) => {
      state.center = action.payload;
    },
    setZoom: (state, action: PayloadAction<number>) => {
      state.zoom = action.payload;
    },
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
    selectMarker: (state, action: PayloadAction<string | null>) => {
      state.selectedMarkerId = action.payload;
    },
    toggleHeatmap: (state) => {
      state.showHeatmap = !state.showHeatmap;
    },
    setMapStyle: (state, action: PayloadAction<MapState['mapStyle']>) => {
      state.mapStyle = action.payload;
    },
    setIndoorEnabled: (state, action: PayloadAction<boolean>) => {
      state.indoorEnabled = action.payload;
    },
    setActiveIndoorMap: (state, action: PayloadAction<string | null>) => {
      state.activeIndoorMapId = action.payload;
    },
    setActiveFloor: (state, action: PayloadAction<number>) => {
      state.activeFloor = action.payload;
    },
  },
});

export const {
  setCenter,
  setZoom,
  setUserLocation,
  setLocationLoading,
  setLocationError,
  selectMarker,
  toggleHeatmap,
  setMapStyle,
  setIndoorEnabled,
  setActiveIndoorMap,
  setActiveFloor,
} = mapSlice.actions;
export default mapSlice.reducer;
