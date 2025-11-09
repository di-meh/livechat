import { useSyncState } from '@robojs/sync'
import { useCallback, useEffect, useRef, useState } from 'react'
import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { LiveChatData } from '../types/livechat'
import Test from './components/Test'

export default function App() {
	const [livechatQueue, setLivechatQueue] = useSyncState<LiveChatData[]>(
		[], 
		['livechat']
	)

	const [livechat, setLivechat] = useState<LiveChatData>({
		type: null,
		user: null,
		url: null,
		caption: null,
		maxTime: null
	})

	const timeoutRef = useRef<NodeJS.Timeout | null>(null)
	const isProcessingRef = useRef(false)

	const processNext = useCallback(() => {
		if (isProcessingRef.current) return

		setLivechatQueue(prevQueue => {
			if (prevQueue.length === 0) {
				// Queue vide, on reset l'affichage
				setLivechat({
					type: null,
					user: null,
					url: null,
					caption: null,
					maxTime: null
				})
				isProcessingRef.current = false
				return prevQueue
			}

			// On prend le premier élément et on l'affiche
			const [next, ...remaining] = prevQueue
			setLivechat(next)
			isProcessingRef.current = true
			return remaining
		})
	}, [setLivechatQueue])

	useEffect(() => {
		// Si rien n'est affiché et qu'il y a des éléments dans la queue
		if (!isProcessingRef.current && livechatQueue.length > 0) {
			processNext()
		}
	}, [livechatQueue, processNext])

	useEffect(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}

		const shouldSetTimeout = 
			livechat.type?.startsWith('image') || 
			livechat.maxTime !== null || 
			(livechat.caption && !livechat.url)

		if (shouldSetTimeout && isProcessingRef.current) {
			const delay = livechat.maxTime !== null ? livechat.maxTime * 1000 : 5000
			timeoutRef.current = setTimeout(() => {
				isProcessingRef.current = false
				processNext()
			}, delay)
		}

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current)
				timeoutRef.current = null
			}
		}
	}, [livechat, processNext])

	const handleMediaEnded = useCallback(() => {
		isProcessingRef.current = false
		processNext()
	}, [processNext])

	return (
		
		<section className="relative h-full">
			<section className='fixed top-10 left-10 flex flex-col items-center gap-2 max-w-3xs z-10'>
				{livechat.user && (
					<>
					<img className='w-full rounded-full border-16 border-green-500' src={livechat.user?.avatar || ''} alt={livechat.user?.name || 'User'} />
					<p className='text-6xl text-center wrap-break-word font-bold max-w-[12ch] -translate-y-15'>{livechat.user?.name || 'Unknown User'}</p>
					</>
				)}
			</section>
			<section className='h-full flex flex-col items-center scale-80'>
				{livechat.url && (
					<>
						{livechat.type?.startsWith('image') && <img className="h-full" src={livechat.url || ''} alt="LiveChat Media" />}
						{(livechat.type?.startsWith('video') || livechat.type?.startsWith('audio')) && (
							<MediaPlayer className="h-full" onEnded={handleMediaEnded} autoPlay title="LiveChat Media" src={livechat.url}>
								<MediaProvider className="w-full h-full" />
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
