import { defineStore } from 'pinia';

export const useCommon = defineStore('common', {
  state: () => ({
    commonLoaderState: false,
  }),
  actions: {
    showLoader() {
      this.commonLoaderState = true;
    },
    hideLoader() {
      this.commonLoaderState = false;
    },
  },
  getters: {},
});
