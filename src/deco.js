
// Zpozdeni volani nasledujicich metod o zadany cas (ms)
JAX.ElementDecorator.prototype.delay = function(time){
	if(this._lockCheck("delay",arguments)) return this;
	this._lock();
	this.__delay = new JAX.Delay(this._unlock.bind(this),time);
	return this;
};

JAX.CollectionMethod("delay");

// Animace vybrane vlastnosti
JAX.ElementDecorator.prototype.animate = function( len, what, start, end, method, endcallback ){
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
};

JAX.CollectionMethod("animate");

// Privatni metoda volana pri ukonceni animace
JAX.ElementDecorator.prototype._animateEnd = function(what){
	if( what in this.__animations ){
		delete this.__animations[what];
	}
	this._unlock();
};

// Zastavi vsechny probihajici animace a odemkne objekt
JAX.ElementDecorator.prototype.animateStop = function(what){
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
};
JAX.CollectionMethod("animateStop");

// Privatni; zjistuje zda je objekt zamknut
JAX.ElementDecorator.prototype._lockCheck = function(func,args){
	if(this.__locked){
		var a = [];
		for( var i = 0; i < args.length; i ++){a.push( args[i] );};
		this.__queue.push([func,a]);
		return true;
	}
	return false;
};

// Zamkne volani nasledujicich metod (jen u nekterych)
JAX.ElementDecorator.prototype._lock = function(){
	this.__locked++;
};
JAX.CollectionMethod("_lock");

// Odemkne a zavola metody z fronty
JAX.ElementDecorator.prototype._unlock = function(){
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
};
JAX.CollectionMethod("_unlock");

// Zavola zadanou fci kde argumentem je element
JAX.ElementDecorator.prototype.callFunction = function(func){
	if(this._lockCheck("callFunction",arguments)) return this;
	return func(this);
};
JAX.CollectionMethod("callFunction");

// Prohleda potomky elementu pomoci CSS query
JAX.ElementDecorator.prototype.$ = function(query,single){
	var elm = this;
	return JAX.$(query,elm,single||false);
};

// Vlozi noveho potomka dle zadanych parametru (argumenty jako u JAX.make)
JAX.ElementDecorator.prototype.addElement = function(def,attrs){
	if(this._lockCheck("addElement",arguments)) return this;
	var elm = JAX.make(def,attrs||{});
	this.appendChild(elm);
	return this;
};
JAX.CollectionMethod("addElement");

// Vlozi element pred stavajici element
JAX.ElementDecorator.prototype.addBefore = function(element){
	if(this._lockCheck("addBefore",arguments)) return this;
	this.parentNode.insertBefore( element, this );
	return this;
};

// Vlozi element za stavajici element
JAX.ElementDecorator.prototype.addAfter = function(element){
	if(this._lockCheck("addAfter",arguments)) return this;
	if( this.nextSibling ){
		this.parentNode.insertBefore( element, this.nextSibling );
	} else {
		this.parentNode.appendChild( element );
	}
	return this;
};

// Prejde na nasledujici prvek dle zadane query
JAX.ElementDecorator.prototype.nextNode = function(query){
	return JAX.$$( JAX._nodeWalk( this, query, 1 ) );
};

// Prejde na predchozi prvek dle zadane query
JAX.ElementDecorator.prototype.prevNode = function(query){
	return JAX.$$( JAX._nodeWalk( this, query, -1 ) );
};

// Prida elementu zadanou tridu/tridy
JAX.ElementDecorator.prototype.addClass = function(){
	if(this._lockCheck("addClass",arguments)) return this;
	if( arguments.length == 1 ){
		var cls = "";
		if( !this.hasClass(arguments[0]) ){
			cls = arguments[0];
		}
	} else {
		var cls = [];
		for( var i = 0; i < arguments.length; i ++ ){
			if( !this.hasClass(arguments[i]) ) cls.push( arguments[i] );
		}
		cls = cls.join(" ");
	}
	this.className += (( this.className == "" )?"":" ")+cls;
	return this;
};
JAX.CollectionMethod("addClass");

