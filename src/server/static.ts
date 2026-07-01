import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, extname, join, normalize } from 'node:path'
import type { Context } from 'hono'

const publicDir = join(process.cwd(), 'public')

const contentTypes = new Map([
	['.css', 'text/css; charset=utf-8'],
	['.js', 'application/javascript; charset=utf-8'],
	['.html', 'text/html; charset=utf-8'],
	['.svg', 'image/svg+xml'],
	['.woff2', 'font/woff2']
])

function resolvePublicPath(pathname: string): string | null {
	const sanitized = normalize(pathname).replace(/^([.][.][/\\])+/, '')
	const resolved = join(publicDir, sanitized)

	if (!resolved.startsWith(publicDir)) {
		return null
	}

	if (!existsSync(resolved) || statSync(resolved).isDirectory()) {
		return null
	}

	return resolved
}

export async function servePublicAsset(c: Context, assetPath: string) {
	const resolved = resolvePublicPath(assetPath)

	if (!resolved) {
		return c.notFound()
	}

	const extension = extname(resolved)
	const contentType = contentTypes.get(extension) ?? 'application/octet-stream'
	return new Response(await readFile(resolved), {
		headers: {
			'content-type': contentType,
			'cache-control': basename(resolved) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable'
		}
	})
}
