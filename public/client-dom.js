const identityElement = document.getElementById('identity')
const identityAvatarElement = document.getElementById('identity-avatar')
const identityNameElement = document.getElementById('identity-name')
const captionElement = document.getElementById('caption')

export const mediaShellElement = document.getElementById('media-shell')

export function resetMediaShell() {
	mediaShellElement.replaceChildren()
}

export function showIdentity(user) {
	if (!user) {
		identityElement.classList.add('hidden')
		identityAvatarElement.removeAttribute('src')
		identityAvatarElement.alt = ''
		identityNameElement.textContent = ''
		return
	}

	identityAvatarElement.src = user.avatar
	identityAvatarElement.alt = user.name
	identityNameElement.textContent = user.name
	identityElement.classList.remove('hidden')
}

export function showCaption(caption) {
	if (!caption) {
		captionElement.textContent = ''
		captionElement.classList.add('hidden')
		return
	}

	captionElement.textContent = caption
	captionElement.classList.remove('hidden')
}