// Odebere elementu zadanou tridu/tridy
JAX.ElementDecorator.prototype.removeClass = function(){
	if(this._lockCheck("removeClass",arguments)) return this;
	var names = this.className.split(" ");
	var newClassArr = [];
	for (var i=0;i<names.length;i++) {
		if ( Array.indexOf(arguments,names[i]) == -1 ) {
			newClassArr.push(names[i]);
		}
	}
	this.className = newClassArr.join(" ");
	return this;
};
JAX.CollectionMethod("removeClass");

// Zjistuje zda ma dany element tridu
JAX.ElementDecorator.prototype.hasClass = function( cls ){
	return ( (" "+this.className.toLowerCase()+" ").indexOf( " "+cls.toLowerCase()+" " ) != -1 );
};

// Navesi na element posluchace udalosti
JAX.ElementDecorator.prototype.event = function(){
	JAX._DEPRECATED("element.event","1.19","element.listen");
	return this.listen.apply( this, arguments );
};
JAX.CollectionMethod("event");

JAX.ElementDecorator.prototype.listen = function(type,method,obj){
	if(this._lockCheck("listen",arguments)) return this;
	var method = method||null;
	if( !method ) return false;

	if( obj && typeof(method) == "string" ){method = obj[method].bind(obj);};
	if( method && typeof(obj) == "string" ){method = method[obj].bind(method);};
	if(typeof(this.__event_def[type]) == "undefined"){this.__event_def[type] = [];};

	var args = [];
	for( var i = 3; i < arguments.length; i ++ ){
		args.push(arguments[i]);
	}

	this.__event_def[type].push([ method, args ]);
	if( args.length == 0 ){
		var listener = JAK.Events.addListener( this, type, method );
	} else {
		_tmpfunction = function(e,elm){
			var baseArguments = [e,elm];
			for( var a = 0; a < args.length; a ++ ){
				baseArguments.push(args[a]);
			}
			method.apply( window, baseArguments );
		}
		var listener = JAK.Events.addListener( this, type, _tmpfunction );
	}
	this.storeValue("elm.event_"+type,listener);
	return listener;
};
JAX.CollectionMethod("listen");

// Odstrani zadany typ posluchace
JAX.ElementDecorator.prototype.removeEvent = function(type){
	if(this._lockCheck("removeEvent",arguments)) return this;
	var evt = this.restoreValue("elm.event_"+type,false);
	if(evt){
		JAK.Events.removeListener(evt);
	}
	return this;
};
JAX.CollectionMethod("removeEvent");

// Upravi element dle asoc. pole stejneho formatu jako u JAK.make/JAX.modify
JAX.ElementDecorator.prototype.modify = function(attrs){
	if(this._lockCheck("modify",arguments)) return this;
	if(typeof(attrs) == "function"){
		attrs(this);
	} else {
		JAX.modify(this,attrs||{});
	}
	return this;
};
JAX.CollectionMethod("modify");

// Appenduje zadane element/y; Vice elementu lze vlozit pomoci pole
JAX.ElementDecorator.prototype.append = function(elms,anim){
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
};

// Odstrani element z jeho rodice
JAX.ElementDecorator.prototype.remove = function(anim){
	if(this._lockCheck("remove",arguments)) return this;
	var anim = anim||0;
	if(anim){
		this.opacity(0, anim, "SQRT", this._remove.bind(this));
	} else {
		this._remove();
	}
	return this;
};
JAX.CollectionMethod("remove");

// Odstrani element vsechny jeho potomky
JAX.ElementDecorator.prototype.removeNodes = function(query){
	if(this._lockCheck("removeNodes",arguments)) return this;
	var elms = this.childNodes;
	var qparsed = JAX._queryparse(query);
	for( var i = 0; i < elms.length; i ++ ){
		if(JAX._query_checkElm(elms[i], qparsed, i, elms.length)){
			this.removeChild( elms[i] );
		}
	}
	return this;
};
JAX.CollectionMethod("removeNodes");

