import { MediaPlayer, MediaProvider } from '@vidstack/react'
import { isMediaItem, isPlayableMediaItem } from '../livechat/items'
import { useLiveChatPlayback } from './hooks/useLiveChatPlayback'

function LiveChatIdentity({ avatar, name }: { avatar: string; name: string }) {
	return (
		<section className="fixed top-10 left-10 z-10 flex max-w-3xs flex-col items-center gap-2">
			<img className="w-full rounded-full border-16 border-green-500" src={avatar} alt={name} />
			<p className="max-w-[12ch] -translate-y-15 text-center text-6xl font-bold wrap-break-word">{name}</p>
		</section>
	)
}

function LiveChatMedia({ type, url, onEnded }: { onEnded: () => void; type: string; url: string }) {
	if (type.startsWith('image/')) {
		return <img className="h-full" src={url} alt="LiveChat Media" />
	}

	if (type.startsWith('audio/') || type.startsWith('video/')) {
		return (
			<MediaPlayer className="h-full" onEnded={onEnded} autoPlay title="LiveChat Media" src={url}>
				<MediaProvider className="h-full w-full" />
			</MediaPlayer>
		)
	}

	return null
}

export default function App() {
	const { currentItem, handleMediaEnded } = useLiveChatPlayback()

	return (
		<section className="relative h-full">
			{currentItem?.user && <LiveChatIdentity avatar={currentItem.user.avatar} name={currentItem.user.name} />}

			<section className="flex h-full flex-col items-center scale-80">
				{currentItem &&
					isMediaItem(currentItem) &&
					(isPlayableMediaItem(currentItem) || currentItem.type.startsWith('image/')) && (
						<LiveChatMedia type={currentItem.type} url={currentItem.url} onEnded={handleMediaEnded} />
					)}
			</section>

			{currentItem?.caption && (
				<p className="text-border-black fixed right-1/6 bottom-20 left-1/6 z-50 text-center text-7xl font-bold text-wrap break-all wrap-break-word">
					{currentItem.caption}
				</p>
			)}
		</section>
	)
}
