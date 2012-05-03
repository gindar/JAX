/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Statická třída posytující některé praktické metody na úpravy a práci s DOM stromem, např. vytváření a získávání elementů.
 * @version 5.0
 * @author zara, koko, jelc
 */

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @namespace
 * @group jak
 */
JAK.DOM = JAK.ClassMaker.makeStatic({
	NAME: "JAK.DOM",
	VERSION: "5.0"
});

/**
 * Vytvoří DOM node, je možné rovnou zadat CSS třídu a id.
 * Etymologie: cel = cREATE elEMENT
 * @param {string} tagName jméno tagu (lowercase)
 * @param {string} className název CSS tříd(y)
 * @param {string} id id uzlu
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.cel = function(tagName, className, id, doc) {
	var d = doc || document;
	var node = d.createElement(tagName);
	if (className) { node.className = className; }
	if (id) { node.id = id; }
	return node;
}
	
/**
 * Vytvoří DOM node, je možné rovnou zadat vlastnosti a css vlastnosti.
 * Etymologie: mel = mAKE elEMENT
 * @param {string} tagName jméno tagu (lowercase)
 * @param {object} properties asociativní pole vlastností a jejich hodnot
 * @param {object} styles asociativní pole CSS vlastností a jejich hodnot
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.mel = function(tagName, properties, styles, doc) {
	var d = doc || document;
	var node = d.createElement(tagName);
	if (properties) {
		for (var p in properties) { node[p] = properties[p]; }
	}
	if (styles) { JAK.DOM.setStyle(node, styles); }
	return node;
}

/**
 * Alias pro document.createTextNode.
 * Etymologie: ctext = cREATE text
 * @param {string} str řetězec s textem
 * @param {object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.ctext = function(str, doc) {
	var d = doc || document;
	return d.createTextNode(str);
}
	
/**
 * Zjednodušený přístup k metodě DOM document.getElementById.
 * Etymologie: gel = gET elEMENT
 * @param {string || node} id id HTML elementu, který chceme získat nebo element
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node} HTML element s id = id, pokud existuje, NEBO element specifikovaný jako parametr
 */
 JAK.gel = function(id, doc) {
	var d = doc || document;
	if (typeof(id) == "string") {
		return d.getElementById(id);
	} else { return id; }
}

/**
 * Propoji zadané DOM uzly
 * @param {Array} pole1...poleN libovolný počet polí; pro každé pole se vezme jeho první prvek a ostatní 
 *   se mu navěsí jako potomci
 */
JAK.DOM.append = function() { /* takes variable amount of arrays */
	for (var i=0;i<arguments.length;i++) {
		var arr = arguments[i];
		var head = arr[0];
		for (var j=1;j<arr.length;j++) {
			head.appendChild(arr[j]);
		}
	}
}

/**
 * Otestuje, má-li zadany DOM uzel danou CSS třídu
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 * @return {bool} true|false
 */
JAK.DOM.hasClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i].toLowerCase() == className.toLowerCase()) { return true; } 
	}
	return false;
}

/**
 * Přidá DOM uzlu CSS třídu. Pokud ji již má, pak neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
JAK.DOM.addClass = function(element,className) {
	if (JAK.DOM.hasClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS třídu. Pokud ji nemá, neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
JAK.DOM.removeClass = function(element,className) {
	var names = element.className.split(" ");
	var newClassArr = [];
	for (var i=0;i<names.length;i++) {
		if (names[i].toLowerCase() != className.toLowerCase()) { newClassArr.push(names[i]); }
	}
	element.className = newClassArr.join(" ");
}

/**
 * Vymaže (removeChild) všechny potomky daného DOM uzlu
 * @param {Object} element DOM uzel
 */
JAK.DOM.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * vrací velikost dokumentu, lze použít ve standardním i quirk módu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - šířka dokumentu</li><li><em>height</em> - výška dokumentu</li></ul> 
 */    
JAK.DOM.getDocSize = function(){
	var x = 0;
	var y = 0;		
	if (document.compatMode != 'BackCompat') {
		
		if(document.documentElement.clientWidth && JAK.Browser.client != 'opera'){
			x = document.documentElement.clientWidth;
			y = document.documentElement.clientHeight;
		} else if(JAK.Browser.client == 'opera') {
			if(parseFloat(JAK.Browser.version) < 9.5){
				x = document.body.clientWidth;
				y = document.body.clientHeight;
			} else {
				x = document.documentElement.clientWidth;
				y = document.documentElement.clientHeight;
			}
		} 
		
		if ((JAK.Browser.client == 'safari') || (JAK.Browser.client == 'konqueror')){
			y = window.innerHeight; 
		}
	} else {
		x = document.body.clientWidth;
		y = document.body.clientHeight;
	}
	
	return {width:x,height:y};
};

