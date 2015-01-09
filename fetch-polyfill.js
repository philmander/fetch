var fetch = require('../fetch')(Promise);

if(window.fetch) {
    return;
}
for(var global in fetch) {
    if(fetch.hasOwnProperty(global)) {
        window[global] = fetch[global];
    }
}
window.fetch.promiseImpl = function(PromiseImpl) {
    return require('../fetch').promiseImpl(PromiseImpl);
};