// Privatni metoda
JAX.ElementDecorator.prototype._remove = function(){
	this.parentNode.removeChild(this);
};
JAX.CollectionMethod("_remove");

// Privatni metoda
JAX.ElementDecorator.prototype.storeValue = function(uid,value){
	if(this._lockCheck("storeValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	this._store[uid] = value;
	return this;
};
JAX.CollectionMethod("storeValue");

// Privatni metoda
JAX.ElementDecorator.prototype.restoreValue = function(uid,default_value){
	if(this._lockCheck("restoreValue",arguments)) return this;
	if(!this["_store"]){ this._store = {}; }
	if(typeof(default_value) != "undefined"){
		if(typeof(this._store[uid]) == "undefined"){
			return default_value;
		}
	}
	return this._store[uid];
};

// Prepina stav zobrazeno/skryto
JAX.ElementDecorator.prototype.toggle = function(time){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("toggle",arguments)) return this;
	if(this.restoreValue("elm.show",true)){
		this.hide(time);
	} else {
		this.show(time);
	};
};
JAX.CollectionMethod("toggle");

// Zobrazi element
JAX.ElementDecorator.prototype.show = function(time,target_opacity,inline){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("show",arguments)) return this;
	this.style.display = inline?"inline":"block";
	this.storeValue("elm.show",true);
	if(!!time){
		this.animate(time,"opacity",this.getOpacity(0.0),target_opacity||1.0);
	}
	return this;
};
JAX.CollectionMethod("show");

// Skryje element
JAX.ElementDecorator.prototype.hide = function(time){
	if(!!time){this.animateStop("opacity");}
	if(this._lockCheck("hide",arguments)) return this;
	this.storeValue("elm.show",false);
	if(!!time){
		this.animate(time,"opacity",this.getOpacity(1.0),0.0,false,this._hide.bind(this));
	} else {
		this._hide();
	}
	return this;
};
JAX.CollectionMethod("hide");

// Privatni metoda
JAX.ElementDecorator.prototype._hide = function(){
	this.style.display = "none";
};
JAX.CollectionMethod("_hide");

// Animace pruhlednosti
JAX.ElementDecorator.prototype.opacity = function(value,time,method,endcallback){
	if(this._lockCheck("opacity",arguments)) return this;
	if(!time){
		this.setOpacity(value);
	} else {
		this.animateStop("opacity");
		this.animate(time,"opacity",null,value,method||false,endcallback||false);
	};
	return this;
};
JAX.CollectionMethod("opacity");

// Nastavi opacity (se zamkem & pro kolekci)
JAX.ElementDecorator.prototype.setOpacity = function(value){
	if(this._lockCheck("setOpacity",arguments)) return this;
	this._setOpacity(value)
	return this;
};
JAX.CollectionMethod("setOpacity");

// Privatni metoda ( primo nastavuje opacity)
JAX.ElementDecorator.prototype._setOpacity = function(value){
	if( JAK.Browser.client == "ie" && JAK.Browser.version < 9 ){
		this.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity="+parseInt(value*100)+")";
	} else {
		this.style.opacity = value;
	}
};
JAX.CollectionMethod("_setOpacity");

// Vraci hodnotu stylu
JAX.ElementDecorator.prototype.getStyle = function(what){
	if( what == "opacity" ){
		return this.getOpacity();
	} else {
		return JAK.DOM.getStyle(this,what);
	}
};

// Vraci hodnotu opacity
JAX.ElementDecorator.prototype.getOpacity = function(default_value){
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
};

// vraci pozici a rozmer elementu
JAX.ElementDecorator.prototype.getRect = function(meterindom){
	var pos = JAK.DOM.getBoxPosition(this);
	var size = JAX.OffScreenMeter(this, meterindom||false);
	rect = {
		"left": pos.left,
		"top": pos.top,
		"width": size.width,
		"height": size.height
	}
	return rect;
};
