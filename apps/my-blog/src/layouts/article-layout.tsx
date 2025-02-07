import { createComponent } from 'shared'
import { ref, watch, type Component, type VNode } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NDropdown,
  NLayout,
  NLayoutSider,
  NMenu,
  type MenuOption,
} from 'naive-ui'
import { useMenu } from 'src/pages/menu/use-article-menu'
import type { Key } from 'naive-ui/es/cascader/src/interface'

type RouterViewSlot = {
  Component: Component
}

export const ArticleLayout = createComponent(null, () => {
  const collapsed = ref(false)
  const { menu } = useMenu()
  const router = useRouter()
  const currentKey = ref<Key>()
  const currentTitle = ref<string>()

  watch(
    router.currentRoute,
    () => {
      // 递归查找，匹配当前路由的key
      const findKey = (menu: MenuOption[]): Key | undefined => {
        for (const item of menu) {
          if (
            (item.path as string[]).includes(router.currentRoute.value.path)
          ) {
            return item.key
          }
          if (item.children) {
            const key = findKey(item.children)
            if (key) {
              return key
            }
          }
        }
      }
      const findTitle = (
        menu: (MenuOption & { labelText: string })[],
      ): string | undefined => {
        for (const item of menu) {
          if (
            (item.path as string[]).includes(router.currentRoute.value.path)
          ) {
            return item.labelText
          }
          if (item.children) {
            const title = findTitle(
              item.children as (MenuOption & { labelText: string })[],
            )
            if (title) {
              return title
            }
          }
        }
      }
      currentKey.value = findKey(menu.value as MenuOption[])
      currentTitle.value = findTitle(
        menu.value as (MenuOption & { labelText: string })[],
      )
    },
    {
      immediate: true,
    },
  )

  return () => (
    <div class="h-screen w-screen overflow-auto grid grid-cols-[auto_1fr] grid-rows-[40px_1fr] gap-3 grid-template-areas-top-left-main">
      <div class="row-span-full grid-area-left">
        <NLayout has-sider class="h-full">
          <NLayoutSider
            bordered
            collapse-mode="width"
            collapsed-width={64}
            width={200}
            collapsed={collapsed.value}
            show-trigger
            onCollapse={() => (collapsed.value = true)}
            onExpand={() => (collapsed.value = false)}
          >
            <NMenu
              value={currentKey.value}
              collapsed={collapsed.value}
              collapsed-width={64}
              collapsed-icon-size={22}
              key-field="key"
              label-field="label"
              children-field="children"
              options={menu.value as MenuOption[]}
            />
          </NLayoutSider>
          <NLayout />
        </NLayout>
      </div>
      <div class="w-auto row-span-1 grid-area-top p-3">
        <NBreadcrumb>
          {(menu.value as MenuOption[]).map(item => (
            <NBreadcrumbItem>
              <NDropdown options={item.children}>
                <div class="trigger">{(item?.label as () => VNode)?.()}</div>
              </NDropdown>
            </NBreadcrumbItem>
          ))}
          <NBreadcrumbItem>
            <NDropdown>
              <div class="trigger">{currentTitle.value}</div>
            </NDropdown>
          </NBreadcrumbItem>
        </NBreadcrumb>
      </div>
      <div class="w-auto row-span-11 grid-area-main p-3">
        <RouterView name="main">
          {{
            default: ({ Component }: RouterViewSlot) =>
              Component ? Component : null,
          }}
        </RouterView>
      </div>
    </div>
  )
})

export default ArticleLayout
