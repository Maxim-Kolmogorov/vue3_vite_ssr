// Node.js
import { basename } from 'node:path'

// Vue SSR
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

// App
import App from './App.vue'
import router from './router/index.js'

export async function render(url, manifest = null) {
  const app = createSSRApp(App)
  app.use(router)

  await router.push(url)
  await router.isReady()

  // ctx - context. Плагин @vitejs/plugin-vue
  // https://vitejs.dev/guide/ssr.html#generating-preload-directives
  const ctx = {
    modules: []
  }
  const html = await renderToString(app)
  let preloadLinks = ''
  if (manifest) {
    renderPreloadLinks(ctx.modules, manifest)
  }

  return [html, preloadLinks]
}

function renderPreloadLinks(modules, manifest) {
  let links = ''
  const seen = new Set()
  modules.forEach((id) => {
    const files = manifest[id]
    if (files) {
      files.forEach((file) => {
        if (!seen.has(file)) {
          seen.add(file)
          const filename = basename(file)
          if (manifest[filename]) {
            for (const depFile of manifest[filename]) {
              links += renderPreloadLink(depFile)
              seen.add(depFile)
            }
          }
          links += renderPreloadLink(file)
        }
      })
    }
  })
  return links
}

function renderPreloadLink(file) {
  if (file.endsWith('.js')) {
    return `<link rel="modulepreload" crossorigin href="${file}">`
  } else if (file.endsWith('.css')) {
    return `<link rel="stylesheet" href="${file}">`
  } else if (file.endsWith('.woff')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff" crossorigin>`
  } else if (file.endsWith('.woff2')) {
    return ` <link rel="preload" href="${file}" as="font" type="font/woff2" crossorigin>`
  } else if (file.endsWith('.gif')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/gif">`
  } else if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/jpeg">`
  } else if (file.endsWith('.png')) {
    return ` <link rel="preload" href="${file}" as="image" type="image/png">`
  } else {
    return ''
  }
}
