'use strict';

var dispatchCustomEvent = function (name, data) {
	var rootEl = document.body;
	var event = (function(){
		try{
			return new CustomEvent(name, {bubbles:true, cancelable:true, detail:data});
		}catch(e){
			return CustomEvent.initCustomEvent(name, true, true, data);
		}
	}());

	rootEl.dispatchEvent(event);
};

var sendTrackingEvent = function(data) {
	dispatchCustomEvent('oTracking.event', data);
};

module.exports = sendTrackingEvent;
