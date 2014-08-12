"use strict"
var Promise = Promise || (function(){
	var p = function(callback){
		this.next = function(){};
		this.done = false;
		this.data = null;
		this.resolve = function(input){
			this.done = true;
			this.data = input;
			this.next();
		};
		this.reject = function(input){
			this.done = false;
			this.data = input;
		};
		callback.apply(this,this.resolve,this.reject);
		this.then = function(success,fail){//这里的cb有可能是一个普通函数，也可能是一个promise对象
			this.next = cb;
			
			
		};
	};
	return p;
})();