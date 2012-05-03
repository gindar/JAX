/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Metronom: udržuje běžící interval (default 60fps nebo requestAnimationFrame) a notifikuje o jeho průběhu všechny zájemce
 * @group jak-utils
 */
JAK.Timekeeper = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.Timekeeper",
	VERSION: "1.1"
});

JAK.Timekeeper.prototype.$constructor = function() {
	this._delay = 1000/60;
	this._listeners = [];
	this._running = 0; /* 0 = stopped, 1 = stopping, 2 = running */
	this._tick = this._tick.bind(this);

	this._scheduler = window.requestAnimationFrame 
						|| window.webkitRequestAnimationFrame 
						|| window.mozRequestAnimationFrame 
						|| window.oRequestAnimationFrame 
						|| window.msRequestAnimationFrame 
						|| function(callback, element) {
              				setTimeout(callback, this._delay);
           				};
}

/**
 * Přidání posluchače
 * @param {object} what Objekt žádající o notifikaci
 * @param {string || function} method Metoda k volání
 * @param {int} [count=1] Počet tiknutí na jednu notifikaci
 */
JAK.Timekeeper.prototype.addListener = function(what, method, count) {
	var index = this._findListener(what);
	if (index != -1) { throw new Error("This listener is already attached"); }
	
	var obj = {
		what: what,
		method: method,
		count: count || 1,
		bucket: 0
	}
	obj.bucket = obj.count;
	this._listeners.push(obj);
	
	if (this._running != 2) { 
		if (this._running == 0) { this._schedule(); }
		this._running = 2;
	}
	return this;
}

/**
 * Odebrání posluchače
 * @param {object} what Objekt žádající o odebrání
 */
JAK.Timekeeper.prototype.removeListener = function(what) {
	var index = this._findListener(what);
	if (index == -1) { throw new Error("Cannot find listener to be removed"); }
	this._listeners.splice(index, 1);
	
	if (!this._listeners.length) { this._running = 1; }
	return this;
}

JAK.Timekeeper.prototype._findListener = function(what) {
	for (var i=0;i<this._listeners.length;i++) {
		if (this._listeners[i].what == what) { return i; }
	}
	return -1;
}

JAK.Timekeeper.prototype._tick = function() {
	if (this._running == 1) { this._running = 0; }
	if (this._running == 0) { return; }

	this._schedule(); 	
	for (var i=0;i<this._listeners.length;i++) {
		var item = this._listeners[i];
		item.bucket--;
		if (item.bucket) { continue; } /* jeste ne */
		
		item.bucket = item.count;
		var obj = item.what;
		var method = (typeof(item.method) == "string" ? obj[item.method] : item.method);
		method.call(obj);
	}
}

JAK.Timekeeper.prototype._schedule = function() {
	var s = this._scheduler;
	s(this._tick, null);
}
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Interpolace, animace
 * @version 2.0
 * @author Zara
 */

/**
 * @class Periodicky interpolator
 * @group jak-utils
 */
JAK.Interpolator = JAK.ClassMaker.makeClass({
	NAME: "JAK.Interpolator",
	VERSION: "2.1",
	DEPEND: [{
		sClass: JAK.Timekeeper,
		ver: "1.0"
	}]
});

/** @constant */ JAK.Interpolator.LINEAR	= 1;
/** @constant */ JAK.Interpolator.QUADRATIC	= 2;
/** @constant */ JAK.Interpolator.SQRT		= 3;
/** @constant */ JAK.Interpolator.SIN		= 4;
/** @constant */ JAK.Interpolator.ASIN		= 5;

/**
 * @param {float} startVal počáteční hodnota
 * @param {float} endVal koncová hodnota
 * @param {int} interval doba trvání v msec
 * @param {function} callback periodicky callback
 * @param {object} [options] opšny
 * @param {int} [options.count=1] počet tiknutí pro Timekeeper
 * @param {int} [options.interpolation=JAK.Interpolator.LINEAR]
 * @param {function} [options.endCallback]
 */
JAK.Interpolator.prototype.$constructor = function(startVal, endVal, interval, callback, options) {
	this.startVal = startVal;
	this.endVal = endVal;
	this.interval = interval;
	this.callback = callback;
	this.options = {
		interpolation: JAK.Interpolator.LINEAR,
		count: 1,
		endCallback: false
	}
	this.running = false;

	for (var p in options) { this.options[p] = options[p]; }
}

/**
 * zavola callback
 * @private
 * @param {float} frac cislo mezi nulou a jednickou
 */
JAK.Interpolator.prototype._call = function(frac) {
	var result = this._interpolate(frac);
	var delta = this.endVal - this.startVal;
	this.callback(this.startVal + delta*result);
}

/**
 * provede interpolaci na zaklade this.options.interpolation
 * @private
 * @param {float} val cislo mezi nulou a jednickou
 */
JAK.Interpolator.prototype._interpolate = function(val) {
	if (typeof(this.options.interpolation) == "function") {
		return this.options.interpolation(val);
	}
	switch (this.options.interpolation) {
		case JAK.Interpolator.QUADRATIC: return val*val;
		case JAK.Interpolator.SQRT: return Math.sqrt(val);
		case JAK.Interpolator.SIN: return (Math.sin(Math.PI * (val-0.5)) + 1) / 2;
		case JAK.Interpolator.ASIN: return (Math.asin(2 * (val-0.5)) + Math.PI/2) / Math.PI;
		default: return val; /* default, linear */
	}
}

