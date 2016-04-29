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
 * Implementation of a tree in JavaScipt.
 **/
function Node (value, left, right) {
  if(!(this instanceof Node)) return new Node (value, left, right);

  this.value = value;
  this.left = left;
  this.right = right;
}
Node.prototype.toString = function () {
  return "[" + (this.left?this.left + ", ":"") + this.value +(this.right?", "+this.right:"") + "]";
}

function sumOf (node) {
  return (node) ? node.value + sumOf(node.left) + sumOf(node.right) : 0;
}

function depthOf (node) {
  return node ? Math.max(depthOf(node.left), depthOf(node.right))+1 : -1;
}

/**
 * Simple tree consisting of two nodes and three leafs.
 **/
var target = Node(0, Node(1, Node(2), Node(3)), Node('3'));


/**
 * Simple contract wrapper.
 **/
function wrap(target) {

  if(target !== Object(target)) 
    return target;

  var handler = {
    get: function(target, name, receiver, callback) {

      /**
       * Checks for non existing properties.
       * (Pre-operation check)
       **/
      print("@access propert", name, "on", target, "results in", target[name]);
      
      if(target[name] === undefined)
        throw new Error(`Access to undefined proeprty ${name}.`);

      /**
       * Continue observation
       **/
      callback(target, name, receiver, function(result, callback) {

        /**
         * Checks if the value field is of type number.
         * (Post-operation check)
         **/
        if(name === 'value' && (typeof result) !== 'number') throw new Error(`Property ${name} is not a number.`);
       
        var proxy = wrap(result);

        //print(proxy)
        
        callback(wrap(result));


      });
    }
  }

  return new Observer(target, handler);
}

var proxy = wrap(target);
