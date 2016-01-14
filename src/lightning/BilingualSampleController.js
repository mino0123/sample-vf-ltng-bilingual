{
	scriptsLoaded: function (cmp, evt, helper) {
		var root = document.getElementById(cmp.getGlobalId() + '_content');
		if (BilingualSample) {
			BilingualSample.initLightning(root, cmp);
		}
	}
}