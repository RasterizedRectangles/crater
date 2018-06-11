ig.module(
	'plugins.crater.core.event'
)
.requires(
	'impact.impact'
)
.defines(function(){ "use strict";

ig.Event = ig.Class.extend({
	subscribers: [],
	source: undefined,

	init: function(source) {
		this.source = source;
	},

	subscribe: function(listener, args) {
		if(args) {
			let argList = [];
			let source = this.source;
			for(let i = 1; i < arguments.length; i++) argList[i-1] = arguments[i];
			this.subscribers.push(() => { listener.apply(null, [this.source].concat(argList)); });
		} else {
			this.subscribers.push(() => { listener.apply(null, [this.source]); });
		}
	},

	trigger: function() {
		for(let subscriber of this.subscribers) subscriber();
	}
});

ig.Trigger = function(func) {
	func._wmTrigger = true;
	return func;
}

});