module.exports = function (code) {
  const callback = this.async();
  // Cause the loader core logic is esm module, so we need to use dynamic import to load it.
  // eslint-disable-next-line node/file-extension-in-import
  import('./dist/loader.js').then(({ default: loader }) => {
    return loader.call(this, this, code, callback);
  });
};
