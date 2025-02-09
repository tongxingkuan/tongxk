<template>
  <div style="text-align: center">
    <n-image
      :src="src"
      :zoom-rate="1.2"
      :preview-src-list="[src]"
      :hide-on-click-modal="true"
      :initial-index="4"
      fit="cover"
    />
    <div class="tips">{{ alt }}</div>
  </div>
</template>
<script setup>
import { NImage } from "naive-ui";
defineProps({
  alt: {
    type: String,
    default: "",
  },
  src: {
    type: String,
    default: "",
  },
});
</script>
<style lang="less" scoped>
.tips {
  text-align: center;
}
</style>
