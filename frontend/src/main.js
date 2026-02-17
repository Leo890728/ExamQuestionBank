import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { createBootstrap } from 'bootstrap-vue-next'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue-next/dist/bootstrap-vue-next.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/dark-mode.css'
import 'bootstrap'
import VueStickyDirective from '@renatodeleao/vue-sticky-directive'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(createBootstrap())
app.use(VueStickyDirective)

app.mount('#app')
