var Observer = Observer || (function() {

  //  _____                 _ _               
  // / ____|               | | |              
  //| (___   __ _ _ __   __| | |__   _____  __
  // \___ \ / _` | '_ \ / _` | '_ \ / _ \ \/ /
  // ____) | (_| | | | | (_| | |_) | (_) >  < 
  //|_____/ \__,_|_| |_|\__,_|_.__/ \___/_/\_\

  /** 
   * targets: target -> proxy
   **/
  var targets = new WeakMap();
  /** 
   * proxies: proxy -> target
   **/
  var proxies = new WeakMap();

  /** 
   * sandbox_wrap: target -> proxy
   **/
  function sandbox_wrap(target) {

    /**
     * If target is a primitive value, then return target
     **/
    if (target !== Object(target)) {
      return target;
    }

    /**
     * Avoid re-wrapping of proxies/ targets.
     **/
    if(targets.has(target)) {
      // target is already wrapped in an proxy
      return targets.get(target);
    } else if(proxies.has(target)) {
      // target is already an proxy
      return target;
    }

    /**
     * Create new sandbox proxy
     **/
    var proxy = new Proxy(target, new Membrane());
    //var proxy = new TransparentProxy(target, new Membrane()); // TODO

    /**
     * Stores the current proxy
     **/
    targets.set(target, proxy);
    proxies.set(proxy, target);

    return proxy;
  }


  /** 
   * sandbox_wrap: proxy -> target
   **/
  function sandbox_unwrap(proxy) {

    if(proxies.has(proxy)) {
      /* XXX */ print("cache hit");
      return proxies.get(proxy);
    } else {
      /* XXX */ print("cache miss", typeof proxy);
      return proxy;
    }
  }


  // TODO, deprecated
  function sandbox(target) {
    return sandbox_wrap(target);
  }

  



  // __  __           _                      ___                 
  //|  \/  |___ _ __ | |__ _ _ __ _ _ _  ___| __|_ _ _ _ ___ _ _ 
  //| |\/| / -_) '  \| '_ \ '_/ _` | ' \/ -_) _|| '_| '_/ _ \ '_|
  //|_|  |_\___|_|_|_|_.__/_| \__,_|_||_\___|___|_| |_| \___/_|  

  function MembraneError(trap="(unnamed)", message) {
    this.name = 'Membrane Error';
    this.message = message || `Pure trap-function ${trap} cannot cause observable effects.`;
    this.stack = (new Error()).stack;
  }
  MembraneError.prototype = Object.create(Error.prototype);
  MembraneError.prototype.constructor = MembraneError;

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
      return sandbox(Object.getPrototypeOf(target));
    }

    /**
     * A trap for Object.setPrototypeOf.
     **/
    this.setPrototypeOf = function(target, prototype) {
      throw new MembraneError('setPrototypeOf');
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
      throw new MembraneError('preventExtensions');
    };

    /** 
     * A trap for Object.getOwnPropertyDescriptor.
     **/
    this.getOwnPropertyDescriptor = function(target, name) {
      return sandbox(Object.getOwnPropertyDescriptor(target, name));
    };

    /** 
     * A trap for Object.defineProperty.
     **/
    this.defineProperty = function(target, name, desc) {
      throw new MembraneError('defineProperty');
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
      if(name === Symbol.toPrimitive) return sandbox(target[name]);
      if(name === Symbol.iterator) return target[name];

      var desc = Object.getOwnPropertyDescriptor(target, name);
      if(desc && desc.get) {
        var getter = sandbox(desc.get);
        return getter.apply(this);
      } else {
        return sandbox(target[name]);
      }
    };

    /** 
     * A trap for setting property values.
     **/
    this.set = function(target, name, value, receiver) {
      throw new MembraneError('set');
    };

    /**
     * A trap for the delete operator.
     **/
    this.deleteProperty = function(target, name) {
      throw new MembraneError('deleteProperty');
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
        return target.apply(sandbox(thisArg), sandbox(argumentsList));
      } else {
        return target.apply(thisArg, argumentsList); // TODO
        //throw new MembraneError('apply');
      }
    };

    /** 
     * A trap for the new operator. 
     **/
    this.construct = function(target, argumentsList) {
      if(target instanceof Pure) {
        var thisArg = Object.create(target.prototype);
        var result = target.apply(sandbox(thisArg), sandbox(argumentsList));
        return (result instanceof Object) ? result : sandbox(thisArg);
      } else {
        throw new MembraneError('construct');
      }
    }
  }

  // _    _                 _ _           
  //| |  | |               | | |          
  //| |__| | __ _ _ __   __| | | ___ _ __ 
  //|  __  |/ _` | '_ \ / _` | |/ _ \ '__|
  //| |  | | (_| | | | | (_| | |  __/ |   
  //|_|  |_|\__,_|_| |_|\__,_|_|\___|_|   

  // ___       __           _ _   
  //|   \ ___ / _|__ _ _  _| | |_ 
  //| |) / -_)  _/ _` | || | |  _|
  //|___/\___|_| \__,_|\_,_|_|\__|


  function NoOpHandler() {
    if(!(this instanceof NoOpHandler)) return new NoOpHandler();

    /**
     * A trap for Object.getPrototypeOf.
     **/
    this.getPrototypeOf = function(target) {
      return Object.getPrototypeOf(target);
    }

    /**
     * A trap for Object.setPrototypeOf.
     **/
    this.setPrototypeOf = function(target, prototype) {
      return Object.setPrototypeOf(target, prototype);
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
      return Object.preventExtensions(target);
    };

    /** 
     * A trap for Object.getOwnPropertyDescriptor.
     **/
    this.getOwnPropertyDescriptor = function(target, name) {
      return Object.getOwnPropertyDescriptor(target, name);
    };

    /** 
     * A trap for Object.defineProperty.
     **/
    this.defineProperty = function(target, name, descriptor) {
      return Object.defineProperty(target, name, descriptor)
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
      return (target[name]);

    };

    /** 
     * A trap for setting property values.
     **/
    this.set = function(target, name, value, receiver) {
      return (target[name] = value);
    };

    /**
     * A trap for the delete operator.
     **/
    this.deleteProperty = function(target, name) {
      return (delete target[name]);
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
      return target.apply(thisArg, argumentsList);
    };

    /** 
     * A trap for the new operator. 
     **/
    this.construct = function(target, argumentsList) {
      var thisArg = Object.create(target.prototype);
      var result = target.apply(thisArg, argumentsList);
      return (result instanceof Object) ? result : thisArg;
    }
  }

  //  ____  _                                  
  // / __ \| |                                 
  //| |  | | |__  ___  ___ _ ____   _____ _ __ 
  //| |  | | '_ \/ __|/ _ \ '__\ \ / / _ \ '__|
  //| |__| | |_) \__ \  __/ |   \ V /  __/ |   
  // \____/|_.__/|___/\___|_|    \_/ \___|_|   

  //  ___  _                            ___                 
  // / _ \| |__ ___ ___ _ ___ _____ _ _| __|_ _ _ _ ___ _ _ 
  //| (_) | '_ (_-</ -_) '_\ V / -_) '_| _|| '_| '_/ _ \ '_|
  // \___/|_.__/__/\___|_|  \_/\___|_| |___|_| |_| \___/_|  

  function ObserverError(message) {
    this.name = 'Obsever Error';
    this.message = message || 'Observer constraint violation.';
    this.stack = (new Error()).stack;
  }
  ObserverError.prototype = Object.create(Error.prototype);
  ObserverError.prototype.constructor = ObserverError;

  //         _ _ _                 
  // __ __ _| | | |_ _ _ __ _ _ __ 
  /// _/ _` | | |  _| '_/ _` | '_ \
  //\__\__,_|_|_|\__|_| \__,_| .__/
  //                         |_|   

  function calltrap(trap, defaulttrap, argumentsList) {
    
    /**
     * Trap return.
     * (Default return is undefined.)
     **/
    var trap_return = undefined;

    // TODO
    trap.call(this, ...sandbox_wrap(argumentsList), function(...args) {

      /**
       * Extract continuation.
       * (Continuation needs to be the last argument.)
       **/
      var continuation = args.pop();

      if((typeof continuation) !== 'function') throw new TypeError();

      /**
       * Unwrap the arguments.
       **/
      //var argumentsList = []; TODO
      for(var i in args) {
        print("i is", i);
        var arg = sandbox_unwrap(args[i]);
        
        //print("LLLLLLLLL" ,arg, "----", argumentsList[i]);

        if(arg !== argumentsList[i]) print("NOT CORRECT")
    //{
       //   argumentsList[i] = arg;
        //} else {
        //  throw new ObserverError(); 
       // }

//        argumentsList[i] = sandbox_unwrap(args[i]);
      }


      /**
       * Checks if arguments are identical.
       * TODO, is this correct or do we need a new structural equality test 
       * as the arguments, list may be a new array. 
       **/
      //for(var i in argumentsListX) {
      //  if(argumentsListX[i] === argumentsList) continue;
      //  else throw new ObserverError();
      //}

      // TODO
      // - unwrap arguments/ deactivate membrane
      // - check if values are identical 
      // (this requires that all transparent proxies are observer)


      /**
       * Calls the default operation.
       **/
      trap_return = defaulttrap.apply(this, argumentsList);

      /**
       * Continues the user-defined trap.
       **/
      continuation.call(this, sandbox_wrap(trap_return), function(result) {
        
        /**
         * Unwrap the user's return value.
         **/
        var user_return = sandbox_unwrap(result);
        
        /**
         * Checks if the user return is identical to the default return.
         * (This only works with transparent proxies.)
         *
         * The user-defined trap needs to return an value identical to the 
         * default return, i.e. either the same value or an observer of that value.
         **/
        if(trap_return === user_return) {
          trap_return = user_return;
        } else {
          throw new ObserverError(); 
        }

      });
    });


    /**
     *
     **/
    return trap_return;

  }

  // _  _              _ _         
  //| || |__ _ _ _  __| | |___ _ _ 
  //| __ / _` | ' \/ _` | / -_) '_|
  //|_||_\__,_|_||_\__,_|_\___|_|  


  function ObserverHandler(handler) {
     if(!(this instanceof ObserverHandler)) return new ObserverHandler(handler);

    /**
     * A trap for getting property values.
     * (Meta-Handler only recognizes get calls for traps.)
     **/ 
    this.get = function(noophandler, trap, receiver) {

      /** 
       * If the user-defined handler contains a trap-function for operation <trap>,
       * then the meta-handler returns a mediator function to catch the trap's arguments 
       * and calls to call the user-defined trap.
       * 
       * Otherwise, the meta-handler returns the default behaviour.
       **/
      return (trap in handler) ? function () {
        return calltrap(handler[trap], noophandler[trap], Array.from(arguments)) // TODO, test
      } : noophandler[trap];

    }
  }

  // __  __      _          ___  _                            
  //|  \/  |__ _| |_____   / _ \| |__ ___ ___ _ ___ _____ _ _ 
  //| |\/| / _` | / / -_) | (_) | '_ (_-</ -_) '_\ V / -_) '_|
  //|_|  |_\__,_|_\_\___|  \___/|_.__/__/\___|_|  \_/\___|_|  

  function mkObserver(realm) {
   
    // cache for remembering observer proxies
    var observers = realm.WeakSet();

    //  ___  _                            
    // / _ \| |__ ___ ___ _ ___ _____ _ _ 
    //| (_) | '_ (_-</ -_) '_\ V / -_) '_|
    // \___/|_.__/__/\___|_|  \_/\___|_|  

    function Observer(target, handler, keep=true) {
      if(!(this instanceof Observer)) return new Observer(target, handler, keep);


      if(proxies.has(target)) {
        /* XXX */ print("re-wrap sandboxed proxy");
        return sandbox(new Observer(proxies.get(target), handler, keep=true));
      }

      // Proxy Constructor
      var Proxy = realm.Proxy;

      // create new observer based on the given  handler
      var proxy = new realm.Proxy(target, new realm.Proxy(new NoOpHandler(), new ObserverHandler(handler)));

      // remembers existing observers
      if(keep) observers.add(proxy);

      // return new observer proxy
      return proxy;
    }

    //                 _       ___          _       
    // __ _ _ ___ __ _| |_ ___| _ \___ __ _| |_ __  
    /// _| '_/ -_) _` |  _/ -_)   / -_) _` | | '  \ 
    //\__|_| \___\__,_|\__\___|_|_\___\__,_|_|_|_|_|

    Object.defineProperty(Observer.prototype, "createRealm", {
      get: function() {

        // create a new indetitity realm
        var realm = TransparentProxy.createRealm();

        // redefine toString of new realm
        Object.defineProperty(realm, "toString", {
          value: "[[Identitiy Realm]]"
        });

        // redefine proxy constructor of new realm
        Object.defineProperty(realm, "Proxy", {
          value: mkObserver(realm)
        });

        // return new realm
        return realm;
      }
    });

    //                _               _           
    // __ ___ _ _  __| |_ _ _ _  _ __| |_ ___ _ _ 
    /// _/ _ \ ' \(_-<  _| '_| || / _|  _/ _ \ '_|
    //\__\___/_||_/__/\__|_|  \_,_\__|\__\___/_|  

    Object.defineProperty(Observer.prototype, "constructor", {
      value: Observer
    });

    // _       ___ _       _           
    //| |_ ___/ __| |_ _ _(_)_ _  __ _ 
    //|  _/ _ \__ \  _| '_| | ' \/ _` |
    // \__\___/___/\__|_| |_|_||_\__, |
    //                           |___/ 

    Object.defineProperty(Observer, "toString", {
      value: function() {
        return "[[Obserber Constructor]]";
      }
    });

    Object.defineProperty(Observer.prototype, "toString", {
      value: function() { 
        return "[[Observer]]";
      }
    });

    //                _          
    //__ _____ _ _ __(_)___ _ _  
    //\ V / -_) '_(_-< / _ \ ' \ 
    // \_/\___|_| /__/_\___/_||_|

    Object.defineProperty(Observer, "version", {
      value: "Observer 0.1.0 (PoC)"
    });

    Object.defineProperty(Observer.prototype, "version", {
      value: Observer.version
    });

    // _     ___  _                            
    //(_)___/ _ \| |__ ___ ___ _ ___ _____ _ _ 
    //| (_-< (_) | '_ (_-</ -_) '_\ V / -_) '_|
    //|_/__/\___/|_.__/__/\___|_|  \_/\___|_|  

    Object.defineProperty(Observer, "isObserver", {
      value: function(object) {
        return observers.has(object);
      } 
    });

    //         _                 
    // _ _ ___| |_ _  _ _ _ _ _  
    //| '_/ -_)  _| || | '_| ' \ 
    //|_| \___|\__|\_,_|_| |_||_|

    return Observer;
  }

  //         _                 
  // _ _ ___| |_ _  _ _ _ _ _  
  //| '_/ -_)  _| || | '_| ' \ 
  //|_| \___|\__|\_,_|_| |_||_|

  /*
  return (function() {
    // create new global Observer proxy
    var Observer = mkObserver(TransparentProxy.createRealm());
    
    // override transparent proxy constructor with Observer
    TransparentProxy = Observer;

    // return Observer
    return Observer; 
  })();*/

  // XXX
  return mkObserver(TransparentProxy.createRealm());

})();
