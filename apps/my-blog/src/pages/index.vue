<template>
  <div class="home">
    <h1>童话的博客</h1>
    <client-only>
      <particle :amountX="100" :amountY="100" />
    </client-only>
    <div class="flex justify-center gap-2 !pb-10">
      <nuxt-link to="articles">文章</nuxt-link>
      <nuxt-link to="demos">演示</nuxt-link>
      <nuxt-link to="questions">面试题</nuxt-link>
      <nuxt-link>测试2</nuxt-link>
    </div>
    <div class="flex items-center gap-2 justify-center !px-3">
      <input
        type="text"
        class="!border !border-gray-300 !rounded-md !p-2 w-[500px]"
        v-model="question"
        @keydown.enter="ask"
      />
      <button @click="ask" class="!bg-blue-500 !text-white !rounded-md !p-2 cursor-pointer shrink-0">提问</button>
    </div>
    <client-only>
      <div class="flex justify-center gap-2 !py-10 overflow-y-auto">
        <MdPreview v-model="message" class="max-w-[800px] !mx-auto" />
      </div>
    </client-only>
  </div>
</template>
<script lang="ts" setup>
import { MdPreview } from 'md-editor-v3'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import 'md-editor-v3/lib/style.css'
const question = ref('')
const message = ref<string>('')
const ask = () => {
  if (!question.value) {
    return
  }
  message.value = ''
  fetchEventSource('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/event-stream;charset=utf-8',
      accept: 'text/event-stream',
    },
    openWhenHidden: true,
    credentials: 'include',
    body: JSON.stringify({
      question: question.value,
    }),
    onmessage(e) {
      if (!e || !e.data) {
        return
      }
      let res
      try {
        res = JSON.parse(e.data)
      } catch (error) {
        return
      }
      if (!res) {
        return
      }
      const { text } = res
      message.value += text
    },
    onerror(e) {
      console.log('error', e)
      throw e
    },
    onclose() {},
  })
}
</script>
<style lang="less" scoped>
.home {
  width: 100vw;
  height: 100vh;
  overflow: auto;
}

h1 {
  text-align: center;
  font-size: 50px;
  padding: 50px;
}

.home-animate-box {
  padding: 20px;
  width: 60vw;
  height: 60vh;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  flex-flow: wrap;

  a {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48%;
    height: 48%;
    box-sizing: border-box;
    text-align: center;
    font-size: 80px;
    transform: scale(1);
    transition: all 0.2s ease-in-out;

    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>
