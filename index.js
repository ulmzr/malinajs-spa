import * as esbuild from 'esbuild'
import malinaLoader from './malinaLoader'
import { join } from 'path'
import { watch } from 'fs/promises'

async function bunserv(options = {}) {
    // Extract options with defaults
    const { hostname = 'localhost', port = 3000, publicDir = 'public', esbuildOptions = {} } = options

    const dev = process.argv.includes('-d')
    const serve = process.argv.includes('-s')

    // WebSocket script for live reload in development mode
    const script = `
	  <script>
		let url = 'ws://' + location.host;
		const conn = () => {
			let ws = new WebSocket(url);
			ws.onopen = () => {
				if (sessionStorage.getItem('reloaded')) return;
				sessionStorage.setItem('reloaded', 'true');
				location.reload();
			};
			ws.onmessage = (event) => {
				if (event.data === 'reload') location.reload();
			};
			ws.onclose = () => {
				console.log('Connection closed, retrying in 2 seconds...');
				setTimeout(() => {
					sessionStorage.removeItem('reloaded');
					conn();
				}, 2000);
			};
			ws.onerror = (error) => console.log('WebSocket error:', error);
		};
		conn();
	  </script>`

    // Build files with esbuild (development or production)
    if (!serve) {
        const ctx = await esbuild.context({
            entryPoints: ['./src/main.js'],
            outdir: publicDir,
            format: 'esm',
            bundle: true,
            minify: !dev,
            plugins: [malinaLoader()],
            ...esbuildOptions,
        })

        // Watch files in development mode
        await ctx.watch()

        // Dispose context and exit in production
        if (!dev) {
            await ctx.dispose()
            console.log('Build complete!')
            process.exit(0)
        }
    }

    // Start a server in development or serve mode
    if (dev || serve) {
        const server = Bun.serve({
            hostname,
            port,
            fetch: async (request, server) => {
                // Handle WebSocket upgrades
                if (server.upgrade(request)) return

                // if not GET method return
                if (request.method !== 'GET') return

                // add livereload script to html head
                const addScript = async (file) => {
                    if (!file.type.includes('html')) return file
                    const body = await file.text()
                    return body.replace('</head>', `${script}</head>`)
                }

                // response
                const response = (body) => {
                    if (body.size) return new Response(body)
                    return new Response(body, { headers: { 'Content-Type': 'text/html;utf-8' } })
                }

                // logic
                const pathname = new URL(request.url).pathname.replace(/\/$/, 'index.html')
                const index = Bun.file(join(publicDir, 'index.html'))
                const file = Bun.file(join(publicDir, pathname))
                if (await file.exists()) return response(dev ? await addScript(file) : file)
                return response(await addScript(index))
            },
            websocket: {
                open: async (ws) => {
                    // Watch for file changes in the public directory
                    let isWatching = false
                    const watcher = watch(publicDir, { recursive: true })
                    for await (const event of watcher) {
                        if (isWatching) return
                        isWatching = true
                        setTimeout(async () => {
                            ws.send('reload')
                            isWatching = false
                        }, 100)
                    }
                },
                message() {
                    // Handle WebSocket messages if needed
                },
            },
        })

        if (server) {
            const mode = dev ? 'Development' : 'Serve'
            console.log(`${mode} mode.\nListening on ${server.url}`)
        }
    }
}

export default bunserv
