// JAk eXtended
// Josef Vanžura
var JAX = {
	version: "DEVEL",
	DECORATE_ONDEMAND: false,
	DEBUG: false
};

if(!window.console){console = {}};
if(!window.console.log){window.console.log = function(){}};
if(!window.console.info){window.console.info = function(){}};
if(!window.console.warn){window.console.warn = function(){}};
if(!window.console.error){window.console.error = function(){}};

JAX._DEPRECATED = function(func,since,instead){
	if(JAX.DEBUG){
		var msg = "WARNING: Deprecated function '"+(func||"?")+"' ";
		var since = since||false;
		var instead = instead||false;
		if(since){msg += "since version "+since+"";};
		msg += ". ";
		if(instead){msg += "Use '"+instead+"' instead.";};
		console.warn(msg);
	}
}

JAX.makeClass = function( NAME, EXTEND ){
	var obj = {
		NAME: NAME,
		VERSION: 1.0
	}
	if( !!EXTEND ){
		obj.EXTEND = EXTEND;
	}

	var instance = JAK.ClassMaker.makeClass(obj);
	instance.__JAXClass = true;
	return instance;
}

/* TODO dokumentace; bude veřejné?, zatím ne. */
/* JAX internal events */
JAX.IEvents = JAX.makeClass("JAX.IEvents");

JAX.IEvents.prototype.listen = function( event, callback ){
	if( !this.__listeners ) this.__listeners = {};
	if( !(event in this.__listeners) ){
		this.__listeners[event] = [];
	}
	this.__listeners[event].push( callback );
}

JAX.IEvents.prototype.event = function( event, element ){
	if( !this.__listeners ) this.__listeners = {};
	if( event in this.__listeners ){
		for( var i = 0; i < this.__listeners[event].length; i ++ ){
			this.__listeners[event][i]( element||null );
		}
	}
}

JAX.hash = function(value){
	var result = 0;
	var value = (""+value);
	for( var i = 0; i < value.length; i++ ){
		result += value.charCodeAt(i)*(10*i*i);
	}
	return result.toString(16);
}

/* Jednoduche kopirovani objektu */
JAX.copy = function( obj ){
	if( typeof(obj) == "object" ){
		var result = null;
		if ( obj instanceof Array ) {
			/* Jde o klasicke pole */
			result = [];
			for( var i = 0; i < obj.length; i ++ ){
				result.push( JAX.copy( obj[i] ) );
			}
		} else if( obj instanceof Date ){
			/* Jde o datum */
			var result = new Date();
			result.setTime( obj.getTime() );
		} else {
			/* Jde o slovnik */
			result = {};
			for( var key in obj ){
				result[key] = JAX.copy( obj[key] );
			}
		}
		return result;
	} else if( typeof(obj) == "function" ){
		throw TypeError("Not implemented.");
	} else {
		return obj;
	}
}

JAX.updateObject = function( updated, newer ){
	var newer = JAX.copy(newer);
	var updated = JAX.copy(updated);
	for( var key in newer ){
		updated[key] = newer[key];
	}
	return updated;
}

/* setTimeout wrapper */
JAX.Delay = function(func,time){
	this.args = [];
	if( arguments.length > 2 ){
		for( var i = 2; i < arguments.length; i ++){
			this.args.push(arguments[i]);
		}
		this.cycle = this._cycle.bind(this);
		this.func = func;
		this.timer = setTimeout(this.cycle,time);
	} else {
		this.timer = setTimeout(func,time);
	}
};

JAX.Delay.prototype._cycle = function(){
	this.func.apply(this.func,this.args);
}

JAX.Delay.prototype.stop = function(){
	clearTimeout(this.timer);
}

/* setInterval wrapper */
JAX.Interval = function(func,time){
	this.args = [];
	if( arguments.length > 2 ){
		for( var i = 2; i < arguments.length; i ++){
			this.args.push(arguments[i]);
		}
		this.cycle = this._cycle.bind(this);
		this.func = func;
		this.timer = setInterval(this.cycle,time);
	} else {
		this.timer = setInterval(func,time);
	}
};

JAX.Interval.prototype._cycle = function(){
	this.func.apply(this.func,this.args);
}

JAX.Interval.prototype.stop = function(){
	clearInterval(this.timer);
}
