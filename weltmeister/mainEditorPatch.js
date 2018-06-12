ig.module(
	'plugins.crater.weltmeister.mainEditorPatch'
)
.requires(
	'weltmeister.weltmeister'
)
.defines(function() { "use strict";

let globalBoxHTML = `
<div id="globalContainer">
	<h2>Global</h2>
	<div id="globalButtons">
		<div id="gameSettings" class="layer">
			<span class="name">Game Settings</span>
		</div>
		<div id="levelSettings" class="layer">
			<span class="name">Level Settings</span>
		</div>
	</div>
</div>
`

let eventListHTML = `
<h2>Events (Click To Unlink)</h2>
<div id="eventList">
	<div class="event">
		<div class="name">Hello World</div>
		<div class="target">> name.trigger</div>
		<div class="target">> name.trigger</div>
	</div>
	<div class="event">
		<div class="name">Hi World</div>
		<div class="target">> name.trigger</div>
		<div class="target">> name.trigger</div>
	</div>
</div>
<h2>Triggers (Click To Unlink)</h2>
<div id="triggerList">
	<div class="trigger">
		<div class="name">Hello World</div>
		<div class="source">< name.event</div>
		<div class="source">< name.event</div>
	</div>
	<div class="trigger">
		<div class="name">Hi World</div>
		<div class="source">< name.event</div>
		<div class="source">< name.event</div>
	</div>
</div>
`

let menusHTML = `
<div id="eventMenu"></div>
<div id="triggerMenu"></div>
`

wm.Weltmeister.inject({
	init: function() {
		$('head').append($('<link rel="stylesheet" type="text/css" \
			href="lib/plugins/crater/weltmeister/style.css"/>'))
		$(globalBoxHTML).insertBefore($('#layerContainer'));
		$(eventListHTML).insertAfter($('#entityDefinitionInput'));
		$(menusHTML).insertAfter($('#entityMenu'));
		this.MODE.EVENTPICK = 100;
		this.MODE.TARGETPICK = 101;
		this.MODE.TRIGGERPICK = 102;
		let foundEventKey = false;
		for(let a in wm.config.binds)
			if(wm.config.binds[a] == 'event') {
				foundEventKey = true;
				break;
			}
		if(!foundEventKey) wm.config.binds.E = 'event';
		this.parent();
	},

	mousemove: function() {
		if(this.mode >= this.MODE.EVENTPICK 
			&& this.mode <= this.MODE.TRIGGERPICK) {
			// scroll map
			if( ig.input.state('drag') ) {
				this.drag();
			}
		}

		this.parent();
	},

	keyup: function(action) {
		// It may try and set a different mode, since it does not know about 
		// our custom modes. Handle these modes ourselves.
		if(this.mode >= this.MODE.EVENTPICK 
			&& this.mode <= this.MODE.TRIGGERPICK) {
			if(action === 'zoomin') {
				this.zoom(1);
			}
			else if(action === 'zoomout') {
				this.zoom(-1);
			}
			if(action === 'draw' && this.mode == this.MODE.TARGETPICK) {
				let entity = this.entities.selectEntityAt(
					ig.input.mouse.x + this.screen.x,
					ig.input.mouse.y + this.screen.y);
				if(entity) {
					this.entities.showTriggerMenu(ig.input.mouse.x, 
						ig.input.mouse.y);
					this.mode = this.MODE.TARGETPICK;
				}
			}
		} else {
			this.parent(action);

			if(action === 'event' && this.entities.selectedEntity) {
				this.mode = this.MODE.EVENTPICK;
				this.entities.showEventMenu(ig.input.mouse.x, ig.input.mouse.y);
			}
		}
	},

	loadResponse: function(data) {
		this.parent(data);
		this.entities.linkEventsOnLoad(data);
	}
});

});