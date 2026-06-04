import './assets/main.scss';

import { createApp, markRaw } from 'vue';
import { createPinia } from 'pinia';

import Provider from './Provider.vue';
import router from './router';
import i18n from './i18n';

import { Constants } from './Constants';
import images from './assets/getAssets.js';

const pinia = createPinia();
pinia.use(({ store }) => {
  store.$router = markRaw(router);
  store.$i18n = markRaw(i18n);
  store.$t = (key) => i18n.global.t(key); // This is added so that $router is available on this in pinia store
  store.$images = images;
});

const app = createApp(Provider);
app.provide('appImages', images);
app.provide('Constants', Constants);
window.Constants = Constants;

app.use(i18n);
app.use(pinia);
app.use(router);

app.mount('#app');

function getQueryParams(query) {
  var params = new URL(document.location).searchParams;
  var value = params.get(query);

  if (!value) {
    params = new URL(document.location.origin + '?' + document.location.href.split('?')[1]).searchParams;
    value = params.get(query);
  }

  return value;
}

let language = getQueryParams('lang');

if (!language) {
  language = 'en';
}

i18n.global.locale.value = language;

function isMac() {
  if (navigator.userAgentData) {
    return navigator.userAgentData.platform.toUpperCase().includes('MAC');
  } else {
    return navigator.userAgent.toUpperCase().includes('MAC');
  }
}

window.IS_MAC = isMac();
