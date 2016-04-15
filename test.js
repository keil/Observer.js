// not all traps must exists
// but, if exist, the must be transparent
//
// realm? did they need a proxy construtor of that realm
//
// all arguments need to be wrapped in a proxy (membrane) that 
// protects the target, ans that ofter return gets deactivated 
// 
// To this end, we wrap [target, name, receiver] in a transparent proxy 
// (membrane) which throws an exception if anything happens to the elements
// after calling the trap, we deactivate the protection mechanism,
//
// deactivating a protecting membrane did not work because the trap may store 
// the element somewhere, thus, unpacking is required
// but, the trap may wrap an element in  another observer
//

var obj = {i:0};

function f (arg) {
  return arg.i++;
}

//var p = new Pure({}, "arg", "return obj.i");
var p = Pure.from(f);

//print(p);
print(typeof p, p instanceof Function, p instanceof Pure)
print(p(obj));
print(p(obj));

p.apply(undefined, [obj]);

// TODO
// Test id the prototype works

quit();

function Observer(target, handler) {
  // TODO, needs to be constructor

  var pre  = 'pre_';
  var post = 'post_';

  var noophandler

  var metahandler = {
    get: function(target, name, receiver) {
      print(`@ ${name}`);

      if(name in handler) return handler[name];

    }

  }


  return new Proxy(target, new Proxy(handler, metahandler));


}



// XXX USER CODE

var handler = {
  pre_get: function(target, name, receiver) {
    print('# get', `request ${name}`);
    return 2;
  },

  post_get: function(target, name, receiver) {
    print('# get', `request ${name}`);
    return 2;
  }

}
var target = {}

var proxy = new Observer(target, handler);

var i=0;
print(i+++' --> ', proxy.x);
print(i+++' --> ', proxy.x = 1);
print(i+++' --> ', proxy.x);







quit();


