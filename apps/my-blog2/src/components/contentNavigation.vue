<template>
  <n-space vertical>
    <n-layout has-sider>
      <n-layout-sider
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        show-trigger
        @collapse="
          () => {
            collapsed = true;
            emit('update:collapsed', true);
          }
        "
        @expand="
          () => {
            collapsed = false;
            emit('update:collapsed', false);
          }
        "
      >
        <n-menu
          :default-expand-all="true"
          :value="currentKey"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
        />
      </n-layout-sider>
    </n-layout>
  </n-space>
</template>

<script setup lang="ts">
import {
  NSpace,
  NLayout,
  NLayoutSider,
  NMenu,
  type MenuOption,
} from "naive-ui";
import type { Key } from "naive-ui/es/menu/src/interface";
import type { PropType } from "vue";
import { RouterLink } from "vue-router";

interface NavigationTree {
  title: string;
  _path: string;
  children?: NavigationTree[];
}
const props = defineProps({
  navigationTree: {
    type: Array as PropType<NavigationTree[]>,
    default: () => [],
  },
});

const emit = defineEmits(["update:collapsed"]);

const collapsed = ref(false);
const currentKey = ref<Key | undefined>(undefined);
const currentTitle = ref<string | undefined>(undefined);

const menuOptions = computed<MenuOption[]>(() => {
  return props.navigationTree.map((item) => ({
    label: () =>
      h(
        RouterLink,
        {
          to: item._path,
        },
        { default: () => item.title },
      ),
    key: item._path,
    path: item._path,
    children: item.children?.map((child) => ({
      label: () =>
        h(
          RouterLink,
          {
            to: child._path,
          },
          { default: () => child.title },
        ),
      key: child._path,
      path: child._path,
    })),
  }));
});
// 监听路由变化
watch(
  () => useRouter().currentRoute.value.path,
  () => {
    // 递归查找，匹配当前路由的key
    const findKey = (menu: MenuOption[]): Key | undefined => {
      for (const item of menu) {
        if (
          (item.path as string[])?.includes(useRouter().currentRoute.value.path)
        ) {
          return item.key;
        }
        if (item.children) {
          const key = findKey(item.children);
          if (key) {
            return key;
          }
        }
      }
    };
    const findTitle = (
      menu: (MenuOption & { labelText: string })[],
    ): string | undefined => {
      for (const item of menu) {
        if (
          (item.path as string[])?.includes(useRouter().currentRoute.value.path)
        ) {
          return item.labelText;
        }
        if (item.children) {
          const title = findTitle(
            item.children as (MenuOption & { labelText: string })[],
          );
          if (title) {
            return title;
          }
        }
      }
    };
    currentKey.value = findKey(menuOptions.value as MenuOption[]);
    currentTitle.value = findTitle(
      menuOptions.value as (MenuOption & { labelText: string })[],
    );
  },
  {
    immediate: true,
  },
);
</script>
