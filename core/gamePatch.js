ig.module(
	'plugins.crater.core.gamePatch'
)
.requires(
	'impact.game'
)
.defines(function(){ "use strict";

ig.Game.inject({
	loadLevel: function(data) {
		this.parent(data);
		let i = 0;
		for(let entity of data.entities) {
			if(entity.events) {
				for(let eventName in entity.events) {
					for(let dat of entity.events[eventName]) {
						let target = this.entities[dat.i];
						this.entities[i].events[eventName]
							.subscribe(target[dat.n].bind(target));
					}
				}
			}
			i++;
		}
	}
});

});