import { MediaPlayer, MediaProvider, type MediaPlayerProps } from "@vidstack/react";
import ReactPlayer from 'react-player'

export default function Test() {
    return (
        <section className="relative grid grid-cols-8 grid-rows-4 h-full">
            <section className='fixed top-10 left-10 flex flex-col items-center gap-2 max-w-3xs z-10'>
                    <img className='w-full rounded-full border-16 border-green-500' src={'https://cdn.discordapp.com/avatars/121694742672179200/07c9774107db2a8aeb52c2ed756a4cff.webp?size=256'} alt={'yng'} />
                    <p className='text-6xl text-center break-all'>{'Unknown User'}</p>
            </section>
            <section className='w-full h-full col-start-6 col-span-full row-span-full flex items-center'>
                {/* <img src="https://images.unsplash.com/photo-1761839258420-5c3e2f2e2a74?ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2340"/> */}
                {/* <MediaPlayer autoPlay className="h-full" title="LiveChat Media" src={"https://cdn.discordapp.com/ephemeral-attachments/1436373904678453332/1436491977393700974/Video-571.mp4?ex=690fcce8&is=690e7b68&hm=c0c214dff7fc7abf3828bcaf27c2d4b39c0526754b1b821b31e3c753bfdd6f60&"}>
                    <MediaProvider className="w-full h-full media-video:aspect-auto!" />
                </MediaPlayer> */}
            </section>
            <p className='z-50 fixed bottom-20 left-1/6 right-1/6 text-border-black text-center text-7xl font-bold text-wrap break-all row-start-4 col-start-2 -col-end-2'>MDRRRRRRRRRRRRRRRRRRRRRRRRRRRR</p>
        </section>

    );
}