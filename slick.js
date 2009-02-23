/* Slick2 */

var slick = (function(){
	
	// slick function
	
	function slick(context, expression){
		var buff = buffer.reset(), parsed = slick.parse(expression), all = [];
		var buffPushArray = buff['push(array)'], buffPushObject = buff['push(object)'], buffParseBit = buff['util(parse-bit)'];
		
		buff.state.context = context;
		
		for (var i = 0; i < parsed.length; i++){
			
			var currentSelector = parsed[i], items = [context];
			
			for (var j = 0; j < currentSelector.length; j++){
				var currentBit = currentSelector[j], combinator = 'combinator(' + (currentBit.combinator || ' ') + ')';
				var selector = buffParseBit(currentBit);
				var tag = selector[0], id = selector[1], params = selector[2];
				
				buff.state.found = [];
				buff.state.uniques = {};
				buff.state.idx = 0;
				
				if (j == 0){
					buff.push = buffPushArray;
					buff[combinator](context, tag, id, params);
				} else {
					buff.push = buffPushObject;
					for (var m = 0, n = items.length; m < n; m++) buff[combinator](items[m], tag, id, params);
				}
				
				items = buffer.state.found;
			}
			
			all = (i === 0) ? items : all.concat(items);
		}
		
		if (parsed.length > 1){
			var nodes = [], uniques = {}, idx = 0;
			for (var k = 0; k < all.length; k++){
				var node = all[k];
				var uid = buff['util(uid)'](node);
				if (!uniques[uid]){
					nodes[idx++] = node;
					uniques[uid] = true;
				}
			}
			return nodes;
		}
		
		return all;
	};
	
	// public pseudos
	
	var pseudos = {};
	
	slick.addPseudoSelector = function(name, fn){
		pseudos['pseudo(' + name + ')'] = fn;
		return slick;
	};
	
	slick.getPseudoSelector = function(name){
		return pseudos['pseudo(' + name + ')'];
	};
	
	// default getAttribute
	
	slick.getAttribute = function(node, name){
		if (name == 'class') return node.className;
		return node.getAttribute(name);
	};
	
	// default parser
	
	slick.parse = function(object){
		return object;
	};
	
	// matcher
	
	slick.match = function(node, selector, buff){
		if (!selector || selector === node) return true;
		if (!buff) buff = buffer.reset();
		var parsed = buff['util(parse-bit)'](slick.parse(selector)[0][0]);
		return buff['match(selector)'](node, parsed[0], parsed[1], parsed[2]);
	};
	
	var buffer = {
		
		// cache
		
		cache: {nth: {}},
		
		// uid index
		
		uidx: 1,
		
		// resets buffer state
		
		reset: function(){
			this.state = {positions: {}};
			return this;
		},
		
		// combinators
		
		'combinator( )': function allChildren(node, tag, id, selector){			
			if (id && node.getElementById){
				var item = node.getElementById(id);
				if (item) this.push(item, tag, null, selector);
				return;
			}
			var children = node.getElementsByTagName(tag);
			for (var i = 0, l = children.length; i < l; i++) this.push(children[i], null, id, selector);
		},
		
		'combinator(>)': function directChildren(node, tag, id, selector){
			var children = node.getElementsByTagName(tag);
			for (var i = 0, l = children.length; i < l; i++){
				var child = children[i];
				if (child.parentNode === node) this.push(child, null, id, selector);
			}
		},
		
		'combinator(+)': function nextSibling(node, tag, id, selector){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1){
					this.push(node, tag, id, selector);
					break;
				}
			}
		},
		
		'combinator(~)': function nextSiblings(node, tag, id, selector){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1){
					var uid = this['util(uid)'](node);
					if (this.state.uniques[uid]) break;
					if (this['match(selector)'](node, tag, id, selector)){
						this.state.uniques[uid] = true;
						this.state.found.push(node);
					}
				}
			}
		},
		
		// pseudo
		
		'pseudo(checked)': function pseudoChecked(node){
			return node.checked;
		},

		'pseudo(empty)': function pseudoEmpty(node){
			return !(node.innerText || node.textContent || '').length;
		},

		'pseudo(not)': function pseudoNot(node, selector){
			return !slick.match(node, selector, this);
		},

		'pseudo(contains)': function pseudoContains(node, text){
			return ((node.innerText || node.textContent || '').indexOf(text) > -1);
		},

		'pseudo(first-child)': function pseudoFirstChild(node){
			return this['pseudo(index)'](node, 0);
		},

		'pseudo(last-child)': function pseudoLastChild(node){
			while ((node = node.nextSibling)){
				if (node.nodeType === 1) return false;
			}
			return true;
		},

		'pseudo(only-child)': function pseudoOnlyChild(node){
			var prev = node;
			while ((prev = prev.previousSibling)){
				if (prev.nodeType === 1) return false;
			}
			var next = node;
			while ((next = next.nextSibling)){
				if (next.nodeType === 1) return false;
			}
			return true;
		},

		'pseudo(nth-child)': function pseudoNTHChild(node, argument){
			argument = (!argument) ? 'n' : argument;
			var parsed = this.cache.nth[argument] || this['util(parse-nth-argument)'](argument);
			if (parsed.special != 'n') return this['pseudo(' + parsed.special + ')'](node, argument);
			if (parsed.a === 1 && parsed.b === 0) return true;
			var count = 0, uid = this['util(uid)'](node);
			if (!this.state.positions[uid]){
				while ((node = node.previousSibling)){
					if (node.nodeType !== 1) continue;
					count ++;
					var uis = this['util(uid)'](node);
					var position = this.state.positions[uis];
					if (position != null){
						count = position + count;
						break;
					}
				}
				this.state.positions[uid] = count;
			}
			return (this.state.positions[uid] % parsed.a === parsed.b);
		},

		// custom pseudo selectors

		'pseudo(index)': function pseudoIndex(node, index){
			var count = 0;
			while ((node = node.previousSibling)){
				if (node.nodeType === 1 && ++count > index) return false;
			}
			return (count === index);
		},

		'pseudo(even)': function pseudoEven(node, argument){
			return this['pseudo(nth-child)'](node, '2n+1');
		},

		'pseudo(odd)': function pseudoOdd(node, argument){
			return this['pseudo(nth-child)'](node, '2n');
		},
		
		// util
		
		'util(uid)': (window.ActiveXObject) ? function(node){
			return (node.sLickUID || (node.sLickUID = [this.uidx++]))[0];
		} : function(node){
			return node.sLickUID || (node.sLickUID = this.uidx++);
		},
		
		'util(parse-nth-argument)': function(argument){
			var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
			if (!parsed) return false;
			var inta = parseInt(parsed[1], 10);
			var a = (inta || inta === 0) ? inta : 1;
			var special = parsed[2] || false;
			var b = parseInt(parsed[3], 10) || 0;
			if (a != 0){
				b--;
				while (b < 1) b += a;
				while (b >= a) b -= a;
			} else {
				a = b;
				special = 'index';
			}
			switch (special){
				case 'n': parsed = {a: a, b: b, special: 'n'}; break;
				case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
				case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
				case 'first': parsed = {a: 0, special: 'index'}; break;
				case 'last': parsed = {special: 'last-child'}; break;
				case 'only': parsed = {special: 'only-child'}; break;
				default: parsed = {a: (a - 1), special: 'index'};
			}

			return this.cache.nth[argument] = parsed;
		},
		
		'util(parse-bit)': function(bit){
			var selector = {
				classes: bit.classes || [],
				attributes: bit.attributes || [],
				pseudos: bit.pseudos || []
			};
			
			for (var i = 0; i < selector.pseudos.length; i++){
				var pseudo = selector.pseudos[i];
				if (!pseudo.newName){
					pseudo.name = 'pseudo(' + pseudo.name + ')';
					pseudo.newName = true;
				}
			};
			
			return [bit.tag || '*', bit.id, selector];
		},
		
		'util(string-contains)': function(source, string, separator){
			separator = separator || '';
			return (separator + source + separator).indexOf(separator + string + separator) > -1;
		},
		
		// match
		
		'match(tag)': function(node, tag){
			return (tag === '*' || (node.tagName && node.tagName.toLowerCase() === tag));
		},
		
		'match(id)': function(node, id){
			return ((node.id && node.id === id));
		},
		
		'match(class)': function(node, className){
			return (this['util(string-contains)'](node.className, className, ' '));
		},
		
		'match(attribute)': function(node, name, operator, value, regexp){
			var actual = slick.getAttribute(node, name);
			if (!operator) return (actual != null);
			if (actual == null && (!value || operator === '!=')) return false;
			return regexp.test(actual);
		},
		
		'match(pseudo)': function(node, name, argument){
			if (this[name]){
				return this[name](node, argument);
			} else if (pseudos[name]){
				return pseudos[name].call(node, argument);
			} else {
				return false;
			}
		},
		
		'match(selector)': function(node, tag, id, selector){
			if (tag && !this['match(tag)'](node, tag)) return false;
			if (id && !this['match(id)'](node, tag)) return false;

			var i;

			var classes = selector.classes;
			for (i = classes.length; i--; i){
				var className = classes[i];
				if (!node.className || !this['match(class)'](node, className)) return false;
			}

			var attributes = selector.attributes;
			for (i = attributes.length; i--; i){
				var attribute = attributes[i];
				if (!this['match(attribute)'](node, attribute.name, attribute.operator, attribute.value, attribute.regexp)) return false;
			}

			var pseudos = selector.pseudos;
			for (i = pseudos.length; i--; i){
				var pseudo = pseudos[i];
				if (!this['match(pseudo)'](node, pseudo.name, pseudo.argument)) return false;
			}

			return true;
		},
		
		// push
		
		'push(object)': function(node, tag, id, selector){
			var uid = this['util(uid)'](node);
			if (!this.state.uniques[uid] && this['match(selector)'](node, tag, id, selector)){
				this.state.uniques[uid] = true;
				this.state.found[this.state.idx++] = node;
			}
		},
		
		'push(array)': function(node, tag, id, selector){
			if (this['match(selector)'](node, tag, id, selector)) this.state.found[this.state.idx++] = node;
		}

	};
	
	return slick;

})();

slick.parse = SubtleSlickParse;

// implementation

document.search = function(expression){
	return slick(document, expression);
};

document.find = function(expression){
	return (slick(document, expression)[0] || null);
};

