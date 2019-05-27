ig.module( 
	'plugins.crater.entities.trigger'
)
.requires(
	'impact.entity',
	'impact.timer',
	'impact.font',
)
.defines(function() {

EntityTrigger = ig.Entity.extend({
	collides: ig.Entity.COLLIDES.NONE,
	checkAgainst: ig.Entity.TYPE.BOTH,
	size: {x: 32, y: 32},
	gravityFactor: 0,
	detectName: 'player',
	previous: [],
	current: [],

	_wmScalable: true,
	_wmDrawBox: true,
	_wmBoxColor: 'rgba(63, 63, 255, 0.5)',

	init: function(x, y, s) {
		this.parent(x, y, s);
		this.addEvent('entityEnter');
		this.addEvent('entityExit');
	},

	check: function(other) {
		let match = other.name === this.detectName;
		if(match) {
			this.current.push(other);
		}
	},

	update: function() {
		let added = this.current.filter(x => this.previous.indexOf(x) == -1);
		let removed = this.previous.filter(x => this.current.indexOf(x) == -1);
		if(added.length) this.events.entityEnter.trigger();
		if(removed.length) this.events.entityExit.trigger();
		this.previous = this.current;
		this.current = [];
	}
})

});
