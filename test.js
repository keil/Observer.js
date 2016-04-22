/*
 * Observer Proxy 
 * http://proglang.informatik.uni-freiburg.de/proxy/
 *
 * Copyright (c) 2016, Proglang, University of Freiburg.
 * http://proglang.informatik.uni-freiburg.de/
 * All rights reserved.
 *
 * Released under the MIT license
 * http://proglang.informatik.uni-freiburg.de/treatjs/license
 *
 * Author Matthias Keil
 * http://www.informatik.uni-freiburg.de/~keilr/
 */

var target = {
  a: 1,
  b: 2,
  c: {
    a: 1,
    b: 2,
    c: 3
  }
}


function TypeNumber() {
  return 

}



// wrap procedure will store, remember existing properties


var handler = {
  get: function(target, name, handler) {

    return observe(target[name], this); 
  }
}







function wrap(target, handler, realm) {

  if(target !== Object(target)) 
    return target;

  var handler = {
    get: function(target, name, handler) {
      {
        if(typeof target[name] !== 'number' && typeof target[name] !== 'object' )
          throw new Error(`Property ${name} is not a number`);
      }
      return wrap(target[name]); 
    }
  }

  return new realm.wrap(target, handler);
}


 var handler = {
   get: function(target, name, handler) {
     if(typeof target[name] !== 'number' && typeof target[name] !== 'object' )
       throw new Error(`Property ${name} is not a number`);

     return wrap(target[name]); 
   }
 }







var realm = Observer.createRealm(wrap);




var proxy = realm.Proxy(target);
print(proxy.a, proxy.b, proxy.c.a, proxy.c.b, proxy.c.x);
