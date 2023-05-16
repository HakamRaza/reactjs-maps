import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
	debounceTime,
	map as mapRx,
	BehaviorSubject,
	filter,
	distinctUntilChanged
} from 'rxjs';
import Search from "./components/Search";
import HistoryDrawer from "./components/HistoryDrawer";
import Mapbox from "./components/Mapbox";


function App() {
	const baseUrl = 'https://api.mapbox.com'
	const accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN
	const uuid4 = process.env.REACT_APP_uuid4

	const [history, setHistory] = useState([])
	const [subject, setSubject] = useState(null);
	const [childrenDrawer, setChildrenDrawer] = useState(false);
	const [state, setState] = useState({ suggestionList: [], loading: false });
	const [suggestionDetail, setSuggestionDetail] = useState({
		name: 'Kuala Lumpur',
		full_address: 'Kuala Lumpur, Malaysia',
		coordinate_array: [101.6841, 3.1319],
		zoom: 11.00
	})

	useEffect(() => {
		if (subject === null) {
			const sub = new BehaviorSubject('');
			setSubject(sub);
		} else {
			const observable = subject.pipe(
				mapRx(searchStr => searchStr.trim()),
				distinctUntilChanged(),
				filter(searchStr => searchStr.length >= 2),
				debounceTime(1200)
			)
				.subscribe(searchStr => {
					return axios.get(`${baseUrl}/search/searchbox/v1/suggest`, {
						params: {
							q: searchStr,
							access_token: accessToken ?? '',
							session_token: uuid4 ?? '',
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


	const onSearch = (event) => {
		subject.next(event.target.value)
	}

	const getDetails = (mapboxId) => {
		axios.get(`${baseUrl}/search/searchbox/v1/retrieve/${mapboxId}`, {
			params: {
				access_token: accessToken ?? '',
				session_token: uuid4 ?? '',
			}
		}).then(({ data }) => {

			let detail = {
				zoom: 11.00,
				name: data.features[0].properties.name,
				full_address: data.features[0].properties.full_address,
				coordinate_array: data.features[0].geometry.coordinates
			}

			setSuggestionDetail(detail)

			setHistory([...history, detail])
		});
	}

	return (
		<main>

			<Search
				suggestionDetail={suggestionDetail}
				state={state}
				onSearch={onSearch}
				setChildrenDrawer={setChildrenDrawer}
				getDetails={getDetails}
			/>

			<HistoryDrawer
				childrenDrawer={childrenDrawer}
				setChildrenDrawer={setChildrenDrawer}
				setSuggestionDetail={setSuggestionDetail}
				history={history}
			/>

			<Mapbox
				MAPBOX_ACCESS_TOKEN={accessToken}
				suggestionDetail={suggestionDetail}
			/>

		</main>
	);
}

export default App;
