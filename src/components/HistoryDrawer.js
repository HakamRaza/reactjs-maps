import {
    Drawer,
    List,
} from 'antd';

const HistoryDrawer = ({
    childrenDrawer,
    setChildrenDrawer,
    setSuggestionDetail,
    history
}) => (
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
            onClose={() => setChildrenDrawer(false)}
            open={childrenDrawer}
            placement='right'
        >
            <List
                dataSource={history}
                renderItem={item =>
                    <List.Item onClick={() => setSuggestionDetail(item)}>
                        <List.Item.Meta
                            title={item.name}
                            description={
                                item.place_formatted
                                    ? item.place_formatted
                                    : item.full_address
                                        ? item.address
                                        : ''
                            }
                        />
                    </List.Item>
                }
            />
        </Drawer>
    </div>
)

export default HistoryDrawer