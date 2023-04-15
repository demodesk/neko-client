import Vue from 'vue';
import Neko from './component/main.vue';
/**
 * Fügt eine "install" function hinzu
 *
 * Weitere Infos:
 *      https://vuejs.org/v2/cookbook/packaging-sfc-for-npm.html#Packaging-Components-for-npm
 */
declare const NekoElements: {
    install(vue: typeof Vue): void;
};
export { Neko };
export default NekoElements;
