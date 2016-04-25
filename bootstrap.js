/**
 * Make TransparentProxy avaliable in standard engines.
 **/
var TransparentProxy = TransparentProxy || (function () {
  this.TransparentProxy = Proxy;
  this.TransparentProxy.createRealm = function() {
    return {Proxy:Proxy, equals: function(arg0, arg1) {
      return arg0 === arg1;
    }, WeakMap: WeakMap, WeakSet: WeakSet, Map: Map, Set: Set};
  }
})(this);
