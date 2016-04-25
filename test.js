/**
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
 **/

/**
 * Target Object
 * a,b,c range over number fields
 * x,y,z range over object fields
 *
 **/
var target = {
  a: 1,
  b: 2,
  x: {
    a: 1,
    b: 2,
    c: 3
  }
}

print(Observer);

quit();

function wrap(target) {

  if(target !== Object(target)) 
    return target;

  var handler = {
    get: function(target, name, handler) {
      {
        if(typeof target[name] !== 'number' && typeof target[name] !== 'object')
          throw new Error(`Property ${name} is not a number or object`);
      }
      return wrap(target[name]); 
    }
  }

  return new Observer(target, handler);
}

var proxy = wrap(target);

print(proxy.a, proxy.b, proxy.c.a, proxy.c.b, proxy.c.x);
