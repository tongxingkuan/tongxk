<template>
  <client-only>
    <div class="w-screen h-screen flex flex-col overflow-hidden">
      <header
        class="w-full h-10 shrink-0 bg-gray-200 flex items-center justify-between px-4"
      >
        <h1>童话的博客</h1>
        <globalSearch />
      </header>
      <nav class="w-full h-6">
        <NBreadcrumb>
          <NBreadcrumbItem>
            <RouterLink to="/">Home</RouterLink>
          </NBreadcrumbItem>
          <template v-for="item in cNavigation">
            <NBreadcrumbItem
              :key="item.name"
              v-if="
                route.path.includes('questions')
                  ? item.title === 'Questions'
                  : route.path.includes('articles')
                    ? item.title === 'Articles'
                    : false
              "
            >
              <NDropdown
                :options="
                  item.children?.map((i) => ({
                    label: () =>
                      h(
                        RouterLink,
                        {
                          to: i._path,
                          activeClass: '!text-blue-500',
                        },
                        { default: () => i.title },
                      ),
                    key: i.name,
                  }))
                "
              >
                <div>{{ item.title }}</div>
              </NDropdown>
            </NBreadcrumbItem>
          </template>
          <NBreadcrumbItem>
            <div>{{ route.params.slug?.[0] }}</div>
          </NBreadcrumbItem>
        </NBreadcrumb>
      </nav>
      <div class="flex size-full gap-3 overflow-hidden">
        <aside
          class="w-[260px] shrink-0 h-full overflow-hidden"
          :class="{ '!w-[84px]': collapsed }"
        >
          <contentNavigation
            class="size-full overflow-y-auto"
            @update:collapsed="handleCollapsed"
            :navigation-tree="cNavigation || []"
          ></contentNavigation>
        </aside>
        <main
          class="w-full h-full overflow-y-auto articles transition-all duration-200"
        >
          <slot></slot>
        </main>
        <aside class="w-[200px] shrink-0 h-full overflow-y-auto">
          <anchorNavigation :navigation-tree="aNavigation"></anchorNavigation>
        </aside>
      </div>
      <footer class="footer">版权所有@copyright</footer>
    </div>
  </client-only>
</template>
<script setup lang="ts">
import type { TocLink } from "@nuxt/content";
import { NBreadcrumb, NBreadcrumbItem, NDropdown } from "naive-ui";
import { RouterLink } from "vue-router";
const collapsed = ref(false);
const handleCollapsed = (_collapsed: boolean) => {
  collapsed.value = _collapsed;
};

const route = useRoute();

const aNavigation = ref<TocLink[]>([]);

// fetchContentNavigation 根据content目录结构生成路由，用queryContent限定想要的目录
const { data: cNavigation } = await useAsyncData("cNavigation", () => {
  return fetchContentNavigation(queryContent(""));
});

// 监听articles/questions子路由变化，并根据路由名找到对应的文章对象，body.toc.links是content生成，包含了markdown文档的锚点导航，depth参见配置项nuxt.config.ts。
if (route.params.slug && route.params.slug.length > 0) {
  const content = await queryContent(
    route.path.includes("questions")
      ? "questions/" + route.params.slug[0]
      : route.path.includes("articles")
        ? "articles/" + route.params.slug[0]
        : "",
  ).find();
  if (content && content.length > 0) {
    aNavigation.value = content?.[0]?.body?.toc?.links || [];
  } else {
    aNavigation.value = [];
  }
}

watch(route, async ({ params }) => {
  aNavigation.value = [];
  // 访问pages/index不会有slug，所以判断
  if (params.slug) {
    // 查询articles/questions目录下md文件中用"---"包裹的文件说明，其中route说明等于当前路由slug
    const content = await queryContent(
      route.path.includes("questions")
        ? "questions/" + route.params.slug[0]
        : route.path.includes("articles")
          ? "articles/" + route.params.slug[0]
          : "",
    ).find();
    if (content && content.length > 0) {
      aNavigation.value = content?.[0]?.body?.toc?.links || [];
    }
  }
});
</script>
<style lang="less" scoped>
.header {
  height: 50px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .logo {
    width: 50px;
    height: 50px;
  }

  h1 {
    width: auto;
    margin-left: 10%;
  }
}

.nav {
  height: 20px;
  padding: 5px 20px;
  display: flex;
  align-items: center;
  justify-content: right;
}

.footer {
  height: 30px;
  text-align: center;
  line-height: 30px;
}

:global(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
</style>
