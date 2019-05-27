ig.module( 
	'plugins.crater.entities.text'
)
.requires(
	'impact.entity',
	'impact.timer',
	'impact.font',
)
.defines(function() {

EntityText = ig.Entity.extend({
	collides: ig.Entity.COLLIDES.NONE,
	size: {x: 32, y: 32},
	gravityFactor: 0,
	font: new ig.Font('media/04b03.font.png'),
	text: '',
	visible: true,
	typewriterSpeed: 0,
	typewriterTimer: null,

	_wmScalable: true,
	_wmDrawBox: true,
	_wmBoxColor: 'rgba(127, 127, 127, 0.5)',

	init: function(x, y, s) {
		this.parent(x, y, s);
		if(this.typewriterSpeed) {
			this.typewriterTimer = new ig.Timer(0);
		}
	},

	draw: function() {
		this.parent();
		if(this.visible) {
			let width = this.font.widthForString(this.text);
			let x = this.pos.x - this.offset.x - ig.game._rscreen.x 
				+ (this.size.x - width) / 2;
			let y = this.pos.y - this.offset.y - ig.game._rscreen.y
			if(this.typewriterSpeed) {
				this.font.draw(this.text.substr(0, 
					this.typewriterTimer.delta() * this.typewriterSpeed), x, y);
			} else {
				this.font.draw(this.text, x, y);
			}
		}
	},

	show: ig.Trigger(function() {
		if(!this.visible && this.typewriterSpeed) {
			this.typewriterTimer.set(0);
		}
		this.visible = true;
	}),

	hide: ig.Trigger(function() {
		this.visible = false;		
	}),

	toggle: ig.Trigger(function() {
		this.visible = !this.visible;
		if(this.visible && this.typewriterSpeed) {
			this.typewriterTimer.set(0);
		}
	})
})

});
