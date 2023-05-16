import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef } from "react";
import { Radio } from 'antd';

const Mapbox = ({
    MAPBOX_ACCESS_TOKEN,
    suggestionDetail
}) => {
    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

    const map = useRef(null);
    const mapContainer = useRef(null);

    useEffect(() => {
        if (map.current) return; // initialize map only once
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: `mapbox://styles/mapbox/satellite-v9`,
            center: suggestionDetail.coordinate_array,
            zoom: suggestionDetail.zoom
        });

        // Default user position option
        map.current.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: false
            },
            // When active the map will receive updates to the device's location as it changes.
            trackUserLocation: false,
            // Draw an arrow next to the location dot to indicate which direction the device is heading.
            showUserHeading: false
        }));

        // Add zoom and rotation controls to the map.
        map.current.addControl(new mapboxgl.NavigationControl());

        // Clean up on unmount
        // return () => map.current?.remove();
    }, []);


    useEffect(() => {
        if (!map.current) return; // wait for map to initialize

        const marker = new mapboxgl.Marker({
            color: "orange",
        })
            .setLngLat(suggestionDetail.coordinate_array)
            .addTo(map.current)

        map.current.flyTo({
            center: suggestionDetail.coordinate_array,
            essential: true // this animation is considered essential with respect to prefers-reduced-motion
        });

    }, [suggestionDetail]);

    return (
        <>
            <div ref={mapContainer}
                style={{
                    position: 'absolute',
                    overflow: 'hidden',
                    height: '100%',
                    width: '100%'
                }}
            />

            <div
                style={{
                    color: '#fff',
                    fontFamily: 'monospace',
                    zIndex: 1,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    margin: '30px 6px',
                }}
            >
                <Radio.Group defaultValue="satellite-v9" buttonStyle="solid" onChange={(e) => map.current.setStyle('mapbox://styles/mapbox/' + e.target.value)} >
                    <Radio.Button value="streets-v12">Streets</Radio.Button>
                    <Radio.Button value="outdoors-v12">Outdoors</Radio.Button>
                    <Radio.Button value="satellite-v9">Satellite</Radio.Button>
                </Radio.Group>
            </div>

        </>
    )
}

export default Mapbox