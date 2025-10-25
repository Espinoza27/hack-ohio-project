// LocationTracker.js — React Native example for continuous location tracking

import React, { useState, useRef } from 'react';
import { View, Text, Button, Alert, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function LocationTracker() {
  const [status, setStatus] = useState('idle');
  const [location, setLocation] = useState(null);
  const watchIdRef = useRef(null);

  // Ask for location permission (differs for iOS vs Android)
  async function requestLocationPermission() {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

    const result = await request(permission);
    return result === RESULTS.GRANTED;
  }

  // Start tracking user's position
  async function startTracking() {
    const ok = await requestLocationPermission();
    if (!ok) {
      Alert.alert('Location permission is required to track your position.');
      return;
    }

    setStatus('tracking');

    // Watch for location updates
    watchIdRef.current = Geolocation.watchPosition(
      async (pos) => {
        console.log('pos', pos);

        const { latitude, longitude, accuracy } = pos.coords;
        const data = {
          lat: latitude,
          lon: longitude,
          accuracy,
          timestamp: new Date(pos.timestamp).toISOString(),
        };

        // Update UI with latest coordinates
        setLocation(data);

        // Try sending location to your backend server (optional)
        // Use a real server endpoint, e.g., "https://myserver.com/api/locations"
        try {
          const res = await fetch('https://example.com/api/locations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            console.warn('Server responded with:', res.status);
          }
        } catch (err) {
          console.warn('Server upload failed:', err.message);
          // This is fine if you don't have a backend yet.
        }
      },
      (err) => {
        console.warn(err);
        setStatus('error: ' + err.message);
      },
      { enableHighAccuracy: true, distanceFilter: 10, interval: 5000, fastestInterval: 2000 }
    );
  }

  // Stop watching location updates
  function stopTracking() {
    if (watchIdRef.current != null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus('stopped');
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>Status: {status}</Text>
      {location && (
        <Text>
          Lat: {location.lat}{'\n'}
          Lon: {location.lon}{'\n'}
          Accuracy: {location.accuracy?.toFixed(2)} m
        </Text>
      )}
      <Button title="Start Tracking" onPress={startTracking} />
      <Button title="Stop Tracking" onPress={stopTracking} />
    </View>
  );
}
