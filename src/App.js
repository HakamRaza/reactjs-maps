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
	Button,
	Col,
	Dropdown,
	Input,
	Row,
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
									address: suggestion.address,
									full_address: suggestion.full_address,
									place_formatted: suggestion.place_formatted,
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

	const onSearch = (event) => {
		subject.next(event.target.value)
	}

	return (
		<>

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
				<Row>
					<Col flex={4}>
						<Dropdown
							open
							placement="bottomLeft"
							dropdownRender={()=> (
								<>
								{state.suggestionList.map(item =>
										<Button
											size="small"
											type="link"
											key={item.mapbox_id}
											onClick={()=>console.log(item.mapbox_id)}
											style={{
												lineHeight: 1,
												color: 'black',
												textAlign:'left',
												display:'block',
												height: 45,
												width:"100%",
												borderBottom:1
											}}
										>
											<b>{item.name}</b><br/>
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
							<Search placeholder="input search text" onChange={onSearch} enterButton size='middle' />
						</Dropdown>
					</Col>
					<Col flex={1}>
						<Button type="primary" onClick={()=>console.log(state)}>
							History
						</Button>

					</Col>
				</Row>

			</div>

		</>
	);
}

export default App;
