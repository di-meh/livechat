import { useSyncState } from '@robojs/sync'
import { useEffect } from 'react'
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { LiveChatData } from '../types/livechat'
import Test from './components/Test'

export default function App() {
	const [livechat, setLivechat] = useSyncState<LiveChatData>({ type: null, user: null, url: null, caption: null, maxTime: null }, [
		'livechat'
	])

	const emptyState = () => {
		setLivechat({ type: null, user: null, url: null, caption: null, maxTime: null })
	}

	useEffect(() => {
		if (livechat.type?.startsWith('image') || livechat.maxTime !== null || (livechat.caption && !livechat.url)) {
			const timeout = setTimeout(emptyState, livechat.maxTime !== null ? livechat.maxTime * 1000 : 5000);
			return () => clearTimeout(timeout);
		}
	}, [livechat])

	return (
		<section className="relative h-full">
			<section className='fixed top-10 left-10 flex flex-col items-center gap-2 max-w-3xs z-10'>
				{livechat.user && (
					<>
					<img className='w-full rounded-full border-16 border-green-500' src={livechat.user?.avatar || ''} alt={livechat.user?.name || 'User'} />
					<p className='text-6xl text-center wrap-break-word font-bold max-w-[12ch]'>{livechat.user?.name || 'Unknown User'}</p>
					</>
				)}
			</section>
			<section className='h-full flex flex-col items-center scale-80'>
				{livechat.url && (
					<>
						{livechat.type?.startsWith('image') && <img className="h-full" src={livechat.url || ''} alt="LiveChat Media" />}
						{(livechat.type?.startsWith('video') || livechat.type?.startsWith('audio')) && (
							<MediaPlayer className="h-full" onEnded={emptyState} autoPlay title="LiveChat Media" src={livechat.url}>
								<MediaProvider className="w-full h-full media-video:aspect-auto!" />
							</MediaPlayer>
						)}
					</>
				)}
			</section>
			{livechat.caption && <p className='z-50 fixed bottom-20 left-1/6 right-1/6 text-border-black text-center text-7xl font-bold text-wrap break-all wrap-break-word'>{livechat.caption}</p>}
		</section>
		// <Test />
	)
}