/**
 * spusti animaci
 */
JAK.Interpolator.prototype.start = function() {
	if (this.running) { return; }
	this.running = true;
	this.startTime = (new Date()).getTime();
	this._call(0);
	JAK.Timekeeper.getInstance().addListener(this, "_tick", this.options.count);
}

/**
 * zastavi animaci
 */
JAK.Interpolator.prototype.stop = function() {
	if (!this.running) { return; }
	this.running = false;
	JAK.Timekeeper.getInstance().removeListener(this);
}

/**
 * krok interpolace
 * @private
 */
JAK.Interpolator.prototype._tick = function() {
	var now = (new Date()).getTime();
	var elapsed = now - this.startTime;
	if (elapsed >= this.interval) {
		this.stop();
		this._call(1);
		if (this.options.endCallback) { this.options.endCallback(); }
	} else {
		this._call(elapsed / this.interval);
	}
}

/**
 * @class Interpolator CSS vlastnosti
 * @group jak-utils
 */
JAK.CSSInterpolator = JAK.ClassMaker.makeClass({
	NAME: "CSSInterpolator",
	VERSION: "2.0"
});

/**
 * @param {element} elm HTML prvek
 * @param {int} interval doba animace v msec
 * @param {object} [options] opsny pro interpolator
 * @see JAK.Interpolator
 */
JAK.CSSInterpolator.prototype.$constructor = function(elm, interval, options) {
	this.elm = elm;
	this.properties = [];
	this.colors = [];

	this._tick = this._tick.bind(this);
	this.interpolator = new JAK.Interpolator(0, 1, interval, this._tick, options);
}

/**
 * prida novou vlastnost k animovani
 * @param {string} property CSS vlastnost
 * @param {float} startVal pocatecni hodnota
 * @param {float} endVal koncova hodnota
 * @param {string} [suffix=""] volitelna pripona pro CSS hodnotu (typicky 'px')
 */
JAK.CSSInterpolator.prototype.addProperty = function(property, startVal, endVal, suffix) {
	var o = {
		property:property,
		startVal:startVal,
		endVal:endVal,
		suffix:suffix || ""
	}
	this.properties.push(o);
}

/**
 * prida novou barevnou vlastnost k animovani
 * @param {string} property CSS vlastnost
 * @param {string} startVal pocatecni hodnota
 * @param {string} endVal koncova hodnota
 */
JAK.CSSInterpolator.prototype.addColorProperty = function(property, startVal, endVal) {
	var o = {
		startVal:JAK.Parser.color(startVal),
		endVal:JAK.Parser.color(endVal),
		property:property
	};
	this.colors.push(o);
}

/**
 * spusti animaci
 */
JAK.CSSInterpolator.prototype.start = function() {
	this.interpolator.start();
}

/**
 * zastavi animaci
 */
JAK.CSSInterpolator.prototype.stop = function() {
	this.interpolator.stop();
}

/**
 * nastavi spravne hodnoty pro opacity v zavislosti na prohlizeci
 * @private
 */
JAK.CSSInterpolator.prototype._setOpacity = function(obj, prop, frac) {
	var property = "";
	var val = prop.startVal + frac * (prop.endVal - prop.startVal);

	// tady spocitej hodnotu pro ruzne klienty
	if (JAK.Browser.client == "ie" && JAK.Browser.version < 9) {
		property = 'filter';
		val = Math.round(100*val);
		val = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + val + ');';
	} else {
		property = 'opacity';
	}
	obj[property] = val;
}

/**
 * krok animace
 * @private
 */
JAK.CSSInterpolator.prototype._tick = function(frac) {
	for (var i=0;i<this.properties.length;i++) {
		var prop = this.properties[i];

		switch (prop.property) {
			case "opacity" :
				this._setOpacity(this.elm.style, prop, frac);
			break;

			default:
				var val = prop.startVal + frac * (prop.endVal - prop.startVal);
				val += prop.suffix;
				this.elm.style[prop.property] = val;
			break;
		}
	}

	var names = ["r", "g", "b"];
	for (var i=0;i<this.colors.length;i++) {
		var c = this.colors[i];
		var out = [0,0,0];
		for (var j=0;j<names.length;j++) {
			var name = names[j];
			out[j] = c.startVal[name] + Math.round(frac*(c.endVal[name]-c.startVal[name]));
		}
		var result = "rgb(" + out.join(",") + ")";
		this.elm.style[c.property] = result;
	}
}
// JAk eXtended
// Josef Vanžura
var JAX = {
	version: "DEVEL",
	DECORATE_ONDEMAND: false,
	DEBUG: false,
	METHOD_BOTH: 1,
	METHOD_SINGLE: 2,
	_uid: 0
};

JAX.makeClass = function( NAME, EXTEND ){
	var obj = {
		NAME: NAME,
		VERSION: 1.0
	}
	if( !!EXTEND ){
		obj.EXTEND = EXTEND;
	}
	return JAK.ClassMaker.makeClass(obj);
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
	} else {
		return obj;
	}
}

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

JAX.IntervalCheck = function(checkfunc,callback,interval,timeout){
	this.checkfunc = checkfunc;
	this.callback = callback;
	this._interval = interval || 100;
	this._time = 0;
	this._timeout = timeout || -1;
	this.interval = new JAX.Interval(this.check.bind(this),this._interval);
}

