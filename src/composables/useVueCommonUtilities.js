import { useRouter } from 'vue-router';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useVueCommonUtilities() {
  const router = useRouter();
  const { t, te } = useI18n();

  function goToRoute(path) {
    router.push(path);
  }

  function getI18nText(text) {
    return te(text) ? t(text) : text;
  }
  return {
    goToRoute,
    getI18nText,
  };
}
