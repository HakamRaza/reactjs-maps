import { Button, Col, Dropdown, Input, Row, } from 'antd';

const Search = ({
    suggestionDetail,
    state,
    onSearch,
    setChildrenDrawer,
    getDetails
}) => (
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
                    <Input placeholder="input search text" onChange={onSearch} enterButton size='middle' loading={state.loading} />
                </Dropdown>
            </Col>

            <Col flex={1} style={{ marginLeft: 10 }}>
                <Button type="primary" onClick={() => setChildrenDrawer(true)}>
                    History
                </Button>
            </Col>
        </Row>
    </div>
)

export default Search