JAX.IntervalCheck.prototype.check = function(){
	if(this.checkfunc()){
		this.callback(true);
		this.stop();
	}
	if(this._timeout != -1){
		this._time += this._interval;
		if(this._time >= this._timeout){
			this.callback(false);
			this.stop();
		}
	}
}

JAX.IntervalCheck.prototype.stop = function(){
	this.interval.stop();
}

// toto pole bude plneno metodami jimiz se odekoruje element
JAX.ElementDecorator = {};
JAX.ElementDecorator.__decorated = true;
JAX.ElementDecorator.__locked = 0;
JAX.ElementDecoratorArrays = ["__queue","__animations","__event_def"];

JAX.$ = function(query,context,single){
	var single = !!single;
	var elms = JAX.query(query,context||false);
	if(single){
		JAX.DecorateElement( elms[0] );
		return elms[0];
	} else {
		return new JAX.HTMLCollection(elms);
	}
}

JAX.$$ = function(elm_id){
	var elm = JAK.gel(elm_id);
	if(elm === null) return null;
	JAX.DecorateElement(elm);
	return elm;
}

JAX.DecorateElement = function( elm, recursive ){
	var recursive = !!recursive;
	if(!elm) return false;
	if(elm.__decorated) return false;
	for(var method in JAX.ElementDecorator){
		elm[method] = JAX.ElementDecorator[method];
	}
	for(var i = 0; i < JAX.ElementDecoratorArrays.length; i ++){
		elm[JAX.ElementDecoratorArrays[i]] = [];
	}
	if( recursive ){
		var elms = JAK.DOM.arrayFromCollection(elm.childNodes);
		for(var i = 0; i < elms.length; i ++ ){
			JAX.DecorateElement( elms[i], recursive );
		}
	}
	return true;
};

JAX.HTMLCollection = JAX.makeClass( "JAX.HTMLCollection" );


JAX.HTMLCollection.prototype.$constructor = function(elms){
	var elms = JAK.DOM.arrayFromCollection(elms);
	if( !JAX.DECORATE_ONDEMAND ){
		for( var i = 0; i < elms.length; i ++ ){
			JAX.DecorateElement( elms[i] );
		}
	}

	this._htmlCollection = true;
	this.elements = elms;
	this.debug = "";
	this.length = elms.length;
	if( JAX.DEBUG ){this._genDebug();}
}

JAX.HTMLCollection.prototype._genDebug = function(){
	var elms = this.elements;
	var txt = "";
	var txt_array = [];
	for(var i = 0; i < elms.length; i ++ ){
		txt = "";
		txt += elms[i].tagName;
		if(elms[i].id) txt += "#"+elms[i].id;
		if(elms[i].className) txt += "."+elms[i].className;
		txt_array.push( txt );
	}
	this.debug = txt_array.join(", ");
}

JAX.HTMLCollection.prototype.push = function(){
	for( var i = 0; i < arguments.length; i ++ ){
		this.elements.push(arguments[i]);
	}
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
}

JAX.HTMLCollection.prototype.slice = function( start, end ){
	if(!!end){
		var result = this.elements.slice(start,end);
	} else {
		var result = this.elements.slice(start);
	}
	return new JAX.HTMLCollection(result);
}

JAX.HTMLCollection.prototype.splice = function( start, count ){
	if(!!count){
		var result = this.elements.splice(start,count);
	} else {
		var result = this.elements.splice(start);
	}
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return new JAX.HTMLCollection(result);
}

JAX.HTMLCollection.prototype.pop = function( ){
	var result = this.elements.pop();
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return result;
}

JAX.HTMLCollection.prototype.shift = function( ){
	var result = this.elements.shift();
	this.length = this.elements.length;
	if( JAX.DEBUG ){this._genDebug();}
	return result;
}

JAX.HTMLCollection.prototype.setAttr = function(attr,value){
	for( var i = 0; i < this.elements.length; i ++ ){
		this.elements[i][attr] = value;
	}
}

JAX.HTMLCollection.prototype.process = function(method,args){
	// metoda jez vola danou metodu pro jednotlive elementy v kolekci
	var element = null;
	for(var i = 0; i < this.elements.length; i ++ ){
		element = this.elements[i];
		JAX.DecorateElement( element );
		var meth = element[method];
		meth.apply(element,args);
	}
	return this;
}


JAX.RegisterDecor = function(method,applies_to,func){
	JAX.ElementDecorator[method] = func;
	if(applies_to == JAX.METHOD_BOTH){
		JAX.HTMLCollection.prototype[method] = function(){
			return this.process(method,arguments);
		}
	} else {
		return function(){
			throw new Error("JAX: Metodu '"+method+"' nelze použít nad kolekcí.");
		}
	}
}


// Zpozdeni volani nasledujicich metod o zadany cas (ms)
JAX.RegisterDecor("delay", JAX.METHOD_BOTH, function(time){
	if(this._lockCheck("delay",arguments)) return this;
	this._lock();
	this.__delay = new JAX.Delay(this._unlock.bind(this),time);
	return this;
})

