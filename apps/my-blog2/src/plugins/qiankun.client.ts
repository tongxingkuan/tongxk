import { registerMicroApps, start } from 'qiankun'

export default defineNuxtPlugin(nuxtApp => {
  registerMicroApps(
    [
      {
        name: 'react-app',
        entry: '//localhost:3002/',
        container: '#reactApp',
        activeRule: '/qiankun/reactApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'vite-app',
        entry: '//localhost:3001/',
        container: '#viteApp',
        activeRule: '/qiankun/viteApp',
        props: {
          msg: 'hello from parent',
        },
      },
      {
        name: 'vue2-app',
        entry: '//localhost:3003/',
        container: '#vue2App',
        activeRule: '/qiankun/vue2App',
        props: {
          msg: 'hello from parent',
        },
      },
    ],
    {
      beforeLoad: [
        app => {
          console.log('before load', app.name)
          return Promise.resolve()
        },
      ],
      beforeMount: [
        app => {
          console.log('before mount', app.name)
          return Promise.resolve()
        },
      ],
      beforeUnmount: [
        app => {
          console.log('before unmount', app.name)
          return Promise.resolve()
        },
      ],
    },
  )
  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
  })
})
