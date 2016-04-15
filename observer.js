var Observer = Observer || (function() {

  //__ __ ___ _ __ _ _ __ 
  //\ V  V / '_/ _` | '_ \
  // \_/\_/|_| \__,_| .__/
  //                |_|   

  /** 
   * maps: target -> proxy
   **/
  var proxies = new WeakMap();

  /** 
   * wrap: target -> proxy
   **/
  function wrap(target) {

    /**
     * If target is a primitive value, then return target
     **/
    if (target !== Object(target)) {
      return target;
    }

    /**
     * Avoids re-wrapping of proxies/ targets
     * Avaids double wrapped obejcts (only when unsing transparent proxies)
     **/
    if(proxies.has(target)) {
      return proxies.get(target);
    }

    var handler = new Membrane();
    var proxy = new TransparentProxy(target, handler);

    /**
     * Stores the current proxy
     **/
    proxies.set(target, proxy);

    return proxy;
  }

  // ___          _ _          ___                 
  //| _ \_  _ _ _(_) |_ _  _  | __|_ _ _ _ ___ _ _ 
  //|  _/ || | '_| |  _| || | | _|| '_| '_/ _ \ '_|
  //|_|  \_,_|_| |_|\__|\_, | |___|_| |_| \___/_|  
  //                    |__/                       

  // XXX
  function MembraneError(message) {
    this.name = 'MembraneError';
    this.message = message || 'Pure function cannot cause any observable side effects.';
    this.stack = (new Error()).stack;
  }
  MembraneError.prototype = Object.create(Error.prototype);
  MembraneError.prototype.constructor = MembraneError;

  // TODO implement a revokable reference

  // __  __           _                      
  //|  \/  |___ _ __ | |__ _ _ __ _ _ _  ___ 
  //| |\/| / -_) '  \| '_ \ '_/ _` | ' \/ -_)
  //|_|  |_\___|_|_|_|_.__/_| \__,_|_||_\___|

  function Membrane() {
    if(!(this instanceof Membrane)) return new Membrane();

    /**
     * A trap for Object.getPrototypeOf.
     **/
    this.getPrototypeOf = function(target) {
      return wrap(Object.getPrototypeOf(target));
    }

    /**
     * A trap for Object.setPrototypeOf.
     **/
    this.setPrototypeOf = function(target, prototype) {
      throw new MembraneError();
    }

    /**
     * A trap for Object.isExtensible
     **/
    this.isExtensible = function(target) {
      return Object.isExtensible(target);
    };

    /** 
     * A trap for Object.preventExtensions.
     **/
    this.preventExtensions = function(target) {
      throw new MembraneError();
    };

    /** 
     * A trap for Object.getOwnPropertyDescriptor.
     **/
    this.getOwnPropertyDescriptor = function(target, name) {
      return wrap(Object.getOwnPropertyDescriptor(target, name));
    };

    /** 
     * A trap for Object.defineProperty.
     **/
    this.defineProperty = function(target, name, desc) {
      throw new MembraneError();
    };

    /** 
     * A trap for the in operator.
     **/
    this.has = function(target, name) {
      return (name in target);
    };

    /**
     * A trap for getting property values.
     **/
    this.get = function(target, name, receiver) {
      if(name === Symbol.toPrimitive) return wrap(origin[name]);

      var desc = Object.getOwnPropertyDescriptor(origin, name);
      if(desc && desc.get) {
        var getter = wrap(desc.get);
        return getter.apply(this);
      } else {
        return wrap(target[name])
      }
    };

    /** 
     * A trap for setting property values.
     **/
    this.set = function(target, name, value, receiver) {
      throw new MembraneError();
    };

    /**
     * A trap for the delete operator.
     **/
    this.deleteProperty = function(target, name) {
      throw new MembraneError();
    };

    /** 
     * A trap for for...in statements.
     **/
    this.enumerate = function(target) {
      var properties = new Set();
      for(var property in target) {
        properties.add(property);
      }
      return Array.from(properties)[Symbol.iterator]();
    };

    /**
     * A trap for Object.getOwnPropertyNames.
     **/
    this.ownKeys = function(target) {
      return Object.getOwnPropertyNames(target);
    };

    /** 
     * A trap for a function call.
     **/
    this.apply = function(target, thisArg, argumentsList) {
      if(target instanceof Pure) {
        return target.apply(wrap(thisArg), wrap(argumentsList))
      } else {
        throw new MembraneError();
      }
    };

    /** 
     * A trap for the new operator. 
     **/
    this.construct = function(target, argumentsList) {
      if(target instanceof Pure) {
        var thisArg = Object.create(target.prototype);
        var result = target.apply(wrap(thisArg), wrap(argumentsList));
        return (result instanceof Object) ? result : wrap(thisArg);
      } else {
        throw new MembraneError();
      }
    }
  }














  function Membrane() {
    if(!(this instanceof Membrane)) return new Membrane();

    /**
     * A trap for Object.getPrototypeOf.
     **/
    this.getPrototypeOf = function(target) {
      return wrap(Object.getPrototypeOf(target));
    }

    /**
     * A trap for Object.setPrototypeOf.
     **/
    this.setPrototypeOf = function(target, prototype) {
      throw new MembraneError();
    }

    /**
     * A trap for Object.isExtensible
     **/
    this.isExtensible = function(target) {
      return Object.isExtensible(target);
    };

    /** 
     * A trap for Object.preventExtensions.
     **/
    this.preventExtensions = function(target) {
      throw new MembraneError();
    };

    /** 
     * A trap for Object.getOwnPropertyDescriptor.
     **/
    this.getOwnPropertyDescriptor = function(target, name) {
      return wrap(Object.getOwnPropertyDescriptor(target, name));
    };

    /** 
     * A trap for Object.defineProperty.
     **/
    this.defineProperty = function(target, name, desc) {
      throw new MembraneError();
    };

    /** 
     * A trap for the in operator.
     **/
    this.has = function(target, name) {
      return (name in target);
    };

    /**
     * A trap for getting property values.
     **/
    this.get = function(target, name, receiver) {
 
      // proxy-membrane must allow equal-updates
      [targeet, name, receiver] = callTrap('preGet', wrap({targeet:targeet, name:name, receiver:receiver}));

      /** Begin: default behavior
       **/
      var ret = target[name];

      return callTrap('preGet', {return:ret}).return;



-
-      var configuration = new Configation.Get(targeet, name, receiver);
-      
-      if(var trap = 'preGet' in handler) handler[trap](configuration);
-
-
-      Configation.equals(configuration, )
-
-      var {targeet:targeet, name:name, receiver:receiver} = calltrap('get', {targeet:targeet, name:name, receiver:receiver});
-
-      var {return:return} = 
-
-
-      if(('preGet') in handler) {
-        var configuration = {targeet:targeet, name:name, receiver:receiver};
-        var configurationP = handler['preGet'](configuration);
+      var desc = Object.getOwnPropertyDescriptor(origin, name);
+      if(desc && desc.get) {
+        var getter = wrap(desc.get);
+        return getter.apply(this);
+      } else {
+        return wrap(target[name])
       }
-
-      var 
-

      if()handler


      if(name === Symbol.toPrimitive) return wrap(origin[name]);

      var desc = Object.getOwnPropertyDescriptor(origin, name);
      if(desc && desc.get) {
        var getter = wrap(desc.get);
        return getter.apply(this);
      } else {
        return wrap(target[name])
      }
    };

    /** 
     * A trap for setting property values.
     **/
    this.set = function(target, name, value, receiver) {
      throw new MembraneError();
    };

    /**
     * A trap for the delete operator.
     **/
    this.deleteProperty = function(target, name) {
      throw new MembraneError();
    };

    /** 
     * A trap for for...in statements.
     **/
    this.enumerate = function(target) {
      var properties = new Set();
      for(var property in target) {
        properties.add(property);
      }
      return Array.from(properties)[Symbol.iterator]();
    };

    /**
     * A trap for Object.getOwnPropertyNames.
     **/
    this.ownKeys = function(target) {
      return Object.getOwnPropertyNames(target);
    };

    /** 
     * A trap for a function call.
     **/
    this.apply = function(target, thisArg, argumentsList) {
      if(target instanceof Pure) {
        return target.apply(wrap(thisArg), wrap(argumentsList))
      } else {
        throw new MembraneError();
      }
    };

    /** 
     * A trap for the new operator. 
     **/
    this.construct = function(target, argumentsList) {
      if(target instanceof Pure) {
        var thisArg = Object.create(target.prototype);
        var result = target.apply(wrap(thisArg), wrap(argumentsList));
        return (result instanceof Object) ? result : wrap(thisArg);
      } else {
        throw new MembraneError();
      }
    }
  }









  return Pure;

})();
