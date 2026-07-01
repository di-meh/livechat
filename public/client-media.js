import {
  VidstackPlayer,
} from "https://cdn.vidstack.io/player";
import {
  mediaShellElement,
  resetMediaShell,
  showCaption,
  showIdentity,
} from "./client-dom.js";

export function createMediaController() {
  let currentItemId = null;
  let activePlayer = null;
  let activePlayerSession = 0;
  let onMediaEnded = null;

  function clearMediaShell() {
    activePlayerSession += 1;

    if (activePlayer && typeof activePlayer.destroy === "function") {
      activePlayer.destroy();
    }

    activePlayer = null;
    resetMediaShell();
  }

  function notifyMediaEnded(itemId) {
    if (!itemId || itemId !== currentItemId || !onMediaEnded) {
      return;
    }

    onMediaEnded(itemId);
  }

  function getVidstackSource(item) {
    if (item.type === "video/youtube") {
      return item.url;
    }

    return {
      src: item.url,
      type: item.type,
    };
  }

  async function createMediaPlayer(item, sessionId) {
    const target = document.createElement("div");
    mediaShellElement.append(target);

    const player = await VidstackPlayer.create({
      target,
      title: item.caption || "LiveChat Media",
      src: getVidstackSource(item),
      autoplay: true,
      controls: false,
      playsInline: true,
      crossOrigin: item.type === "video/youtube" ? undefined : "",
      layout: false,
    });

    if (sessionId !== activePlayerSession || item.id !== currentItemId) {
      player.destroy();
      return null;
    }

    const handleEnded = () => notifyMediaEnded(item.id);
    player.addEventListener("ended", handleEnded);
    player.addEventListener("media-ended", handleEnded);

    return player;
  }

  return {
    setOnMediaEnded(callback) {
      onMediaEnded = callback;
    },
    getCurrentItemId() {
      return currentItemId;
    },
    async renderItem(item) {
      currentItemId = item.id;
      clearMediaShell();
      showIdentity(item.user);
      showCaption(item.caption);

      if (item.kind === "caption") {
        return;
      }

      if (item.type.startsWith("image/")) {
        const image = document.createElement("img");
        image.src = item.url;
        image.alt = item.caption || "LiveChat Media";
        mediaShellElement.append(image);
        return;
      }

      if (item.type.startsWith("audio/") || item.type.startsWith("video/")) {
        const sessionId = activePlayerSession;
        const player = await createMediaPlayer(item, sessionId);

        if (
          !player ||
          sessionId !== activePlayerSession ||
          item.id !== currentItemId
        ) {
          return;
        }

        activePlayer = player;
      }
    },
    clearCurrentItem() {
      currentItemId = null;
      clearMediaShell();
      showIdentity(null);
      showCaption(null);
    },
  };
}
