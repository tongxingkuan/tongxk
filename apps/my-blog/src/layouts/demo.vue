<template>
  <client-only>
    <div class="article-layout">
      <header class="site-header">
        <div class="header-left">
          <NuxtLink to="/" class="logo">
            <img src="/icon.webp" class="logo-icon" alt="logo" />
            <span class="logo-text">童话的博客</span>
          </NuxtLink>
        </div>
        <div class="header-center">
          <globalSearch />
        </div>
        <div class="header-right">
          <nav class="main-nav">
            <NuxtLink to="/articles" class="nav-link" active-class="active">文章</NuxtLink>
            <NuxtLink to="/demos" class="nav-link" active-class="active">演示</NuxtLink>
            <NuxtLink to="/questions" class="nav-link" active-class="active">面试题</NuxtLink>
          </nav>
        </div>
      </header>
      <nav class="breadcrumb-nav">
        <n-breadcrumb>
          <template v-for="(breadcrumb, index) in computedRouteList" :key="breadcrumb.name">
            <template v-if="index < computedRouteList.length - 1">
              <n-breadcrumb-item :to="{ path: breadcrumb.path }">{{ breadcrumb.name }}</n-breadcrumb-item>
            </template>
            <template v-else>
              <n-breadcrumb-item>{{ breadcrumb.name }}</n-breadcrumb-item>
            </template>
          </template>
        </n-breadcrumb>
      </nav>
      <main class="demos">
        <div class="demos-scroll">
          <slot></slot>
        </div>
      </main>
      <footer class="footer">
        <span class="footer-text">© 2024 童话的博客 · 技术分享 · 实战演示</span>
      </footer>
    </div>
  </client-only>
</template>
<script setup lang="ts">
declare interface Breadcrumb {
  name: string
  path: string
}

// 转换路由路径为面包屑导航
const covert = (paths: string[]): Breadcrumb[] => {
  if (!paths || paths.length === 0) return []

  const nameMap: Record<string, string> = {
    '': '首页',
    demos: '演示',
    lazyload: '图片懒加载',
    xlegex: 'x了个x',
  }

  let res: Breadcrumb[] = [],
    current = '',
    newItem: Breadcrumb
  paths.forEach((item, index) => {
    if (index === 0) {
      res.push({
        name: item ? nameMap[item] || item : '首页',
        path: '/' + item,
      })
    } else {
      if (current) {
        current += '/' + paths[index]
        newItem = {
          name: nameMap[paths[index]] || paths[index],
          path: current,
        }
      } else {
        current = paths[index - 1] + '/' + paths[index]
        newItem = {
          name: nameMap[paths[index]] || paths[index],
          path: current,
        }
      }
      res.push(newItem)
    }
  })
  return res
}

const route = useRoute()

const computedRouteList = computed(() => {
  const routeList = route.path.split('/')
  return covert(routeList)
})
</script>
<style lang="less" scoped>
.site-header {
  height: 56px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
  box-shadow: 0 2px 12px rgba(230, 162, 60, 0.15);
  flex-shrink: 0;

  .header-left {
    flex: 1;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #fff;

    .logo-icon {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  .header-center {
    flex: 2;
    display: flex;
    justify-content: center;
    max-width: 500px;
  }

  .header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
  }

  .main-nav {
    display: flex;
    gap: 8px;
  }

  .nav-link {
    padding: 8px 20px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
    }

    &.active {
      background: rgba(255, 255, 255, 0.25);
      color: #fff;
    }
  }
}

.breadcrumb-nav {
  height: 44px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.05) 0%, rgba(245, 108, 108, 0.05) 100%);
  border-bottom: 1px solid rgba(230, 162, 60, 0.15);
  flex-shrink: 0;

  :deep(.n-breadcrumb) {
    .n-breadcrumb-item {
      .n-breadcrumb-item__link {
        color: #666;
        font-size: 13px;
        transition: all 0.2s ease;

        &:hover {
          color: #e6a23c;
        }
      }

      .n-breadcrumb-item__separator {
        color: #c0c4cc;
        font-size: 12px;
      }

      &:last-child .n-breadcrumb-item__link {
        color: #333;
        font-weight: 500;
      }
    }
  }
}

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

.demos {
  display: block;
  width: auto;
  height: calc(100vh - 132px);
  overflow: hidden;

  .demos-scroll {
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
}

.footer {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;

  .footer-text {
    font-size: 13px;
    color: #999;
  }
}

@media (max-width: 768px) {
  .article-layout {
    touch-action: pan-y;
  }

  .site-header {
    padding: 0 12px;

    .logo-text {
      display: none;
    }

    .header-center {
      display: none;
    }

    .nav-link {
      padding: 6px 10px;
      font-size: 13px;
    }
  }

  .breadcrumb-nav {
    padding: 0 12px;
  }

  .demos {
    height: calc(100vh - 136px);

    .demos-scroll {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }
  }
}

@media (max-width: 480px) {
  .site-header {
    .nav-link {
      padding: 6px 8px;
      font-size: 12px;
    }
  }
}
</style>
