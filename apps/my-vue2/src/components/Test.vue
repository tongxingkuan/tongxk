<template>
  <div class="hello">
    <div>{{ msg }}</div>
    <div v-for="(item, index) in 1000" :key="`${item}-${index}`" class="item">
      {{ item }}
    </div>
  </div>
</template>

<script>
export default {
  name: "Test",
  data() {
    return {
      msg: "Hello World",
      renderKey: 0,
    };
  },
  mounted() {
    this.timer = setTimeout(() => {
      this.msg = "Hello Vue2";
      this.renderKey++;
    }, 500);
  },
  beforeDestroy() {
    clearTimeout(this.timer);
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
