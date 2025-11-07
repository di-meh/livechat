import { useSyncState } from '@robojs/sync'
import { useEffect } from 'react'
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { LiveChatData } from '../types/livechat'

export default function App() {
	const [livechat, setLivechat] = useSyncState<LiveChatData>({ type: null, user: null, url: null, caption: null }, [
		'livechat'
	])

	const emptyState = () => {
		setLivechat({ type: null, user: null, url: null, caption: null })
	}

	useEffect(() => {
		if (livechat.type?.startsWith('video') && document.querySelector('video')) {
			document.querySelector('video')?.play()
		}
	}, [livechat])

	return (
		<div>
			<h1>Livechat</h1>
			<section>
				{livechat.url ? (
					<div className="livechat-message">
						<div className="user-info">
							<img src={livechat.user?.avatar || ''} alt={livechat.user?.name || 'User'} />
							<strong>{livechat.user?.name || 'Unknown User'}</strong>
						</div>
						<div className="media-info">
							<p>Type de média: {livechat.type}</p>
							{livechat.type?.startsWith('image') && <img src={livechat.url || ''} alt="LiveChat Media" />}
							{(livechat.type?.startsWith('video') || livechat.type?.startsWith('audio')) && (
								<MediaPlayer onEnded={emptyState} autoPlay title="LiveChat Media" src={livechat.url}>
									<MediaProvider />
								</MediaPlayer>
							)}
							{livechat.caption && <p>Légende: {livechat.caption}</p>}
						</div>
					</div>
				) : (
					<p>No media received yet.</p>
				)}
			</section>
		</div>
	)
}
