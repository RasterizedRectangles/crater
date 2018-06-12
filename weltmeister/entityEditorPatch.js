ig.module(
	'plugins.crater.weltmeister.entityEditorPatch'
)
.requires(
	'weltmeister.weltmeister'
)
.defines(function() { "use strict";

wm.EditEntities.inject({
	CONNECT_BOX_SIZE: 10,
	CONNECT_BOX_PADDING: 2,

	getMaxBoxes: function(ent) {
		return Math.floor((ent.size.y * ig.system.scale - 10)
			/ (this.CONNECT_BOX_SIZE + this.CONNECT_BOX_PADDING));
	},

	// Generates the x-y coordinates for drawing a box representing a trigger 
	// for a particular entity.
	getTriggerPos: function(ent, index) {
		index = Math.min(index, this.getMaxBoxes(ent) - 1);
		return {x: (ent.pos.x - ig.game.screen.x) * ig.system.scale 
			- this.CONNECT_BOX_SIZE, 
			y: (ent.pos.y + ent.size.y - ig.game.screen.y) * ig.system.scale 
			- (index + 1) * this.CONNECT_BOX_SIZE 
			- this.CONNECT_BOX_PADDING * index};
	},

	// Generates the x-y coordinates for drawing a box representing an event for
	// a particular entity.
	getEventPos: function(ent, index) {
		index = Math.min(index, this.getMaxBoxes(ent) - 1);
		return {x: (ent.pos.x + ent.size.x - ig.game.screen.x) * ig.system.scale, 
			y: (ent.pos.y + ent.size.y - ig.game.screen.y) * ig.system.scale 
			- (index + 1) * this.CONNECT_BOX_SIZE 
			- this.CONNECT_BOX_PADDING * index};
	},

	drawEventTriggerLine: function(source, eventIndex, target, triggerIndex) {
		if(this.getMaxBoxes(source) == 0 || this.getMaxBoxes(target) == 0) 
			return;
		let pos1 = this.getEventPos(source, eventIndex);
		let pos2 = this.getTriggerPos(target, triggerIndex);
		pos1.x += this.CONNECT_BOX_SIZE / 2;
		pos1.y += this.CONNECT_BOX_SIZE / 2;
		pos2.x += this.CONNECT_BOX_SIZE / 2;
		pos2.y += this.CONNECT_BOX_SIZE / 2;
		
		ig.system.context.strokeStyle = '#fff';
		ig.system.context.lineWidth = 1;
		
		ig.system.context.beginPath();
		ig.system.context.moveTo(pos1.x, pos1.y);
		ig.system.context.lineTo(pos2.x, pos2.y);
		ig.system.context.stroke();
		ig.system.context.closePath();
	},

	// Added extra code to draw event / trigger relationships between entities.
	drawEntity: function(ent) {
		this.parent(ent);
		ig.system.context.lineWidth = 1;
		ig.system.context.strokeStyle = 'rgba(255, 255, 255, 1.0)';
		ig.system.context.fillStyle = 'rgba(255, 255, 255, 1.0)';
		ig.system.context.textAlign = 'right';
		// -10 is to make room for the name label at the top of the sprite.
		let max = this.getMaxBoxes(ent);
		if(max == 0) return;
		let toDraw = [];
		let i = 0;
		for(let trigger in ent._wmTriggers)
			if(ent._wmTriggers[trigger].length > 0)
				toDraw.push({name: trigger, pos: this.getTriggerPos(ent, i++)})
		if(toDraw.length > max) toDraw[max - 1].name = '...';
		for(let draw of toDraw.slice(0, max)) {
			let name = draw.name;
			let pos = draw.pos;
			ig.system.context.strokeRect(
				pos.x,
				pos.y,
				this.CONNECT_BOX_SIZE,
				this.CONNECT_BOX_SIZE
				//ent.size.x * ig.system.scale, 
				//ent.size.y * ig.system.scale
			);
			ig.system.context.fillText(name, 
				pos.x - this.CONNECT_BOX_PADDING , 
				pos.y);
		}

		toDraw = [];
		i = 0;
		ig.system.context.textAlign = 'left';
		for(let event in ent._wmEvents)
			if(ent._wmEvents[event].length > 0)
				toDraw.push({name: event, _name: event, index: i,
					pos: this.getEventPos(ent, i++)});
		if(toDraw.length > max) toDraw[max - 1].name = '...';
		for(let draw of toDraw.slice(0, max)) {
			let name = draw.name;
			let pos = draw.pos;
			ig.system.context.strokeRect(
				pos.x,
				pos.y,
				this.CONNECT_BOX_SIZE,
				this.CONNECT_BOX_SIZE
				//ent.size.x * ig.system.scale, 
				//ent.size.y * ig.system.scale
			);
			ig.system.context.fillText(name, 
				pos.x + this.CONNECT_BOX_SIZE + this.CONNECT_BOX_PADDING, 
				pos.y);
		}
		for(let draw of toDraw) {
			let name = draw._name;
			let pos = draw.pos;
			if(ent._wmEvents[name].indexOf(null) !== -1) {
				ig.system.context.fillRect(
					pos.x,
					pos.y,
					this.CONNECT_BOX_SIZE,
					this.CONNECT_BOX_SIZE
					//ent.size.x * ig.system.scale, 
					//ent.size.y * ig.system.scale
				);				
			}
			for(let t of ent._wmEvents[name]) {
				if(t !== null) {
					let j = 0;
					for(let trigger in t.target._wmTriggers)
						if(trigger == t.triggerName)
							break;
						else if(t.target._wmTriggers[trigger].length > 0)
							j++;
					this.drawEventTriggerLine(ent, draw.index, t.target, j);
				}
			}
		}
	},

	// Generates tables for adding event / listener relationships between
	// entities in the editor. These tables are later boiled down to something
	// that is fast to execute during runtime, but is not useful for editing.
	genEventAndTriggerTables: function(ent) {
		if(!ent._wmEvents) {
			ent._wmEvents = {};
			for(let event in ent.events) {
				ent._wmEvents[event] = [];
			}
		}
		if(!ent._wmTriggers) {
			ent._wmTriggers = {}
			for(let func in ent) {
				if(typeof(ent[func]) === "function" && ent[func]._wmTrigger) {
					ent._wmTriggers[func] = [];
				}
			}
		}
	},

	// Links an outgoing event called {eventName} that is sent out from entity 
	// {source} to the trigger named {triggerName} on entity {target}.
	linkEventToTrigger(source, eventName, target, triggerName) {
		source._wmEvents[eventName].push({target: target, 
			triggerName: triggerName});
		target._wmTriggers[triggerName].push({source: source, 
			eventName: eventName});
	},

	// Tests if the link specified already exists.
	eventTriggerLinkExists(source, eventName, target, triggerName) {
		return source._wmEvents[eventName].find(x => x !== null 
			&& x.target === target && x.triggerName === triggerName) 
			!== undefined;
	},

	// Removes a link added by {linkEventToTrigger(...)}
	removeEventTriggerLink(source, eventName, target, triggerName) {
		source._wmEvents[eventName] = source._wmEvents[eventName]
			.filter(x => x.target !== target || x.triggerName !== triggerName);
		target._wmTriggers[triggerName] = target._wmTriggers[triggerName]
			.filter(x => x.source !== source || x.eventName !== eventName);
	},

	// Removes all links going out from the event called {eventName} on the
	// entity {source}. Also removes the corresponding reverse record on the
	// target of the event.
	removeAllTriggers(source, eventName) {
		for(let trigger of source._wmEvents[eventName]) {
			trigger.target._wmTriggers[trigger.triggerName] = 
				trigger.target._wmTriggers[trigger.triggerName]
				.filter(x => x.source !== source || x.eventName !== eventName);
		}
		source._wmEvents[eventName] = [];
	},

	// Removes all links coming in to the trigger called {triggerName} in the
	// entity {source}. Also removes the corresponding forward record on the
	// source of the event.
	removeAllEvents(target, triggerName) {
		for(let event of target._wmTriggers[triggerName]) {
			event.source._wmEvents[event.eventName] = 
				event.source._wmEvents[event.eventName].filter(
					x => x.target !== target || x.triggerName !== triggerName);
		}
		target._wmTriggers[triggerName] = [];
	},

	spawnEntity: function() {
		let retval = this.parent.apply(this, arguments);
		this.genEventAndTriggerTables(retval);
		return retval;
	},

	loadEntitySettings: function(ent) {
		if(!this.selectedEntity) {
			return;
		}
		this.parent(ent);
		ent = this.selectedEntity;
		let frame = $('div#eventList');
		frame.html('');
		for(let event in ent._wmEvents) {
			let name = $('<div class="name">' + event + '</div>');
			name.mouseup(() => {
				this.removeAllTriggers(ent, event);
				this.loadEntitySettings(ent);
				ig.editor.setModified();
				ig.editor.draw();
			});
			frame.append(name);
			let sub = $('<div class="event"></div>');
			for(let bit of ent._wmEvents[event]) {
				let target = $('<div class="target">> ' + bit.target.name + '.' 
				+ bit.triggerName + '</div>');
				target.mouseup(() => {
					this.removeEventTriggerLink(ent, event,	bit.target, 
						bit.triggerName);
					this.loadEntitySettings(ent);
					ig.editor.setModified();
					ig.editor.draw();
				});
				sub.append(target);
			}
			frame.append(sub);
		}
		frame = $('div#triggerList');
		frame.html('');
		for(let trigger in ent._wmTriggers) {
			let name = $('<div class="name">' + trigger + '</div>');
			name.mouseup(() => {
				this.removeAllEvents(ent, trigger);
				this.loadEntitySettings(ent);
				ig.editor.setModified();
				ig.editor.draw();
			});
			frame.append(name);
			let sub = $('<div class="trigger"></div>');
			for(let bit of ent._wmTriggers[trigger]) {
				let source = $('<div class="source">< ' + bit.source.name + '.' 
				+ bit.eventName + '</div>');
				source.mouseup(() => {
					this.removeEventTriggerLink(bit.source, bit.eventName,
						ent, trigger);
					this.loadEntitySettings(ent);
					ig.editor.setModified();
					ig.editor.draw();
				});
				sub.append(source);
			}
			frame.append(sub);
		}
	},

	eventSelected: function(e) {
		this.selectedLink.event = e.target.id;
		this.selectedLink.source._wmEvents[this.selectedLink.event].push(null);
		$('#eventMenu').hide();
		ig.editor.mode = ig.editor.MODE.TARGETPICK;
		ig.editor.draw();
	},

	showEventMenu: function(x, y) {
		if(!this.selectedEntity) {
			ig.editor.mode = ig.editor.MODE.DEFAULT;
			return;
		}
		this.selectedLink = {source: this.selectedEntity, event: null, 
			target: null, trigger: null};
		let ent = this.selectedEntity;
		let menu = $('#eventMenu');
		menu.html('');
		for(let event in ent._wmEvents) {
			menu.append($('<div/>', {
				'id': event,
				'href': '#',
				'html': event,
				'mouseup': this.eventSelected.bind(this)
			}));
		}
		menu.css({top: (y * ig.system.scale + 2), 
			left: (x * ig.system.scale + 2)});
		menu.show();
	},

	triggerSelected: function(e) {
		let sl = this.selectedLink;
		sl.trigger = e.target.id;
		sl.source._wmEvents[this.selectedLink.event].erase(null);
		let args = [sl.source, sl.event, sl.target, sl.trigger];
		if(this.eventTriggerLinkExists(...args))
			this.removeEventTriggerLink(...args);
		else
			this.linkEventToTrigger(...args);
		$('#triggerMenu').hide();
		ig.editor.mode = ig.editor.MODE.DEFAULT;
		ig.editor.draw();
		ig.editor.setModified();
		this.selectEntity(sl.source);
	},

	showTriggerMenu: function(x, y) {
		if(!this.selectedEntity) {
			ig.editor.mode = ig.editor.MODE.DEFAULT;
			this.selectedLink.source
				._wmEvents[this.selectedLink.event].erase(null);
			return;
		}
		ig.editor.draw();
		let ent = this.selectedEntity;
		this.selectedLink.target = ent;
		let menu = $('#triggerMenu');
		menu.html('');
		for(let trigger in ent._wmTriggers) {
			menu.append($('<div/>', {
				'id': trigger,
				'href': '#',
				'html': trigger,
				'mouseup': this.triggerSelected.bind(this)
			}));
		}
		menu.css({top: (y * ig.system.scale + 2), 
			left: (x * ig.system.scale + 2)});
		menu.show();
	},

	// Unfortunately, there is no easy way to extend this without doing a
	// complete rewrite.
	getSaveData: function() {
		let ents = [];
		let i = 0;
		for(let ent of this.entities) {
			ent._wmExportIndex = i;
			let type = ent._wmClassName;
			let data = {
				type: type, 
				x: ent.pos.x, 
				y: ent.pos.y
			};
			
			console.log(Object.keys(ent._wmSettings));
			if(Object.keys(ent._wmSettings).length !== 0) 
				data.settings = ent._wmSettings;
			
			ents.push(data);
			i++;
		}
		for(let ent of this.entities) {
			let eventData = {};
			for(let eventName in ent._wmEvents) {
				if(ent._wmEvents[eventName].length > 0) {
					eventData[eventName] = [];
					for(let bit of ent._wmEvents[eventName]) {
						eventData[eventName].push({
							i: bit.target._wmExportIndex,
							n: bit.triggerName
						});
					}
				}
			}
			if(Object.keys(eventData).length > 0) {
				ents[ent._wmExportIndex].events = eventData;
			}
		}
		return ents;		
	},

	linkEventsOnLoad: function(data) {
		// extract JSON from a module's JS. Copied from weltmeister.js
		var jsonMatch = data.match(/\/\*JSON\[\*\/([\s\S]*?)\/\*\]JSON\*\//);
		data = JSON.parse(jsonMatch ? jsonMatch[1] : data);
		let i = 0;
		for(let entity of data.entities) {
			console.log(entity.events);
			if(entity.events) {
				for(let eventName in entity.events) {
					for(let dat of entity.events[eventName]) {
						this.linkEventToTrigger(
							this.entities[i], // source
							eventName,
							this.entities[dat.i], // destination
							dat.n // trigger name
						);
					}
				}
			}
			i++;
		}
	},

	// Remove all event-based links involving the entity before it is deleted.
	deleteSelectedEntity: function() {
		if(!this.selectEntity) return false;
		console.log(this.selectedEntity);
		let ent = this.selectedEntity;
		for(let triggerName in ent._wmTriggers) {
			console.log(triggerName, ent._wmTriggers[triggerName]);
			this.removeAllEvents(ent, triggerName);
		}
		for(let eventName in ent._wmEvents)
			this.removeAllTriggers(ent, eventName);
		return this.parent();
	},

	// Clones events as well as the entity itself.
	cloneSelectedEntity: function() {
		let ent = this.selectedEntity;
		if(!this.parent()) return false;
		let nent = this.selectedEntity;
		for(let triggerName in ent._wmTriggers) 
			for(let link of ent._wmTriggers[triggerName]) 
				this.linkEventToTrigger(link.source, link.eventName, nent, 
					triggerName);
		for(let eventName in ent._wmEvents) 
			for(let link of ent._wmEvents[eventName]) 
				this.linkEventToTrigger(nent, eventName, link.target, 
					link.triggerName);
		return true;
	}
});

});