// Animace vybrane vlastnosti
JAX.RegisterDecor("animate", JAX.METHOD_BOTH, function( len, what, start, end, method, endcallback ){
	this._lock();
	var elm = this;
	var _endcallback = function(){
		if(!!endcallback){endcallback(what)};
		elm._animateEnd(what);
	}

	var interpolator = new JAK.CSSInterpolator(elm,len,{
		"interpolation": method||"LINEAR",
		"endCallback": _endcallback
	});

	if( start === null ){
		start = this.getStyle(what);
	}

	if(what.toLowerCase().indexOf("color") != -1){
		interpolator.addColorProperty(what,start,end);
	} else {
		var start = JAX._getCSSSuffix(start);
		var end = JAX._getCSSSuffix(end);
		if( start.suffix=="" && JAX._animatePXUnits.indexOf( what ) != -1 ){
			start.suffix = "px";
		}
		interpolator.addProperty( what, start.value, end.value, start.suffix );
	}
	interpolator.start();
	this.__animations[what] = interpolator;
	return this;
})

// Privatni metoda volana pri ukonceni animace
JAX.RegisterDecor("_animateEnd", JAX.METHOD_SINGLE, function(what){
	if( what in this.__animations ){
		delete this.__animations[what];
	}
	this._unlock();
})

// Zastavi vsechny probihajici animace a odemkne objekt
JAX.RegisterDecor("animateStop", JAX.METHOD_BOTH, function(what){
	if( !!what ){
		if( what in this.__animations ){
			this.__animations[what].stop();
			delete this.__animations[what];
			this._unlock();
		}
	} else {
		for(var key in this.__animations ){
			this.__animations[key].stop();
		};
		this.__animations = {};
		this._unlock();
	}
	return this;
})

// Privatni; zjistuje zda je objekt zamknut
JAX.RegisterDecor("_lockCheck", JAX.METHOD_SINGLE, function(func,args){
	if(this.__locked){
		var a = [];
		for( var i = 0; i < args.length; i ++){a.push( args[i] );};
		this.__queue.push([func,a]);
		return true;
	}
	return false;
})

// Zamkne volani nasledujicich metod (jen u nekterych)
JAX.RegisterDecor("_lock", JAX.METHOD_BOTH, function(){
	this.__locked++;
})

// Odemkne a zavola metody z fronty
JAX.RegisterDecor("_unlock", JAX.METHOD_BOTH, function(){
	if(this.__locked == 0) return false;
	this.__locked--;
	if( this.__locked == 0){
		var a;
		while( this.__queue.length != 0 ){
			a = this.__queue.shift();
			this[a[0]].apply(this,a[1]);
			if( this.__locked ) break;
		}
	}
})

// Zavola zadanou fci kde argumentem je element
JAX.RegisterDecor("callFunction", JAX.METHOD_BOTH, function(func){
	if(this._lockCheck("callFunction",arguments)) return this;
	return func(this);
})

// Prohleda potomky elementu pomoci CSS query
JAX.RegisterDecor("$", JAX.METHOD_BOTH, function(query,single){
	var elm = this;
	return JAX.$(query,elm,single||false);
})

// Vlozi noveho potomka dle zadanych parametru (argumenty jako u JAX.make)
JAX.RegisterDecor("addElement", JAX.METHOD_BOTH, function(def,attrs){
	if(this._lockCheck("addElement",arguments)) return this;
	var elm = JAX.make(def,attrs||{});
	this.appendChild(elm);
	return this;
})

// Prejde na nasledujici prvek dle zadane query
JAX.RegisterDecor("nextNode", JAX.METHOD_SINGLE, function(query){
	return JAX.$$( JAX._nodeWalk( this, query, 1 ) );
})

// Prejde na predchozi prvek dle zadane query
JAX.RegisterDecor("prevNode", JAX.METHOD_SINGLE, function(query){
	return JAX.$$( JAX._nodeWalk( this, query, -1 ) );
})

// Prida elementu zadanou tridu/tridy
JAX.RegisterDecor("addClass", JAX.METHOD_BOTH, function(){
	if(this._lockCheck("addClass",arguments)) return this;
	if( arguments.length == 1 ){
		if( !this.hasClass(arguments[0]) ){
			/* abychom nedelali mezerovy bordel v className */
			this.className += (( this.className == "" )?"":" ")+arguments[0];
		}
	} else {
		var cls = [];
		for( var i = 0; i < arguments.length; i ++ ){
			if( !this.hasClass(arguments[i]) ){
				cls.push( arguments[i] );
			}
		}
		cls = cls.join(" ");
		this.className = (( this.className == "" )?"":" ")+cls;
	}
	return this;
})

// Odebere elementu zadanou tridu/tridy
JAX.RegisterDecor("removeClass", JAX.METHOD_BOTH, function(){
	if(this._lockCheck("removeClass",arguments)) return this;
	if( arguments.length == 1 ){
		JAK.DOM.removeClass(this,arguments[0]);
	} else {
		var names = this.className.split(" ");
		var newClassArr = [];
		for (var i=0;i<names.length;i++) {
			if ( arguments.indexOf(names[i].toLowerCase()) == -1 ) {
				newClassArr.push(names[i]);
			}
		}
		this.className = newClassArr.join(" ");
	}
	return this;
})

// Zjistuje zda ma dany element tridu
JAX.RegisterDecor("hasClass", JAX.METHOD_SINGLE, function( cls ){
	return ( (" "+this.className.toLowerCase()+" ").indexOf( " "+cls.toLowerCase()+" " ) != -1 );
})

