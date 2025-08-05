<template>
  <div id="app">
    <button @click="render = true">render</button>
    <button @click="render = false">destroy</button>
    <Test v-if="render" />
  </div>
</template>

<script>
import Test from './components/Test.vue'

export default {
  name: 'App',
  components: {
    Test,
  },
  data() {
    return {
      render: false,
    }
  },
}
</script>
