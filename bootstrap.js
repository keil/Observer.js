var TransparentProxy = TransparentProxy || Proxy;

if(TransparentProxy === Proxy) {
  TransparentProxy.createRealm = function() {
    var cache = new WeakMap();

    return {
      Proxy: function(target, handler) {
        var proxy = new Proxy(target, handler);
        cache.set(proxy, target);
      },

      equals: function(arg0, arg1) {
        var var0 = cache.has(arg0) ? cache.get(arg0) : arg0;
        var var1 = cache.has(arg1) ? cache.get(arg1) : arg1;
        return var0 === var1;
      }
    }
  }
}
