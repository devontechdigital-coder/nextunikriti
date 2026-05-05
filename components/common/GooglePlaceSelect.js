'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Form, ListGroup, Spinner } from 'react-bootstrap';

const GOOGLE_SCRIPT_ID = 'google-maps-places-script';

const parseAddressComponents = (components = []) => {
  let city = '';
  let state = '';
  let country = '';

  components.forEach((component) => {
    if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
      city = city || component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      state = component.long_name;
    }
    if (component.types.includes('country')) {
      country = component.long_name;
    }
  });

  return { city, state, country };
};

const loadGoogleMaps = () => new Promise((resolve, reject) => {
  if (typeof window === 'undefined') return reject(new Error('Window unavailable'));
  if (window.google?.maps?.places) return resolve(window.google);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return reject(new Error('Google Maps API key missing'));

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(window.google), { once: true });
    existingScript.addEventListener('error', reject, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.id = GOOGLE_SCRIPT_ID;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.onload = () => resolve(window.google);
  script.onerror = reject;
  document.head.appendChild(script);
});

export default function GooglePlaceSelect({ value, onChange, className = '', placeholder = 'Search location...' }) {
  const [ready, setReady] = useState(false);
  const [inputValue, setInputValue] = useState(value?.label || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const autocompleteRef = useRef(null);

  useEffect(() => {
    setInputValue(value?.label || '');
  }, [value?.label]);

  useEffect(() => {
    let active = true;
    loadGoogleMaps()
      .then(() => {
        if (!active) return;
        autocompleteRef.current = new window.google.maps.places.AutocompleteService();
        setReady(true);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
      });

    return () => { active = false; };
  }, []);

  const currentLocationOption = useMemo(() => ({
    label: 'Use My Current Location',
    value: '__current_location__',
    isCurrentLocation: true,
  }), []);

  const saveAndChange = useCallback((payload) => {
    onChange(payload);
  }, [onChange]);

  const reverseGeocode = useCallback((lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const parsed = parseAddressComponents(results[0].address_components);
        saveAndChange({
          label: results[0].formatted_address,
          value: 'current-location',
          lat,
          lng,
          ...parsed,
        });
      }
    });
  }, [saveAndChange]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation || !window.google?.maps) {
      alert('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => reverseGeocode(position.coords.latitude, position.coords.longitude),
      () => alert('Unable to retrieve location')
    );
  }, [reverseGeocode]);

  const fetchOptions = useCallback((nextValue) => {
    setInputValue(nextValue);
    if (!ready || !autocompleteRef.current) {
      setOptions(nextValue ? [] : [currentLocationOption]);
      return;
    }
    if (!nextValue) {
      setOptions([currentLocationOption]);
      return;
    }

    setLoading(true);
    autocompleteRef.current.getPlacePredictions({ input: nextValue }, (predictions) => {
      const results = predictions?.map((prediction) => ({
        label: prediction.description,
        value: prediction.place_id,
      })) || [];
      setOptions([currentLocationOption, ...results]);
      setLoading(false);
    });
  }, [currentLocationOption, ready]);

  const handleSelect = (option) => {
    setOptions([]);
    if (option.isCurrentLocation) {
      getCurrentLocation();
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ placeId: option.value }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const location = results[0].geometry.location;
        const parsed = parseAddressComponents(results[0].address_components);
        saveAndChange({
          label: results[0].formatted_address,
          value: option.value,
          lat: location.lat(),
          lng: location.lng(),
          ...parsed,
        });
      }
    });
  };

  return (
    <div className={`position-relative ${className}`}>
      <div className="d-flex gap-2">
        <Form.Control
          value={inputValue}
          placeholder={placeholder}
          onChange={(event) => fetchOptions(event.target.value)}
          onFocus={() => fetchOptions(inputValue)}
        />
        <Button type="button" variant="outline-secondary" onClick={getCurrentLocation} disabled={!ready}>
          {loading ? <Spinner size="sm" /> : 'Locate'}
        </Button>
      </div>
      {error && <div className="small text-muted mt-1">Google location search unavailable. {error}</div>}
      {options.length > 0 && (
        <ListGroup className="position-absolute w-100 shadow-sm mt-1" style={{ zIndex: 1080, maxHeight: 220, overflowY: 'auto' }}>
          {options.map((option) => (
            <ListGroup.Item action key={option.value} onClick={() => handleSelect(option)}>
              {option.isCurrentLocation ? 'Current location: ' : ''}{option.label}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}
