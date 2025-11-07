import { useSyncState } from '@robojs/sync'
import { useEffect } from 'react'
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { LiveChatData } from '../types/livechat'

export default function App() {
	const [livechat, setLivechat] = useSyncState<LiveChatData>({ type: null, user: null, url: null, caption: null, maxTime: null }, [
		'livechat'
	])

	const emptyState = () => {
		setLivechat({ type: null, user: null, url: null, caption: null, maxTime: null })
	}

	useEffect(() => {
		if (livechat.type?.startsWith('image') || livechat.maxTime !== null) {
			const timeout = setTimeout(emptyState, livechat.maxTime !== null ? livechat.maxTime * 1000 : 5000);
			return () => clearTimeout(timeout);
		}
	}, [livechat])

	return (
		<section className='grid grid-cols-6 grid-rows-4'>
			{livechat.url && (
				<>
					<section className='flex flex-col items-center gap-2'>
						<img className='w-3/5 rounded-full border-16 border-green-500' src={livechat.user?.avatar || ''} alt={livechat.user?.name || 'User'} />
						<p className='text-6xl text-center break-all'>{livechat.user?.name || 'Unknown User'}</p>
					</section>
					<section className='col-start-3 row-start-2 col-span-full row-span-full'>
						{livechat.type?.startsWith('image') && <img src={livechat.url || ''} alt="LiveChat Media" />}
						{(livechat.type?.startsWith('video') || livechat.type?.startsWith('audio')) && (
							<MediaPlayer onEnded={emptyState} autoPlay title="LiveChat Media" src={livechat.url}>
								<MediaProvider />
							</MediaPlayer>
						)}
					</section>
					{livechat.caption && <p className='z-50 text-border-black text-center text-7xl font-bold text-wrap break-all row-start-4 col-start-2 -col-end-2'>{livechat.caption}</p>}
				</>
					
			)}
		</section>
	)
}
