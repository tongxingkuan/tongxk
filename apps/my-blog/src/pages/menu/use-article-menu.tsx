import { ref } from 'vue'
import { HomeOutline, DocumentOutline } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui/es/menu/src/interface'
import { RouterLink } from 'vue-router'

export const useMenu = () => {
  const menu = ref<(MenuOption & { labelText: string })[]>([
    {
      icon: () => <NIcon component={HomeOutline} />,
      key: 'home',
      path: ['/'],
      label: () => <RouterLink to="/">首页</RouterLink>,
      labelText: '首页',
    },
    {
      label: () => '文章',
      key: 'article',
      path: ['/article'],
      icon: () => <NIcon component={DocumentOutline} />,
      labelText: '文章',
      children: [
        {
          key: 'article1',
          path: ['/article/a1'],
          label: () => <RouterLink to="/article/a1">文章1</RouterLink>,
          labelText: '文章1',
        },
        {
          key: 'article2',
          path: ['/article/a2'],
          label: () => <RouterLink to="/article/a2">文章2</RouterLink>,
          labelText: '文章2',
        },
        {
          key: 'tsconfig',
          path: ['/article/tsconfig'],
          label: () => <RouterLink to="/article/tsconfig">tsconfig</RouterLink>,
          labelText: 'tsconfig',
        },
      ],
    },
  ])
  return {
    menu,
  }
}
