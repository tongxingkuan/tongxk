<template>
  <NuxtLink v-if="showNuxtLink" :to="path">
    {{ name }}
  </NuxtLink>
  <a v-else :href="resolvedHref" :target="targetAttr">{{ name }}</a>
</template>
<script setup>
const props = defineProps({
  name: {
    type: String,
    default: '',
  },
  href: {
    type: String,
    default: '#',
  },
  /** 站内相对路径；配合 envHref 时开发走主应用 qiankun 路由 */
  path: {
    type: String,
    default: '',
  },
  /** 生产环境子应用端口（与 qiankun entry 一致：vite 3001 / react 3002 / vue2 3003） */
  prodPort: {
    type: [Number, String],
    default: '',
  },
  envHref: {
    type: Boolean,
    default: false,
  },
  target: {
    type: String,
    default: 'self',
  },
  isEncode: {
    type: Boolean,
    default: false,
  },
})

const config = useRuntimeConfig()
const isDev = import.meta.env.DEV

const showNuxtLink = computed(() => props.envHref && !!props.path && isDev)

function buildProdOrigin(siteUrl, port) {
  const raw = siteUrl.replace(/\/$/, '')
  const withProto = raw.includes('://') ? raw : `https://${raw}`
  const url = new URL(withProto)
  url.port = String(port)
  return url.origin
}

const resolvedHref = computed(() => {
  if (props.envHref && props.path) {
    if (isDev) return props.path
    const port = props.prodPort
    const base = port
      ? buildProdOrigin(String(config.public.siteUrl), port)
      : String(config.public.siteUrl).replace(/\/$/, '')
    return `${base}${props.path}`
  }
  return props.isEncode ? decodeURIComponent(props.href) : props.href
})

const targetAttr = computed(() => `_${props.target}`)
</script>
