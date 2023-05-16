import React, { useState, useEffect, useRef } from "react";
import mapboxgl from 'mapbox-gl';
import axios from 'axios';
import {
	debounceTime,
	map as mapRx,
	BehaviorSubject,
	filter,
	distinctUntilChanged
} from 'rxjs';
import {
	Button,
	Col,
	Drawer,
	Dropdown,
	Input,
	List,
	Radio,
	Row,
} from 'antd';

const MAPBOX_BASE_URL = 'https://api.mapbox.com'
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
const MAPBOX_UUID4 = process.env.UUID4

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

function App() {

	const mapContainer = useRef(null);
	const map = useRef(null);
	const [childrenDrawer, setChildrenDrawer] = useState(false);
	const [suggestionDetail, setSuggestionDetail] = useState({
		name: 'Kuala Lumpur',
		full_address: 'Kuala Lumpur, Malaysia',
		coordinate_array: [101.6841, 3.1319],
		zoom: 11.00
	})

	const showChildrenDrawer = () => {
		setChildrenDrawer(true);
	};

	const onChildrenDrawerClose = () => {
		setChildrenDrawer(false);
	};

	const [subject, setSubject] = useState(null);
	const [state, setState] = useState({
		searchString: [],
		suggestionList: [],
		loading: false
	});

	useEffect(() => {
		if (subject === null) {
			const sub = new BehaviorSubject('');
			setSubject(sub);
		} else {
			const observable = subject.pipe(
				mapRx(searchStr => searchStr.trim()),
				distinctUntilChanged(),
				filter(searchStr => searchStr.length >= 4),
				debounceTime(2000)
			)
				.subscribe(searchStr => {
					return axios.get(`${MAPBOX_BASE_URL}/search/searchbox/v1/suggest`, {
						params: {
							q: searchStr,
							access_token: MAPBOX_ACCESS_TOKEN ?? '',
							session_token: MAPBOX_UUID4 ?? '',
							limit: '5',
							language: 'en'
						}
					})
						.then(({ data }) => {
							const results = []

							for (const suggestion of data.suggestions) {
								results.push({
									name: suggestion.name,
									mapbox_id: suggestion.mapbox_id,
									address: suggestion.address,
									full_address: suggestion.full_address,
									place_formatted: suggestion.place_formatted,
								})
							}

							const newState = {
								...state,
								searchString: [...state.searchString, searchStr],
								suggestionList: results,
								loading: false
							}
							setState(newState)
						});
				});

			return () => {
				observable.unsubscribe()
				subject.unsubscribe();
			}
		}
	}, [subject]);

	useEffect(() => {
		if (map.current) return; // initialize map only once
		map.current = new mapboxgl.Map({
			container: mapContainer.current,
			style: `mapbox://styles/mapbox/streets-v12`,
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

	const onSearch = (event) => {
		subject.next(event.target.value)
	}

	const getDetails = (mapboxId) => {
		axios.get(`${MAPBOX_BASE_URL}/search/searchbox/v1/retrieve/${mapboxId}`, {
			params: {
				access_token: MAPBOX_ACCESS_TOKEN ?? '',
				session_token: MAPBOX_UUID4 ?? '',
			}
		}).then(({ data }) => {
			setSuggestionDetail({
				...suggestionDetail,
				name: data.features[0].properties.name,
				full_address: data.features[0].properties.full_address,
				coordinate_array: data.features[0].geometry.coordinates
			})
		});
	}

	return (
		<>
			<head>
				<title>NextJS Maps</title>
				<meta name="description" content="Find location on the map" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" href="/favicon.ico" />
				<link href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" rel="stylesheet"/>
				<script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
			</head>
			<main>

				<div ref={mapContainer}
					style={{
						position: 'absolute',
						// overflow: 'hidden',
						height: '100%',
						width: '100%'
					}}
				/>

				<div
					style={{
						paddingRight: '80px',
						fontFamily: 'monospace',
						zIndex: 1,
						position: 'absolute',
						top: 0,
						left: 0,
						margin: '12px',
						borderRadius: '4px',
						width: '100%',
						maxWidth: '500px'
					}}
				>

					Longitude: {suggestionDetail.coordinate_array[0]} | Latitude: {suggestionDetail.coordinate_array[1]} | Zoom: {suggestionDetail.zoom}
					<Row>
						<Col flex={4}>
							<Dropdown
								open
								placement="bottomLeft"
								dropdownRender={() => (
									<>
										{state.suggestionList.map(item =>
											<Button
												size="small"
												type="link"
												key={item.mapbox_id}
												onClick={() => getDetails(item.mapbox_id)}
												style={{
													lineHeight: 1,
													color: 'black',
													textAlign: 'left',
													display: 'block',
													height: 45,
													width: "100%",
													backgroundColor: 'white',
													borderRadius: 5
												}}
											>
												<b>{item.name}</b><br />
												<i>{
													item.place_formatted
														? item.place_formatted
														: item.full_address
															? item.address
															: ''
												}</i>
											</Button>
										)}
									</>

								)}
							>
								<Input.Search placeholder="input search text" onChange={onSearch} enterButton size='middle' />
							</Dropdown>
						</Col>
						<Col flex={1}>
							<Button type="primary" onClick={() => showChildrenDrawer()}>
								History
							</Button>

						</Col>
					</Row>

				</div>

				<div
					style={{
						color: '#fff',
						padding: '6px 12px',
						fontFamily: 'monospace',
						zIndex: 1,
						position: 'absolute',
						top: 0,
						right: 0,
						margin: '12px',
						borderRadius: '4px',
					}}
				>
					<Drawer
						title="Past Searches"
						width={400}
						closable={false}
						onClose={onChildrenDrawerClose}
						open={childrenDrawer}
						placement='right'
					>
						<List
							dataSource={state.searchString}
							renderItem={(item) =>
								<List.Item>
									<List.Item.Meta
										title={"🚩  " + `${item.name}`}
										description='Description of the place'
									/>
								</List.Item>
							}
						/>
					</Drawer>
				</div>

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
					<Radio.Group defaultValue="streets-v12" buttonStyle="solid" onChange={(e) => map.current.setStyle('mapbox://styles/mapbox/' + e.target.value)} >
						<Radio.Button value="streets-v12">Streets</Radio.Button>
						<Radio.Button value="outdoors-v12">Outdoors</Radio.Button>
						<Radio.Button value="satellite-v9">Satellite</Radio.Button>
					</Radio.Group>
				</div>

			</main>
		</>
	);
}

export default App;