/**
 * vrací polohu "obj" ve stránce nebo uvnitř objektu který předám jako druhý 
 * argument
 * @param {object} obj HTML element, jehož pozici chci zjistit
 * @param {object} [ref] <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
JAK.DOM.getBoxPosition = function(obj, ref){
	var top = 0;
	var left = 0;
	var refBox = ref || obj.ownerDocument.body;
	
	if (obj.getBoundingClientRect && !ref) { /* pro IE a absolutni zjisteni se da pouzit tenhle trik od eltona: */
		var de = document.documentElement;
		var box = obj.getBoundingClientRect();
		var scroll = JAK.DOM.getBoxScroll(obj);
		return {left:box.left+scroll.x-de.clientLeft, top:box.top+scroll.y-de.clientTop};
	}

	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;

		/*pro FF2, safari a chrome, pokud narazime na fixed element, musime se u nej zastavit a pripocitat odscrolovani, ostatni prohlizece to delaji sami*/
		if ((JAK.Browser.client == 'gecko' && JAK.Browser.version < 3) || JAK.Browser.client == 'safari') {
			if (JAK.DOM.getStyle(obj, 'position') == 'fixed') {
				var scroll = JAK.DOM.getScrollPos();
				top += scroll.y;
				left += scroll.x;
				break;
			}
		}

		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/*
	Par noticek k výpočtům odscrollovaní:
	- rodič body je html (documentElement), rodič html je document
	- v strict mode má scroll okna nastavené html
	- v quirks mode má scroll okna nastavené body
	- opera dává vždy do obou dvou
	- safari dává vždy jen do body
*/

/**
 * vrací polohu "obj" v okně nebo uvnitř objektu který předáme jako druhý 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem 
 *	Par noticek k výpočtům odscrollovaní:<ul>
 *	<li>rodič body je html (documentElement), rodič html je document</li>
 *	<li>v strict mode má scroll okna nastavené html</li>
 *	<li>v quirks mode má scroll okna nastavené body</li>
 *	<li>opera dává vždy do obou dvou</li>
 *	<li>safari dává vždy jen do body </li></ul>
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} parent <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalní pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
 JAK.DOM.getPortBoxPosition = function(obj, parent, fixed) {
	var pos = JAK.DOM.getBoxPosition(obj, parent, fixed);
	var scroll = JAK.DOM.getBoxScroll(obj, parent, fixed);
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	return {left:pos.left,top:pos.top};
}

/**
 * vrací dvojici čísel, o kolik je "obj" odscrollovaný vůči oknu nebo vůči zadanému rodičovskému objektu
 * @param {object} obj HTML elmenet, jehož odskrolovaní chci zjistit
 * @param {object} ref <strong>volitelný</strong> HTML element, vůči kterému chci zjistit odskrolování <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální scroll prvku</li><li><em>top</em>(px) - vertikální scroll prvku</li></ul> 
 */
JAK.DOM.getBoxScroll = function(obj, ref, fixed) {
	var x = 0;
	var y = 0;
	var cur = obj.parentNode;
	var limit = ref || obj.ownerDocument.documentElement;
	var fix = false;
	while (1) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (JAK.Browser.client == "opera" && JAK.DOM.getStyle(cur,"display") != "block") { 
			cur = cur.parentNode;
			continue; 
		}
		
		/* a taky stara opera (<9.5) pocita scrollTop jak pro <body>, tak pro <html> - takze <body> preskocime */
		if (JAK.Browser.client == "opera" && JAK.Browser.version < 9.5 && cur == document.body) { 
			cur = cur.parentNode;
			continue; 
		}
		
		if (fixed && JAK.DOM.getStyle(cur, "position") == "fixed") { fix = true; }
		
		if (!fix) {
			x += cur.scrollLeft;
			y += cur.scrollTop;
		}
		
		if (cur == limit) { break; }
		cur = cur.parentNode;
		if (!cur) { break; }
	}
	return {x:x,y:y};
}

/**
 * vrací aktuální odskrolování stránky
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontální odskrolování</li><li><em>y</em>(px) - vertikální odskrolování</li></ul> 
 */
JAK.DOM.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop || document.body.scrollLeft) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * vraci současnou hodnotu nějaké css vlastnosti
 * @param {object} elm HTML elmenet, jehož vlasnost nás zajímá
 * @param {string} property řetězec s názvem vlastnosti ("border","backgroundColor",...)
 */
JAK.DOM.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var cs = elm.ownerDocument.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * nastavuje objektu konkretni styly, ktere jsou zadany v objektu pojmenovanych vlastnosti (nazev_CSS : hodnota)
 * @param {object} elm HTML element, jehož vlastnosti měním
 * @param {object} style objekt nastavovaných vlastností, např.: {color: 'red', backgroundColor: 'white'}
 */
JAK.DOM.setStyle = function(elm, style) {
	for (var name in style) {
		elm.style[name] = style[name];
	}
}

/**
 * Přidá do dokumentu zadaný CSS řetězec
 * @param {string} css Kus CSS deklarací
 * @returns {node} vyrobený prvek
 */
JAK.DOM.writeStyle = function(css) {
	var node = JAK.mel("style", {type:"text/css"});
	if (node.styleSheet) { /* ie */
		node.styleSheet.cssText = css;
	} else { /* non-ie */
		node.appendChild(JAK.ctext(css));
	}
	var head = document.getElementsByTagName("head");
	if (head.length) {
		head = head[0];
	} else {
		head = JAK.cel("head");
		document.documentElement.appendChild(head, document.body);
	}
	head.appendChild(node);
	return node;
}

/**
 * Převede html kolekci, kterou vrací např. document.getElementsByTagName, na pole, které lze
 * lépe procházet a není "živé" (z které se při procházení můžou ztrácet prvky zásahem jiného skriptu)
 * @param {HTMLCollection} col
 * @return {array}   
 */ 
JAK.DOM.arrayFromCollection = function(col) {
	var result = [];
	try {
		result = Array.prototype.slice.call(col);
	} catch(e) {
		for (var i=0;i<col.length;i++) { result.push(col[i]); }
	} finally {
		return result;
	}
}

