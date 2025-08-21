import { useState, useEffect } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationState {
  coordinates: GeolocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  permissionState: PermissionState | null;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    isLoading: false,
    error: null,
    isSupported: 'geolocation' in navigator,
    permissionState: null,
  });

  const requestLocation = () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: GeolocationCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setState(prev => ({
          ...prev,
          coordinates,
          isLoading: false,
          error: null,
        }));
      },
      (error) => {
        let errorMessage = 'Unable to retrieve location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. To see stories near you, please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again or continue browsing without location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage = 'Failed to get location. Please try again or continue without location features.';
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for iOS
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Check permission status
  useEffect(() => {
    if (!state.isSupported) return;

    const checkPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setState(prev => ({ ...prev, permissionState: permission.state }));
        
        permission.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: permission.state }));
        });
      } catch (error) {
        // Permission API not supported, continue without it
      }
    };

    checkPermission();
  }, [state.isSupported]);

  const clearLocation = () => {
    setState(prev => ({
      ...prev,
      coordinates: null,
      error: null,
    }));
  };

  return {
    ...state,
    requestLocation,
    clearLocation,
  };
};