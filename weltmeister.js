ig.module(
	'plugins.crater.weltmeister'
)
.requires(
	'plugins.crater.main',
	'weltmeister.weltmeister',
	'plugins.crater.weltmeister.mainEditorPatch',
	'plugins.crater.weltmeister.entityEditorPatch'
)
.defines(function() {});