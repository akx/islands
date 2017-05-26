// Based on coffee-loader (MIT) by @sokra
const coco = require('coco');
const loaderUtils = require('loader-utils');
module.exports = function (source) {
  this.cacheable && this.cacheable();
  const coffeeRequest = loaderUtils.getRemainingRequest(this);
  const jsRequest = loaderUtils.getCurrentRequest(this);
  const query = loaderUtils.getOptions(this) || {};
  const result = coco.compile(source, {
    literate: query.literate,
    filename: coffeeRequest,
    debug: this.debug,
    bare: true,
    sourceRoot: '',
    sourceFiles: [coffeeRequest],
    generatedFile: jsRequest,
  });
  this.callback(null, result);
};
