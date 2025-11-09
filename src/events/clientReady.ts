import { MessagePayload, SyncServer } from '@robojs/sync/server.js'
import { logger } from 'robo.js'
import { WebSocketServer } from 'ws'
import { LiveChatData } from '../types/livechat'
import { setState } from 'robo.js'

export default () => {
    const wss = SyncServer.getSocketServer() as WebSocketServer | undefined
    wss?.on('connection', (ws) => {
        logger.info('Listening to client messages')
        ws.on('message', (message) => {
            const jsonData: MessagePayload<LiveChatData> = JSON.parse(message.toString());
            const {data, key, type} = jsonData;
            if (type === 'update' && key?.includes('livechat')) {
                setState('livechat-queue', data);
            }
            logger.info("Message incoming du client au serveur:", message.toString())
        })
    })
}