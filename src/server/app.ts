import { Hono } from 'hono'
import { servePublicAsset } from './static.js'

const app = new Hono()

app.get('/health', (c) => c.json({ status: 'ok' }))

app.get('/ws', (c) => c.body(null, 426))

app.get('/client.js', (c) => servePublicAsset(c, 'client.js'))
app.get('/style.css', (c) => servePublicAsset(c, 'style.css'))
app.get('/vite.svg', (c) => servePublicAsset(c, 'vite.svg'))
app.get('/fonts/:name', (c) => servePublicAsset(c, `fonts/${c.req.param('name')}`))

app.get('/', (c) => servePublicAsset(c, 'index.html'))
app.get('/:userId', (c) => {
	const userId = c.req.param('userId')

	if (userId === 'health' || userId === 'ws' || userId.includes('.')) {
		return c.notFound()
	}

	return servePublicAsset(c, 'index.html')
})

export default app
