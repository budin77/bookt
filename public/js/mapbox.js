/* eslint-disable */

export const showMap = locations => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYm9nZGFubWFwYm94IiwiYSI6ImNrY3JrYXpyMTByOTMycm1nYmphN2FuNHUifQ.FIjcsDJCwSVcn6rznUFlIQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v10',
    scrollZoom: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    var marker = new mapboxgl.Marker().setLngLat(loc.coordinates).addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100
    }
  });
};