// Navesi na element posluchace udalosti
JAX.RegisterDecor("event", JAX.METHOD_BOTH, function(type,method,obj){
	if(this._lockCheck("event",arguments)) return this;
	if( obj && typeof(method) == "string" ){method = obj[method].bind(obj);};
	if( method && typeof(obj) == "string" ){method = method[obj].bind(method);};
	if(typeof(this.__event_def[type]) == "undefined"){this.__event_def[type] = [];};

	var args = [];
	for( var i = 3; i < arguments.length; i ++ ){
		args.push(arguments[i]);
	}

	this.__event_def[type].push([ method, args ]);

	var listener = JAK.Events.addListener(this,type,this,"_eventCallback");
	this.storeValue("elm.event_"+type,listener);
	return listener;
})

// Privatni metoda
JAX.RegisterDecor("_eventCallback", JAX.METHOD_SINGLE, function(e,elm){
	var df = null;
	var baseArguments = null;
	if(typeof(this.__event_def[e.type]) != "undefined"){
		for(var i = 0; i < this.__event_def[e.type].length; i ++){
			df = this.__event_def[e.type][i];
			baseArguments = [e,elm];
			for( var a = 0; a < df[1].length; a ++ ){
				baseArguments.push(df[1][a]);
			}
			df[0].apply(window,baseArguments);
		}
	}
})

// Odstrani zadany typ posluchace
JAX.RegisterDecor("removeEvent", JAX.METHOD_BOTH, function(type){
	if(this._lockCheck("removeEvent",arguments)) return this;
	var evt = this.restoreValue("elm.event_"+type,false);
	if(evt){
		JAK.Events.removeListener(evt);
	}
	return this;
})

// Upravi element dle asoc. pole stejneho formatu jako u JAK.make/JAX.modify
JAX.RegisterDecor("modify", JAX.METHOD_BOTH, function(attrs){
	if(this._lockCheck("modify",arguments)) return this;
	if(typeof(attrs) == "function"){
		attrs(this);
	} else {
		JAX.modify(this,attrs||{});
	}
	return this;
})

// Appenduje zadane element/y; Vice elementu lze vlozit pomoci pole
JAX.RegisterDecor("append", JAX.METHOD_SINGLE, function(elms,anim){
	if(this._lockCheck("append",arguments)) return this;
	var anim = anim || 0;
	if(! ( elms instanceof Array )) var elms = [ elms ];
	for( var i = 0; i < elms.length; i ++ ) {
		this.appendChild(elms[i]);
		if(anim){
			JAX.DecorateElement(elms[i]);
			elms[i].opacity(0);
			elms[i].opacity(1,anim);
		}
	}
	return this;
});

// Odstrani element z jeho rodice
JAX.RegisterDecor("remove", JAX.METHOD_BOTH, function(anim){
	if(this._lockCheck("remove",arguments)) return this;
	var anim = anim||0;
	if(anim){
		this.opacity(0,anim,"SQRT",this._remove.bind(this));
	} else {
		this._remove();
	}
	return this;
});

// Privatni metoda
JAX.RegisterDecor("_remove", JAX.METHOD_BOTH, function(){
	this.parentNode.removeChild(this);
});

// Privatni metoda
JAX.RegisterDecor("storeValue", JAX.METHOD_BOTH, function(uid,value){
	if(this._lockCheck("storeValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	this._store[uid] = value;
	return this;
});

// Privatni metoda
JAX.RegisterDecor("restoreValue", JAX.METHOD_SINGLE, function(uid,default_value){
	if(this._lockCheck("restoreValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	if(typeof(default_value) != "undefined"){
		if(typeof(this._store[uid]) == "undefined"){
			return default_value;
		}
	}
	return this._store[uid];
});

// Prepina stav zobrazeno/skryto
JAX.RegisterDecor("toggle", JAX.METHOD_BOTH, function(time){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("toggle",arguments)) return this;
	if(this.restoreValue("elm.show",true)){
		this.hide(time);
	} else {
		this.show(time);
	};
});

// Zobrazi element
JAX.RegisterDecor("show", JAX.METHOD_BOTH, function(time,target_opacity,inline){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("show",arguments)) return this;
	this.style.display = inline?"inline":"block";
	this.storeValue("elm.show",true);
	if(!!time){
		this.animate(time,"opacity",this.getOpacity(0.0),target_opacity||1.0);
	}
	return this;
});

// Skryje element
JAX.RegisterDecor("hide", JAX.METHOD_BOTH, function(time){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("hide",arguments)) return this;
	this.storeValue("elm.show",false);
	if(!!time){
		this.animate(time,"opacity",this.getOpacity(1.0),0.0,false,this._hide.bind(this));
	} else {
		this._hide();
	}
	return this;
});

// Privatni metoda
JAX.RegisterDecor("_hide", JAX.METHOD_BOTH, function(){
	this.style.display = "none";
});

// Animace pruhlednosti
JAX.RegisterDecor("opacity", JAX.METHOD_BOTH, function(value,time,method,endcallback){
	if(this._lockCheck("opacity",arguments)) return this;
	if(!time){
		this.setOpacity(value);
	} else {
		this.animateStop("opacity");
		this.animate(time,"opacity",null,value,method||false,endcallback||false);
	};
	return this;
});

// Nastavi opacity (se zamkem & pro kolekci)
JAX.RegisterDecor("setOpacity", JAX.METHOD_BOTH, function(value){
	if(this._lockCheck("setOpacity",arguments)) return this;
	this._setOpacity(value)
	return this;
});

// Privatni metoda ( primo nastavuje opacity)
JAX.RegisterDecor("_setOpacity", JAX.METHOD_BOTH, function(value){
	if(JAK.Browser.client == "ie" && JAK.Browser.version < 9){
		this.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity="+parseInt(value*100)+")";
	} else {
		this.style.opacity = value;
	}
});

