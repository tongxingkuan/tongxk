<template>
  <div ref="ele">
    <ContentDoc>
      <template #not-found>
        <h2>未找到资源</h2>
      </template>
      <template #empty>
        <h2>资源为空</h2>
      </template>
    </ContentDoc>
  </div>
</template>
<script setup>
import { bindCodeCopy } from '~/composables/useCodeCopy'

definePageMeta({
  layout: 'article',
  pageTransition: {
    name: 'articles',
  },
})

const ele = ref(null)

const goAnchor = selector => {
  setTimeout(() => {
    let anchor = ele.value?.querySelector(selector)
    anchor?.scrollIntoView()
  }, 100)
}

onMounted(() => {
  if (window.location.hash) {
    goAnchor(decodeURIComponent(window.location.hash))
  }
  const stop = bindCodeCopy(ele.value)
  onBeforeUnmount(() => stop())
})
</script>
