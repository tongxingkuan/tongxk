<template>
  <client-only>
    <div class="w-screen h-screen flex flex-col overflow-hidden">
      <header
        class="w-full h-10 shrink-0 bg-gray-200 flex items-center justify-between px-4"
      >
        <h1>童话的博客</h1>
        <globalSearch />
      </header>
      <!-- <nav class="nav">
      当前位置：
      <el-breadcrumb>
        <template v-for="(breadcrumb, index) in computedRouteList" :key="breadcrumb.name">
          <template v-if="index < computedRouteList.length - 1">
            <el-breadcrumb-item :to="{ path: breadcrumb.path }">{{
              breadcrumb.name
            }}</el-breadcrumb-item>
          </template>
          <template v-else>
            <el-breadcrumb-item>{{ breadcrumb.name }}</el-breadcrumb-item>
          </template>
        </template>
      </el-breadcrumb>
    </nav> -->
      <div class="flex size-full gap-3 overflow-hidden">
        <aside
          class="w-[260px] fixed top-10 left-0"
          :class="{ '!w-[84px]': collapsed }"
        >
          <contentNavigation
            @update:collapsed="handleCollapsed"
            :navigation-tree="cNavigation || []"
          ></contentNavigation>
        </aside>
        <main
          class="ml-[280px] mr-[220px] w-full h-full overflow-y-auto articles transition-all duration-200"
          :class="{ '!ml-[104px]': collapsed }"
        >
          <slot></slot>
        </main>
        <aside class="w-[200px] fixed top-10 right-0 p-3">
          <el-scrollbar style="max-height: calc(100vh - 150px)">
            <anchorNavigation :navigation-tree="aNavigation"></anchorNavigation>
          </el-scrollbar>
        </aside>
      </div>
      <footer class="footer">版权所有@copyright</footer>
    </div>
  </client-only>
</template>
<script setup lang="ts">
import type { TocLink } from "@nuxt/content";
const collapsed = ref(false);
const handleCollapsed = (_collapsed: boolean) => {
  collapsed.value = _collapsed;
};

declare interface Breadcrumb {
  name: string;
  path: string;
}

// 转换路由路径为面包屑导航
const covert = (paths: string[]): Breadcrumb[] => {
  if (!paths || paths.length === 0) return [];
  let res: Breadcrumb[] = [],
    current = "",
    newItem: Breadcrumb;
  paths.forEach((item, index) => {
    if (index === 0) {
      res.push({
        name: item ? item : "home",
        path: "/" + item,
      });
    } else {
      if (current) {
        current += "/" + paths[index];
        newItem = {
          name: paths[index],
          path: current,
        };
      } else {
        current = paths[index - 1] + "/" + paths[index];
        newItem = {
          name: paths[index],
          path: current,
        };
      }
      res.push(newItem);
    }
  });
  return res;
};

const route = useRoute();

const aNavigation = ref<TocLink[]>([]);

const computedRouteList = computed(() => {
  const routeList = route.path.split("/");
  return covert(routeList);
});

// fetchContentNavigation 根据content目录结构生成路由，用queryContent限定想要的目录
const { data: cNavigation } = await useAsyncData("cNavigation", () => {
  return fetchContentNavigation(queryContent("articles"));
});

// 监听article子路由变化，并根据路由名找到对应的文章对象，body.toc.links是content生成，包含了markdown文档的锚点导航，depth参见配置项nuxt.config.ts。
if (route.params.slug && route.params.slug.length > 0) {
  const articles = await queryContent(
    "articles/" + route.params.slug[0],
  ).find();
  if (articles && articles.length > 0) {
    aNavigation.value = articles?.[0]?.body?.toc?.links || [];
  } else {
    aNavigation.value = [];
  }
}

watch(route, async ({ params }) => {
  aNavigation.value = [];
  // 访问pages/index不会有slug，所以判断
  if (params.slug) {
    // 查询articles目录下md文件中用"---"包裹的文件说明，其中route说明等于当前路由slug
    const articles = await queryContent(
      "articles/" + route.params.slug[0],
    ).find();
    if (articles && articles.length > 0) {
      aNavigation.value = articles?.[0]?.body?.toc?.links || [];
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
