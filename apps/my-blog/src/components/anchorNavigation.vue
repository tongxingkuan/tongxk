<template>
  <ul class="navigation">
    <li
      v-for="(item, index) in navigationTree"
      :key="index"
      :title="item.text"
      :class="['nav-item', { 'active-hash': currentHash === '#' + item.id }]"
    >
      <a :href="'#' + item.id" class="nav-link">
        <span class="nav-text">{{ item.text }}</span>
      </a>
      <anchorNavigation v-if="item.children" :navigation-tree="item.children" class="subnavigation" />
    </li>
  </ul>
</template>

<script setup>
defineProps({
  navigationTree: {
    type: Array,
    default: () => [],
  },
})

const route = useRoute()
const currentHash = ref(route.hash)
watch(route, newRoute => {
  currentHash.value = newRoute.hash
})
</script>

<style lang="less" scoped>
.navigation {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 1px;

  > .nav-link {
    display: block;
    padding: 5px 8px;
    text-decoration: none;
    color: #777;
    font-size: 12px;
    border-radius: 4px;
    transition: all 0.2s ease;
    border-left: 2px solid transparent;

    .nav-text {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &:hover {
      background: rgba(23, 133, 207, 0.06);
      color: #1785cf;
      border-left-color: rgba(23, 133, 207, 0.3);
    }
  }

  &.active-hash {
    > .nav-link {
      background: linear-gradient(90deg, rgba(23, 133, 207, 0.1) 0%, transparent 100%);
      color: #1785cf;
      font-weight: 500;
      border-left-color: #1785cf;
    }
  }
}

.subnavigation {
  padding-left: 8px;
  margin-top: 1px;
}
</style>