JAX.RegisterDecor("getStyle", JAX.METHOD_SINGLE, function(what){
	if( what == "opacity" ){
		return this.getOpacity();
	} else {
		return JAK.DOM.getStyle(this,what);
	}
});

// Vraci hodnotu opacity
JAX.RegisterDecor("getOpacity", JAX.METHOD_SINGLE, function(default_value){
	var default_value = (typeof(default_value)=="undefined")?1.0:default_value;
	if(JAK.Browser.client == "ie" && JAK.Browser.version < 9){
		var filter = JAK.DOM.getStyle(this,"filter");
		if(!filter) return default_value;
		var value = filter.replace(new RegExp("(\\\D*)(\\\d\\\d?\\\d?)(.*)","g"),"$2");
		return parseInt(value)/100;
	} else {
		var value = JAK.DOM.getStyle(this,"opacity");
		if(!value) return default_value;
		return value*1.0;
	}
});


JAX.RegisterDecor("getRect", JAX.METHOD_SINGLE, function(meterindom){
	var pos = JAK.DOM.getBoxPosition(this);
	var size = JAX.OffScreenMeter(this, meterindom||false);
	rect = {
		"left": pos.left,
		"top": pos.top,
		"width": size.width,
		"height": size.height
	}
	return rect;
});
// tagName#id.class.class2
JAX.make = function(q,attrs,doc,nodecor){
	var attrs = attrs||false;
	var doc = doc || document;
	var def = JAX._queryparse(q);
	if( def.tag == "" ){
		throw new Error("JAX.make: Tag name is required.");
	}
	var elm = JAX._maker(doc,def.tag,attrs);
	if( !nodecor ){
		elm = JAX.$$(elm);
	}

	if( def.className.length ){
		elm.className = def.className.join(" ");
	}

	if( def.id ){
		elm.id = def.id;
	}

	if( attrs ){
		JAX.modify(elm,attrs);
	}

	return elm;
}

JAX._maker_ieattrs = ["target","enctype","method","type","name","action"];

JAX._maker = function(doc,tagname,attrs){
	var attrs = attrs||{};
	if( JAK.Browser.client == "ie" && JAK.Browser.version <= 8 ){
		var str = "<"+tagname+" ";
		for( var key in attrs ){
			if( JAX._maker_ieattrs.indexOf(key) != -1 ){
				str += key+"=\""+attrs[key]+"\" ";
			}
		}
		str += ">";
		var elm = doc.createElement(str);
	} else {
		var elm = doc.createElement(tagname);
	}
	return elm;
}

JAX.mmake = function(q,number,func,doc,nodecor){
	var _elms = [];
	var elm = null;
	for(var i = 0; i < number; i ++ ){
		elm = JAX.make(q,{},doc||document,nodecor||false);
		func(elm,i);
		_elms.push( elm );
	}
	return _elms;
}

JAX._elmAttrs = ["href","src","disabled","type","for","id","target","name"];
JAX._elmEvents = ["click","dblclick","mousedown","mouseup","mousemove","keydown","keyup","keypress","mouseover","mouseout"];
JAX._ElementAttributes = JAX._elmAttrs;
JAX._ElementEvents = JAX._elmEvents;

JAX._units = function(str){
	var str = str+"";
	if( str.indexOf("px") != -1 || str.indexOf("%") != -1){
		return str;
	}
	return str+"px";
}

JAX.modify = function(elm,attrs){
	if( !attrs ) return elm;
	for(var i in attrs){
		var v = attrs[i];
		if( JAX._elmEvents.indexOf(i) != -1 ){
			JAX.DecorateElement(elm);
			elm.event(i,v);
		}
	}
	for(var i in attrs){
		var v = attrs[i];
		if( JAX._elmAttrs.indexOf(i) != -1 ){
			try{elm.setAttribute(i,v);}catch(e){}
		} else if( JAX._elmEvents.indexOf(i) != -1 ){
			continue;
		} else if( i == "html" ){
			elm.innerHTML = v;
		} else if( i == "title" ){
			elm.setAttribute("title",v);
			elm.setAttribute("alt",v);
		} else if( i == "htmladd" ){
			elm.innerHTML += v;
		} else if( i == "position" ){
			elm.style.position = (v=="abs")?"absolute":( v=="rel"?"relative":v );
		} else if( i == "width" ){
			elm.style.width = JAX._units(v);
		} else if( i == "height" ){
			elm.style.height = JAX._units(v);
		} else if( i == "left" ){
			elm.style.left = JAX._units(v);
		} else if( i == "top" ){
			elm.style.left = JAX._units(v);
		} else if( i == "style" ){
			for( var s in attrs[i] ){ elm.style[s] = v[s]; }
		} else {
			elm[i] = v;
		}
	}
	return elm;
}

JAX._queryparse = function(query){
	var ob = {id:"",tag:"",className:[],pseudoClasses:[]};
	var e = "t";
	var ci = -1;
	var pi = -1;
	for(var n = 0; n < query.length; n ++ ){
		var chr = query.charAt(n);
		if(chr == "#"){ e="i"; continue; };
		if(chr == "."){ e="c"; ci++; ob.className.push(""); continue; };
		if(chr == ":"){ e="p"; pi++; ob.pseudoClasses.push(""); continue; };
		if(e=="c") ob.className[ci] += chr;
		if(e=="t") ob.tag += chr;
		if(e=="i") ob.id += chr;
		if(e=="p") ob.pseudoClasses[pi] += chr
	}
	return ob;
}

