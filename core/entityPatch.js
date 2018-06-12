ig.module(
	'plugins.crater.core.entityPatch'
)
.requires(
	'impact.entity',

	'plugins.crater.core.event'
)
.defines(function() {

ig.Entity.inject({
	events: {},

	addEvent: function(name) {
		this.events[name] = new ig.Event(this);
	}
});

})