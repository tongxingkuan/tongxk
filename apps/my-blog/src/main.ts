import { createApp } from 'vue'
import 'src/styles/global.css'
import { App } from 'src/app'
import router from 'src/router'

const app = createApp(App)

app.use(router)
app.mount('#app')