JAX._query_checkElm = function(elm,ob,index,count){
	if(elm.nodeType != 1) return false;
	var index = index||0;
	var count = count||1;
	if(ob.className){
		for(var c = 0; c < ob.className.length; c++ ){
			if((" "+elm.className+" ").indexOf(" "+ob.className[c]+" ") == -1) return false;
		}
	}
	if(ob.tag && elm.tagName.toLowerCase() != ob.tag.toLowerCase()) return false;
	if(ob.id != ""){
		if( typeof(elm.id) == "string" ){
			var _id = elm.getAttribute("id");
			if( !_id ) return false;
			if( _id.toLowerCase() != ob.id.toLowerCase() ) return false;
		} else {
			return false;
		}
	}
	if(ob.pseudoClasses){
		var pseudo;
		for(var c = 0; c < ob.pseudoClasses.length; c++ ){
			pseudo = ob.pseudoClasses[c];
			if(pseudo == "first" && index != 0) return false;
			if(pseudo == "even" && index % 2 == 0) return false;
			if(pseudo == "odd" && index % 2 != 0) return false;
			if(pseudo == "last" && index != count-1) return false;
		}
	}
	return true;
}


JAX.query = function(query,context){
	var context = context || document;
	//return context.querySelectorAll(query);

	// mam nekolik queries v jednom stringu
	if( query.indexOf(",") != -1 ){
		query = query.split(",");
		var nodes = [];
		var result = [];
		for( var i = 0; i < query.length; i ++ ){
			result = JAX.query(query[i],context);
			nodes = nodes.concat( result );
		}
		return nodes;
	}
	var working,elms,elm,el,_context,ob,work;

	// rozstrelim query na jednotlive kousky
	query = query.split(" ");
	// mam hotovou query; muzu prochazet uzly
	var elms_length;
	working = [context];
	for( var i = 0; i < query.length; i ++ ){
		// zpracovani jednoho kousku query
		ob = JAX._queryparse(query[i]);
		work = [];
		// projdu vyhovujici prvky
		for( var r = 0; r < working.length; r++ ){
			_context = working[r];
			if(ob.className.length != 0 && _context.getElementsByClassName){
				// pro prohlizece jez to podporuji pouzijeme nativni fci
				elms = _context.getElementsByClassName(ob.className[0]);
			} else {
				// pro ostatni budeme filtrovat vsechny elementy (nebo jen tagy)
				elms = _context.getElementsByTagName(ob.tag||"*");
			}
			elms_length = elms.length;
			for(var e = 0; e < elms_length; e++ ){
				// pokud element vyhovuje pak pokracuje dal
				if(JAX._query_checkElm(elms[e],ob,e,elms_length)){
					work.push( elms[e] );
				}
			}
		}
		working = work;
	}
	return working;
}


JAX.OffScreenMeter = function( elm, meterindom ){
	var meterindom = meterindom||false;
	var result = {width:-1,height:-1};
	var copy = elm.cloneNode(true);
	var wrapper = document.createElement("div");
	wrapper.style.position = "absolute";
	wrapper.style.left = "-2000px";
	wrapper.style.top = "-2000px";
	if( meterindom ){
		elm.parentNode.insertBefore( wrapper, elm );
	} else {
		document.body.insertBefore( wrapper, document.body.firstChild );
	}
	wrapper.appendChild(copy);
	result.width = copy.offsetWidth;
	result.height = copy.offsetHeight;
	wrapper.parentNode.removeChild(wrapper);
	return result;
}


JAX._nodeWalk = function( node, query, dir ){
	var dir = dir || 1;
	var queryObject = JAX._queryparse(query);
	var elms = JAK.DOM.arrayFromCollection(document.getElementsByTagName("*"));
	var index = elms.indexOf(node);
	if(dir == 1){
		for(var i = index+1; i < elms.length; i ++ ){
			if(JAX._query_checkElm(elms[i],queryObject,0)){
				return JAX.$$(elms[i]);
			}
		}
	} else {
		for(var i = index-1; i >= 0; i -- ){
			if(JAX._query_checkElm(elms[i],queryObject,0)){
				return JAX.$$(elms[i]);
			}
		}
	}
	return false;
}
JAX.DOMBuilder = JAX.makeClass( "JAX.DOMBuilder" );

JAX.DOMBuilder.VAR_FORMAT = "\\\{%\\\}";
JAX.DOMBuilder.FIRST_FORMAT = "\\\{:first\\\}";
JAX.DOMBuilder.LAST_FORMAT = "\\\{:last\\\}";
JAX.DOMBuilder.COUNTERN_FORMAT = "\\\{:number\\\}";
JAX.DOMBuilder.COUNTERI_FORMAT = "\\\{:index\\\}";
JAX.DOMBuilder.IF_FORMAT = "\\\{:if %\\\}(.*)\\\{\\\/\\\}";

JAX.DOMBuilder.FIRST_STRING = "first";
JAX.DOMBuilder.LAST_STRING = "last";

JAX.DOMBuilder.prototype.$constructor = function(doc) {
	this.doc = doc || document;
	this.decorating = true;
	this.frag = JAX.$$(document.createDocumentFragment());
	this.pointer = this.frag;
}

JAX.DOMBuilder.prototype.addTemplate = function ( template, data ) {
	var result = JAX.DOMBuilder.makeTemplate( template, data );
	this.addElement( result );
	return result;
}

