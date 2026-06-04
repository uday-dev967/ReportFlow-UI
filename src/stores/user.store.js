import { defineStore } from 'pinia';
import { fetchLoginRedirectURL, login } from '../network/project.service';

export const useUser = defineStore('user', {
  state: () => ({
    auth: null,
  }),
  actions: {
    setAuth(token) {
      this.auth = token;
    },
    async fetchLoginRedirectURL() {
      return fetchLoginRedirectURL()
        .then((res) => {
          if (res.data && res.data.url) {
            window.location = res.data.url;
          }
        })
        .catch((e) => {
          console.log(e);
          return {};
        });
    },
    async fetchAuthToken(payload) {
      return login(payload)
        .then((res) => {
          if (res.data && res.data.token) {
            localStorage.setItem('Authorization', res.data.token);
            this.setAuth(res.data.token);
            window.location = window.origin;
          }
        })
        .catch((e) => {
          this.setAuth('');
          localStorage.setItem('Authorization', null);
          window.location = window.origin;
          return {};
        });
    },
  },
  getters: {},
});
