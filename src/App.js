import React, { useState, useEffect } from "react";
import axios from 'axios';
import {
	debounceTime,
	map,
	BehaviorSubject,
	filter,
	distinctUntilChanged
} from 'rxjs';
import {
	Input,
} from 'antd';


const MAPBOX_BASE_URL = 'https://api.mapbox.com'
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
const MAPBOX_UUID4 = process.env.UUID4
const { Search } = Input;

function App() {

	const [subject, setSubject] = useState(null);
	const [state, setState] = useState({
		searchString: [],
		suggestionList: [],
		suggestionDetail: {
			name: '',
			full_address: '',
			coordinate_array: [0, 0],
			latitude: 0,
			longitude: 0,
		},
		loading: false
	});

	useEffect(() => {
		if (subject === null) {
			const sub = new BehaviorSubject('');
			setSubject(sub);
		} else {
			const observable = subject.pipe(
				map(searchStr => searchStr.trim()),
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
									full_address: suggestion.full_address,
								})
							}

							const newState = {
								...state,
								searchString: [...state.searchString, searchStr],
								suggestionList: results,
								suggestionDetail: {
									name: '',
									full_address: '',
									coordinate_array: [0, 0],
									latitude: 0,
									longitude: 0,
								},
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

	const onSearch = () => {
		subject.next('Kota bharu')
	}

	return (
		<>
			<Search placeholder="input search text" onSearch={onSearch} enterButton size='middle' />
		</>
	);
}

export default App;