JAX.DOMBuilder.prototype.addBox = function ( def, attrs ) {
	this.pointer = this.add( def, attrs );
	return this.pointer;
}

JAX.DOMBuilder.prototype.endBox = function ( ) {
	try{
		this.pointer = this.pointer.parentNode;
		return this.pointer;
	} catch(e){
		return null;
	}
}

JAX.DOMBuilder.prototype.addText = function ( txt ) {
	var elm = this.doc.createTextNode(txt);
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.add = function ( def, attrs ) {
	var elm = JAX.make( def, attrs||false, this.doc, !this.decorating );
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.addElement = function ( elm ) {
	this.pointer.appendChild(elm);
	return elm;
}

JAX.DOMBuilder.prototype.addBoxElement = function ( elm ) {
	this.pointer.appendChild(elm);
	this.pointer = elm;
	return elm;
}

JAX.DOMBuilder.prototype.getDom = function ( ) {
	return this.frag;
}

JAX.DOMBuilder.prototype.appendTo = function ( elm ) {
	if( typeof(elm) == "string" ){
		var elm = JAK.gel(elm);
	}
	if( !elm ){
		throw new Error("JAX.DOMBuilder.appendTo: 'elm' not found.");
	}
	elm.appendChild(this.frag);
}

/** Template **/
JAX.DOMBuilder.makeTemplate = function( templ, data ){
	if( typeof(templ) == "object" && templ instanceof HTMLElement ) {
		var templ = templ.innerHTML;
	} else if( typeof(templ) != "string" ) {
		throw new Error("Template should be 'string' or 'HTMLElement' not '"+typeof(templ)+"'.")
	}
	var result = "";
	var last = 0;
	if( typeof(data) == "object" && data instanceof Array ){
		for( var i = 0; i < data.length; i ++ ){
			last = (i==data.length-1)?1:0;
			result += JAX.DOMBuilder._processTemplate( templ, data[i], i, last );
		}
	} else {
		result = JAX.DOMBuilder._processTemplate( templ, data, 0, 1 );
	}
	var tempdiv = document.createElement("div");
	tempdiv.innerHTML = result;
	var nodes = JAK.DOM.arrayFromCollection(tempdiv.childNodes);
	var frag = document.createDocumentFragment();
	for( var i = 0; i < nodes.length; i ++ ){

		frag.appendChild( nodes[i] );
	}
	return frag;
}

JAX.DOMBuilder._processTemplate = function( templ, data, index, last ){
	var result = templ;
	var varformat = JAX.DOMBuilder.VAR_FORMAT;
	var ifformat = JAX.DOMBuilder.IF_FORMAT;
	var _format = null;
	for( var key in data ){
		_format = varformat.replace("%",key);
		result = result.replace( new RegExp( _format, "g" ), data[key] );
		_format = ifformat.replace("%",key);
		if( data[key] ){
			result = result.replace( new RegExp( _format, "g" ), "$1" );
		} else {
			result = result.replace( new RegExp( _format, "g" ), "" );
		}
	}
	var repl;
	result = result.replace( new RegExp( JAX.DOMBuilder.COUNTERN_FORMAT, "g" ), index+1 );
	result = result.replace( new RegExp( JAX.DOMBuilder.COUNTERI_FORMAT, "g" ), index );
	repl = ((index==0)?JAX.DOMBuilder.FIRST_STRING:"");
	result = result.replace( new RegExp( JAX.DOMBuilder.FIRST_FORMAT, "g" ), repl );
	repl = ((last==1)?JAX.DOMBuilder.LAST_STRING:"");
	result = result.replace( new RegExp( JAX.DOMBuilder.LAST_FORMAT, "g" ),repl );
	return result;
}



JAX._getCSSSuffix = function(_value){
	var value = parseFloat(_value);
	var suffix = (_value+"").replace( value, "" );
	return { "value": value, "suffix": suffix };
}

JAX._animatePXUnits = ["height","width","font-size","left","top","right","bottom"];

if( typeof(JAK.Parser) == "undefined" ){
	JAK.Parser = {};
	/**
	 * @param {string} str retezec, jenz mame naparsovat
	 * @returns {object || false} literalovy objekt, pokud lze. V opacnem pripade false
	 */
	JAK.Parser.color = function(str) {
		var obj = {r:0, g:0, b:0};

		if (str.indexOf("#") != -1) { /* hex */
			var regs = str.trim().match(/^#([a-f0-9]+)$/i);
			//console.log(str);
			if (!regs) { return false; }
			var c = regs[1];
			if (c.length == 6) {
				obj.r = parseInt(c.slice(0,2),16);
				obj.g = parseInt(c.slice(2,4),16);
				obj.b = parseInt(c.slice(4,6),16);
				return obj;
			} else if (c.length == 3) {
				obj.r = parseInt(c.charAt(0),16)*17;
				obj.g = parseInt(c.charAt(1),16)*17;
				obj.b = parseInt(c.charAt(2),16)*17;
				return obj;
			} else { return false; }
		} else { /* dec */
			var regs = str.match(/ *\( *([0-9]+) *, *([0-9]+) *, *([0-9]+)/);
			if (!regs) { return false; }
			obj.r = parseInt(regs[1],10);
			obj.g = parseInt(regs[2],10);
			obj.b = parseInt(regs[3],10);
			return obj;
		}
	}
}
JAX.version='1.15.2-20120503.devel-alldeps';