// handler did not implement  membrane
//
var handler = {

  preGet: function(configuration) {
    return configuration;
  },

  postGet: function(configuration) {
    return configuration;
  },

  preSet: function(configuration) {
    return configuration;
  },
  postSet: function(configuration) {
    return configuration;
  },

  preApply: function(configuration) {
    return configuration;
  },

  postApply: function(configuration) {
    return configuration;
  },

}


  function Handler() {
    if(!(this instanceof Handler)) return new Handler();

    // _______                  
    //|__   __|                 
    //   | |_ __ __ _ _ __  ___ 
    //   | | '__/ _` | '_ \/ __|
    //   | | | | (_| | |_) \__ \
    //   |_|_|  \__,_| .__/|___/
    //               | |        
    //               |_|        

    /**
     * A trap for Object.getPrototypeOf.
     */
    this.getPrototypeOf = function(shadow) {
      __verbose__ && logc("getPrototypeOf");
      __effect__  && trace(new Effect.GetPrototypeOf(self, origin));

      /**
       * Note: Matthias Keil
       * The current proxy implementation did not support
       * Object.getPrototypeOf.
       */
      // return wrap(Object.getPrototypeOf(shadow));
      throw new Error('Trap not supported.');
    }

    /**
     * A trap for Object.setPrototypeOf.
     */
    this.setPrototypeOf = function(shadow, prototype) {
      __verbose__ && logc("setPrototypeOf");
      __effect__  && trace(new Effect.SetPrototypeOf(self, origin));

      /**
       * Note: Matthias Keil
       * The current proxy implementation did not support
       * Object.setPrototypeOf.
       */
      // return Object.setPrototypeOf(shadow, prototype);
      throw new Error('Trap not supported.');
    }

    /**
     * A trap for Object.isExtensible
     */
    this.isExtensible = function(shadow) {
      __verbose__ && logc("isExtensible");
      __effect__  && trace(new Effect.IsExtensible(self, origin));

      return Object.isExtensible(shadow);
    };

    /** 
     * A trap for Object.preventExtensions.
     */
    this.preventExtensions = function(shadow) {
      __verbose__ && logc("preventExtensions");
      __effect__  && trace(new Effect.PreventExtensions(self, origin));

      /**
       * Copies all properties (property names) from the target object
       * to the shadow object. 
       *
       * This step is required because of some proxy internal invariants
       * witch require that a non-extensible shadow object is not allowed 
       * to return properties (keys) of the target object.
       */
      for (var property in origin) {
        if (!touched(property) && origin.hasOwnProperty(property)) {
          Object.defineProperty(shadow, property, wrap(Object.getOwnPropertyDescriptor(origin, property)));
        }
      }

      return Object.preventExtensions(shadow);
    };

    /** 
     * A trap for Object.getOwnPropertyDescriptor.
     */
    this.getOwnPropertyDescriptor = function(shadow, name) {
      __verbose__ && logc("getOwnPropertyDescriptor", (typeof name === 'string') ? name : name.toString());
      __effect__  && trace(new Effect.GetOwnPropertyDescriptor(self, origin, (typeof name === 'string') ? name : name.toString()));

      return (touched(name)) ? 
        Object.getOwnPropertyDescriptor(shadow, name) :
        wrap(Object.getOwnPropertyDescriptor(origin, name));
    };

    /** 
     * A trap for Object.defineProperty.
     */
    this.defineProperty = function(shadow, name, desc) {
      __verbose__ && logc("defineProperty", (typeof name === 'string') ? name : name.toString());
      __effect__ &&  trace(new Effect.DefineProperty(self, origin, (typeof name === 'string') ? name : name.toString()));

      var current = touched(name) ? 
        Object.getOwnPropertyDescriptor(shadow, name) : 
        wrap(Object.getOwnPropertyDescriptor(origin, name));

      if(current === undefined) {
        // non-existing property
        if(Object.isExtensible(shadow)) {
          // extensible object
          touch(name);
          return Object.defineProperty(shadow, name, desc);
        } else {
          // non-extensible object
          throw new TypeError(`${shadow} is not extensible`);
        }
      } else {
        // existing property
        if(current.configurable) {
          // configurable property
          for(var key in desc) {
            current[key] = desc[key];
          }
          // corresponds the ECMA specification
          if(desc.get || desc.set) {
            delete current.value;
            delete current.writable;
          }
          touch(name);
          return Object.defineProperty(shadow, name, current);
        } else {
          // non-configurable property
          if(current.value) {
            current.value = desc.value || current.value;
          } else if(current.get || current.set) {
            current.get = desc.get || current.get;
            current.set = desc.set || current.set;
          } else {
            throw new TypeError(`can't redefine non-configurable property "${name}"`);
          }
          touch(name);
          return Object.defineProperty(shadow, name, current);
        }
      }
    };

    /** 
     * A trap for the in operator.
     */
    this.has = function(shadow, name) {
      __verbose__ && logc("has", (typeof name === 'string') ? name : name.toString());
      __effect__  && trace(new Effect.Has(self, origin, (typeof name === 'string') ? name : name.toString()));

      if(origin===global) return true;
      else return (touched(name)) ? (name in shadow) : (name in origin);
    };

    /**
     * A trap for getting property values.
     */
    this.get = function(shadow, name, receiver) {
      __verbose__ && logc("get", (typeof name === 'string') ? name : name.toString());
      __effect__  && trace(new Effect.Get(self, origin, (typeof name === 'string') ? name : name.toString()));

      /** Handles the Symbol.toPrimitive property
      */
      if(name === Symbol.toPrimitive) return wrap(origin[name]);
      //if(name === "valueOf") return origin[name];

      // Node: Matthias Keil
      // Bug in previous versions. Access to undefined causes a 
      // property access on the global object.
      // TODO, test if this also happens in the new engine
      if(origin===global && name==='undefined') return undefined;

      // Test for getter functions
      if(touched(name)) {
        return shadow[name];
      } else {
        var desc = Object.getOwnPropertyDescriptor(origin, name);
        // if getter exists, call getter function
        // else forwards operation to the target
        if(desc && desc.get) {
          var getter = wrap(desc.get);
          return getter.apply(this);
        } else {
          return wrap(origin[name])
        }
      }
    };

    /** 
     * A trap for setting property values.
     */
    this.set = function(shadow, name, value, receiver) {
      __verbose__ && logc("set", name);
      __effect__  && trace(new Effect.Set(self, origin, name));

      // Test for setter functions
      if(touched(name)) {
        shadow[name]=value;
      } else {

        var desc = Object.getOwnPropertyDescriptor(origin, name);

        // create new fields
        // or update existing field
        if(desc === undefined) {
          // non-existing property
          if(Object.isExtensible(shadow)) {
            // extensible object
            touch(name);
            (shadow[name]=value);
          } else {
            // non-extensible object
            throw new TypeError(`${shadow} is not extensible`);
          }
        } else {

          if(desc.set) {
            var setter = wrap(desc.set);
            setter.apply(this, [value]);        
          } else if(desc.writable) {
            // writeable property
            touch(name);
            (shadow[name]=value);
          } else {
            // non-writeable property
            throw new TypeError(`"${name}" is read-only`);
          }
        }
      }

      return true;
    };

    /**
     * A trap for the delete operator.
     */
    this.deleteProperty = function(shadow, name) {
      __verbose__ && logc("deleteProperty", (typeof name === 'string') ? name : name.toString());
      __effect__  && trace(new Effect.DeleteProperty(self, origin, (typeof name === 'string') ? name : name.toString()));

      var desc = touched(name) ? 
        Object.getOwnPropertyDescriptor(shadow, name) : 
        wrap(Object.getOwnPropertyDescriptor(origin, name));

      if(desc === undefined) {
        // non-existing property
        touch(name);
        return (delete shadow[name]);
      } else {
        // existing property
        if(desc.configurable) {
          touch(name);
          return (delete shadow[name]);
        } else {
          // non-configurable property
          throw new TypeError(`property "${name}" is non-configurable and can't be deleted`);
        }
      }
    };

    /** 
     * A trap for for...in statements.
     */
    this.enumerate = function(shadow) {
      __verbose__ && logc("enumerate");
      __effect__  && trace(new Effect.Enumerate(self, origin));

      var properties = new Set();
      if(Object.isExtensible(shadow)) for(var property in origin) {
        if(!touched(property) || (property in shadow)) properties.add(property); 
      }
      for(var property in shadow) {
        properties.add(property);
      }
      return Array.from(properties)[Symbol.iterator]();
    };

    /**
     * A trap for Object.getOwnPropertyNames.
     */
    this.ownKeys = function(shadow) {
      __verbose__ && logc("ownKeys");
      __effect__  && trace(new Effect.OwnKeys(self, origin));

      var properties = new Set();
      if(Object.isExtensible(shadow)) for(var property of Object.getOwnPropertyNames(origin)) {
        if(!touched(property) || (property in shadow)) properties.add(property);
      }
      for(var property of Object.getOwnPropertyNames(shadow)) {
        properties.add(property);
      }
      return Array.from(properties); 
    };

    /** 
     * A trap for a function call.
     */
    this.apply = function(shadow, thisArg, argumentsList) {
      __verbose__ && logc("apply");
      __effect__  && trace(new Effect.Apply(self, origin));

      /* Special treatment for calling native functions
      */
      if(native && thisArg && targets.has(thisArg)) {
        thisArg = targets.get(thisArg);
      }

      thisArg = thisArg ? thisArg : wrap(global);
      return native ? origin.apply(thisArg, argumentsList) : shadow.apply(thisArg, argumentsList);
    };

    /** 
     * A trap for the new operator. 
     */
    this.construct = function(shadow, argumentsList) {
      __verbose__ && logc("construct");
      __effect__  && trace(new Effect.Construct(self, origin));

      /* Special treatment for constructing new date objects
      */
      if(origin===Date)
        return new Date(Date.apply({}, argumentsList));

      /* Special treatment for constructing typed arrays
      */
      if(typedArrays.has(origin)) {
        switch(argumentsList.length) {
          case 0:
            return new origin();
            break;
          case 1:
            return new origin(argumentsList[0]);
            break;
          case 2:
            return new origin(argumentsList[0], argumentsList[1]);
            break;
          case 3:
            return new origin(argumentsList[0], argumentsList[1], argumentsList[2]);
            break;
          case 4:
            return new origin(argumentsList[0], argumentsList[1], argumentsList[2], argumentsList[3]);
            break;
          default:
            throw new TypeError('Incalid constructor call.');
        }
      }

      var thisArg = native ? Object.create(origin.prototype) : Object.create(shadow.prototype);
      var result =  native ? origin.apply(thisArg, argumentsList) : shadow.apply(thisArg, argumentsList);

      // this should be done internally 
      /*if(origin===Object) {
      // copies all properties
      for (var property of Object.getOwnPropertyNames(Object.prototype)) {
      var descriptor = Object.getOwnPropertyDescriptor(Object.prototype, property);
      Object.defineProperty(result, property, descriptor);
      }
      }*/

      return (result instanceof Object) ? result : thisArg;
    }
  };

