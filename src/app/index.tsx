import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { SyncContextProvider } from '@robojs/sync'
import './index.css'
import '@vidstack/react/player/styles/base.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<SyncContextProvider>
			<App />
		</SyncContextProvider>
	</React.StrictMode>
)
