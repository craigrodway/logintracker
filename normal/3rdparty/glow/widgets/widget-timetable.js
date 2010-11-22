/*	
	Copyright 2009 British Broadcasting Corporation

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

	   http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/
/*@cc_on @*/
/*@if (@_jscript_version > 5.5)@*/
/**
 * @name glow.widgets
 * @namespace
 * @description Widget core module.
 * 		The glow.widgets module contains generic functionality used by our
 * 		widgets, but currently no public API.
 */
(window.gloader || glow).module({
	name: "glow.widgets",
	library: ["glow", "1.7.3"],
	depends: [["glow", "1.7.3", 'glow.dom', 'glow.events']],
	builder: function(glow) {
		var doc,
			docBody,
			env = glow.env;

		glow.ready(function() {
			doc = document;
			docBody = doc.body;

			//check if css or images are disabled, add class name "glow-basic" to body if they aren't
			var testDiv = glow.dom.create('<div class="glow173-cssTest" style="height:0;position:absolute;visibility:hidden;top:-20px;display:block"></div>').appendTo(docBody);

			// not testing for height as that break in some browsers' 'zoom' implementations
			if (testDiv.css("visibility") != 'hidden') {
				//css disabled
				docBody.className += " glow173-basic";
			} else {
				// block any further ready calls until our widgets CSS has loaded
				glow._addReadyBlock("glow_widgetsCSS");

				(function() {
					if (testDiv.css("z-index") != "1234") {
						//css hasn't loaded yet
						setTimeout( arguments.callee, 10 );
						return;
					}
					// BRING ON THE WALLLLL!
					glow._removeReadyBlock("glow_widgetsCSS");

					if (testDiv.css("background-image").indexOf("ctr.png") == -1) {
						docBody.className += " glow173-basic";
					}
				})();
			}

			//add some IE class names to the body to help widget styling
			env.ie && (docBody.className += " glow173-ie");
			//note: we apply the class "glow-ielt7" for IE7 if it's in quirks mode
			(env.ie < 7 || !env.standardsMode) && (docBody.className += " glow173-ielt7");
			//some rounding issues in firefox when using opacity, so need to have a workaround
			env.gecko && (docBody.className += " glow173-gecko");
		});


		glow.widgets = {
			/*
			PrivateMethod: _scrollPos
				Get the scroll position of the document. Candidate for moving into glow.dom?
			*/
			_scrollPos: function() {
				var win = window,
					docElm = env.standardsMode ? doc.documentElement : docBody;

				return {
					x: docElm.scrollLeft || win.pageXOffset || 0,
					y: docElm.scrollTop || win.pageYOffset || 0
				};
			}
		};
	}
});


(window.gloader || glow).module({
	// add the name of your new module
	name: "glow.widgets.Slider",
	library: ["glow", "1.7.3"],
	depends: [[
		"glow", "1.7.3",
		// add the names of modules this modules depends on here, eg:
		"glow.dom",
		"glow.events",
		"glow.dragdrop",
		"glow.anim",
		"glow.widgets"
	]],
	builder: function(glow) {

		// private vars
		var $ = glow.dom.get,
			events = glow.events,
			env = glow.env,
			// private reference to Ruler class
			Ruler,
			// private reference to the slider class
			Slider,
			// array of event names, used to apply event handlers passed in through opts
			eventNames = ["slideStart", "slideStop", "change"],
			// this holds the name of the last key to be pressed.
			// Keep this, because we only want to react to the keyup for the very last keydown
			// Also, if this is null we know there aren't any keys currently pressed
			lastKeyDown = null,
			//interval id for repeating nudges on buttons
			nudgeButtonRepeater,
			//interval id for repeating keyboard nav
			keyRepeater,
			//the os sliced to 3 chars
			os = navigator.platform.slice(0, 3),
			// this will store terms used which differ if the slider is horizontal or vertical
			vocabs = [
				{
					containerClassNamePart: "slider",
					length: "width",
					lengthUpper: "Width", 
					pos: "left",
					trackToChange: "_trackOnElm",
					axis: "x",
					pagePos: "pageX"
				},
				{
					containerClassNamePart: "vSlider",
					length: "height",
					lengthUpper: "Height", 
					pos: "top",
					trackToChange: "_trackOffElm",
					axis: "y",
					pagePos: "pageY"
				}
			],
			/*
			 HTML for the slider 
			 This still needs to be wrapped in <div class="glow173-slider"> or
			 <div class="glow173-vSlider"> before it's created
			*/
			SLIDER_TEMPLATE = '' +
				'<div class="slider-theme">'+
					'<div class="slider-state">'+
						'<div class="slider-container">'+
							'<div class="slider-btn-bk"></div>'+
							'<div class="slider-track">'+
								'<div class="slider-trackOn"></div>'+
								'<div class="slider-trackOff"></div>'+
								'<div class="slider-handle"></div>'+
							'</div>'+
							'<div class="slider-labels"></div>'+
							'<div class="slider-btn-fwd"></div>'+
						'</div>'+
					'</div>'+
				'</div>';


		/*
			Returns the lowest common divisor for all the arguments. Ignores any
			zero params.
		*/
		function greatestCommonDivisor(/* numbers */) {
			var i = 0,
				len = arguments.length,
				r,
				b;

			// get first non-zero param
			while ( !(r = arguments[i++]) && (i < len) );

			for (; i < len; i++) {
				b = arguments[i];
				// ignore zeros
				if (!b) { continue; }

				while (1) {
					r = r % b;
					if (!r) {
						r = b;
						break;
					}
					b = b % r;
					if (!b) {
						break;
					}
				}
			}
			return r;
		}

		// closure for Ruler
		(function() {
			var vocabs = [
				{
					containerClassNamePart: "ruler",
					length: "width",
					pos: "left"
				},
				{
					containerClassNamePart: "vRuler",
					length: "height",
					pos: "top"
				}
			];



			/*
			  container - where to insert the ruler
			  opts.min - start val
			  opts.max - end val
			  opts.tickMajor - interval for major ticks
			  opts.tickMinor - interval for minor ticks
			  opts.labels - as with slider
			  opts.labelMapper - function which takes a label string and returns a new string. For adding stuff like % to the end
			  opts.vertical - vertical ruler
			  opts.reverse - makes the right / bottom of the ruler the start
			  opts.id - id on element
			  opts.className - additional class names for element
			*/
			Ruler = function(container, opts) {
				container = $(container);

				// assign default options
				opts = glow.lang.apply({
					size: 300,
					min: 0,
					max: 100
				}, opts);

				var vocab = vocabs[!!opts.vertical * 1],
					// major tick template, this should be cloned before use
					tickMajorElm = glow.dom.create('<div class="ruler-tickMajor"></div>'),
					// minor tick template, this should be cloned before use
					tickMinorElm = glow.dom.create('<div class="ruler-tickMinor"></div>'),
					// label template, this should be cloned before use
					labelElm = glow.dom.create('<div class="ruler-label"><span></span></div>'),
					// labels converted into a number. This will be NaN for objects
					labelInterval = Number(opts.labels),
					// this is the largest incement we can use to loop
					divisor = greatestCommonDivisor(opts.tickMajor, opts.tickMinor, labelInterval),
					// percent position
					percentPos,
					// tmp holder for an element
					tmpElm,
					// a couple of shortcuts
					reverse = opts.reverse,
					// difference between max & min
					size = opts.max - opts.min,
					// container element
					element,
					// labels container
					labelsElm,
					// a tmp clone of the label elm
					labelElmClone,
					// looping vars
					labelPos,
					i = opts.min;

				// create element
				this.element = element = glow.dom.create('<div role="presentation" class="glow173-' + vocab.containerClassNamePart + '"><div class="ruler-spacer"></div><div class="ruler-labels"></div></div>');
				labelsElm = element.get('div.ruler-labels');

				// add custom ID / Class names
				element[0].id = opts.id || "";
				element[0].className += " " + (opts.className || "");

				for (; i <= opts.max; i += divisor) {
					// work out which pixel position we're dealing with
					percentPos = ((i - opts.min) / size) * 100;
					percentPos = reverse ? 100 - percentPos : percentPos;

					// vocab.pos is top or left

					if ( opts.tickMajor && !((i - opts.min) % opts.tickMajor) ) {
						// place a major tick
						tickMajorElm.clone().css(vocab.pos, percentPos + "%").appendTo(element);
					} else if ( opts.tickMinor && !((i - opts.min) % opts.tickMinor) ) {
						// place a minor tick
						tickMinorElm.clone().css(vocab.pos, percentPos + "%").appendTo(element);
					}

					if (labelInterval && !((i - opts.min) % labelInterval)) {
						// place a label
						labelElmClone = labelElm.clone().css(vocab.pos, percentPos + "%");
						// set the value as a property of the element
						labelElmClone[0]._labelVal = i;
						// set the html of the inner span. We pass the label through labelMapper if it exists
						labelElmClone.get('span').html( opts.labelMapper ? opts.labelMapper(i) : i );
						// add to labels
						labelsElm.append(labelElmClone);
					}
				}

				// right, our labels are set per position
				if (!labelInterval) {
					for (labelPos in opts.labels) {
						// work out which pixel position we're dealing with
						percentPos = ((Number(labelPos) - opts.min) / size) * 100;
						percentPos = reverse ? 100 - percentPos : percentPos;

						if (percentPos <= 100) {
							// place a label
							labelElmClone = labelElm.clone().css(vocab.pos, percentPos + "%");
							// set the value as a property of the element
							labelElmClone[0]._labelVal = Number(labelPos);
							// set the html of the inner span. We pass the label through labelMapper if it exists
							labelElmClone.get('span').html( opts.labelMapper ? opts.labelMapper(opts.labels[labelPos]) : opts.labels[labelPos] );
							// add to labels
							labelsElm.append(labelElmClone);
						}						
					}
				}

				// place it in the document
				container.append(element);
			};

		})();

		/*
		  This returns either the horizontal or vertical vocab.
		  A lot of lines are the same for a horizonal & vertical sliders
		  aside from a couple of keywords. The vocabs cater for these
		  keywords.
		*/
		function getVocab(slider) {
			return vocabs[!!slider._opts.vertical * 1];
		}

		/*
		  This adjusts size the active / inactive part of the slider, according to the handle position
		*/
		function adjustTracks(slider) {
			var vocab = getVocab(slider);
			// size the active / inactive part of the slider
			// trackToChange is _trackOnElm or _trackOffElm, length is width or height
			slider[vocab.trackToChange][0].style[vocab.length] = parseInt(slider._handleElm[0].style[vocab.pos]) + (slider._handleSize / 2) + "px";
		}

		/*
		  This is called as the mouse moves when the slider is being dragged
		*/
		function handleMouseMove() {
			adjustTracks(this);
			if (this._opts.changeOnDrag) {
				var newVal = valueForHandlePos(this);
				change(this, newVal);
				(this._boundInput[0] || {}).value = newVal;
			}
		}

		/*
		  This is called when the user interacts with the slider using keyboard (keydown)
		*/
		function handleKeyNav(event) {

			var vocab = getVocab(this),
				that = this,
				nudgeAmount;

			if (lastKeyDown == "prevented") {
				// this is a repeat of a prevented slideStart, just exit
				return false;
			} else if (lastKeyDown != event.key) {
				// this isn't a repeating keydown event, it's a new slide

				// if lastKeyDown isn't null, key-sliding has changed direction but not actually restarting
				if (!lastKeyDown && slideStart(this).defaultPrevented()) {
					lastKeyDown = "prevented"; //this allows us to pick up repeats
					return false;
				}

				nudgeAmount = (event.key == 'UP' || event.key == 'RIGHT') ? 1 : -1;

				// set up repeating
				// cancel any existing repeating
				clearInterval(keyRepeater);

				keyRepeater = setTimeout(function() {
					keyRepeater = setInterval(function() {
						nudge(that, nudgeAmount);
					}, 40);
				}, 500);

				// do the initial nudge
				nudge(that, nudgeAmount);

				// we use this to know which keyup to react to
				lastKeyDown = event.key;
			}
			return false;
		}
		/*
		  This is called when the user stops interacting with keyboard (keyup)
		*/
		function handleKeyNavEnd(event) {
			if (lastKeyDown == event.key) {
				// if lastKeyDown != event.key, sliding hasn't actually finished
				lastKeyDown = null;
				// cancel any existing repeating
				clearInterval(keyRepeater);
				// stop sliding
				slideStop(this);
			}
		}

		/*
			Called when the back / fwd button is pressed down
		*/
		function handleButtonDown(event) {
			if ( !this._disabled && !slideStart(this).defaultPrevented() ) {
				//work out which button was pressed
				var nudgeAmount = event.attachedTo.className.indexOf("-fwd") != -1 ? 1 : -1,
					that = this;

				//nudge slider
				nudge(this, nudgeAmount);

				//set the action to repeat
				nudgeButtonRepeater = setTimeout(function() {
					nudgeButtonRepeater = setInterval(function() {
						nudge(that, nudgeAmount);
					}, 40);
				}, 500);
			}
			return false;
		}

		/*
			Called when the back / fwd button is released (or mouse out)
		*/
		function handleButtonUp(event) {
			if (nudgeButtonRepeater) {
				clearTimeout(nudgeButtonRepeater);
				clearInterval(nudgeButtonRepeater);
				nudgeButtonRepeater = null;
				slideStop(this);
			}
			return false;
		}

		/*
			Move the slider by a step. Used by the nudge buttons and keyboard events.
			stepsToNudge = number of steps to nudge
		*/
		function nudge(slider, stepsToNudge) {
			// if the step is zero, we step by a pixel
			var changeBy = (slider._opts.step || (1 / slider._pixelsPerVal)) * stepsToNudge;
			// update the view
			slider._nudgeVal = sanitiseVal(slider, slider._nudgeVal + changeBy);
			updateSliderUi(slider, slider._nudgeVal);
			if (slider._opts.changeOnDrag) {
				change(slider, slider._nudgeVal);
				(slider._boundInput[0] || {}).value = slider._val;
			}
		}

		/*
			Update the slider UI for 'val', or the current value. Expects val to
			be already sanitised.
		*/
		function updateSliderUi(slider, val) {
			var valueAsPixels,
				vocab = getVocab(slider);

			val = val === undefined ? slider._val : val;

			//calculate the top / left position of the slider handle
			valueAsPixels = slider._opts.vertical ?
				// TODO copy the horizontal calculation and do the flipping afterwards
				(slider._opts.max - val) * slider._pixelsPerVal : //vertical calculation
				(val - slider._opts.min) * slider._pixelsPerVal; //horizontal calculation

			// move the handle
			// vocab.pos = left or top
			slider._handleElm[0].style[vocab.pos] = valueAsPixels + "px";

			// change track sizes
			adjustTracks(slider);
		}

		/*
		  Generate value based on handle position.
		  This will calculate the value and round it to the
		  nearest valid value
		*/
		function valueForHandlePos(slider) {
			var vocab = getVocab(slider),
				//get the left or top value of the handle
				handlePos = parseInt(slider._handleElm[0].style[vocab.pos]),
				//calculate value
				newVal = slider._opts.vertical ?
					(slider._trackSize - slider._handleSize) - handlePos :
					handlePos;

			//we've got the value from the start position in pixels, now we need the
			//value in terms of the slider
			newVal = (newVal / slider._pixelsPerVal) + slider._opts.min;

			//round to nearest step
			return sanitiseVal(slider, newVal);
		}

		/*
		  Takes a value and rounds it to the nearest value in step / slider range.

		  NaN values will be treated as 0
		*/
		function sanitiseVal(slider, val) {
			var step = slider._opts.step,
				min = slider._opts.min,
				max = slider._opts.max;

			val = Number(val) || 0;

			//obey boundaries
			if (val < min) {
				return min;
			}
			if (val > max) {
				// a little more maths this time, we need to work out the maximum value we can step to
				return max - ((max - min) % (step || 1));
			}

			// we don't need to calculate anything if step is zero
			if (step === 0) { return val; }
			// else round to step
			return Math.round( (val - min) / step ) * step + min;
		}

		/*
		  Update the bound form field & fires an onchange if necessary.
		  If newVal is undefined it will be looked up (but passing in the value is faster)
		*/
		function change(slider, newVal) {
			var currentVal = slider._val;
			//calculate value if needed
			newVal = (newVal === undefined) ? valueForHandlePos(slider) : newVal;

			//update value
			slider.element.attr("aria-valuenow", newVal);
			slider._val = newVal;

			//fire onchange if we have to
			if (newVal != currentVal) {
				events.fire(slider, "change");
			}		
		}

		/*
		  This is called when sliding starts. Fires the start event and returns an event object
		*/
		function slideStart(slider) {
			//capture current value in case we need to reset it
			slider._valBeforeSlide = slider._nudgeVal = slider._val;
			return events.fire(slider, "slideStart");
		}

		/*
		  This is called when sliding stops. Fires event and resets value if default cancelled
		*/
		function slideStop(slider) {
			var eventData = {
				// current value
				initialVal: slider._valBeforeSlide,
				//get new value
				currentVal: valueForHandlePos(slider)
			};

			if ( events.fire(slider, "slideStop", eventData).defaultPrevented() ) {
				change(slider, slider._valBeforeSlide);
				slider.val(slider._valBeforeSlide);
				return;
			}
			change(slider, eventData.currentVal);
			//if snaping ondrop is on, update handle position with val()
			if (slider._opts.snapOnDrop) {
				slider.val(eventData.currentVal);
			} else {
				(slider._boundInput[0] || {}).value = eventData.currentVal;
			}
		}

		/*
		  Works out how many pixels a value is, adjust the size so ticks land
		  on pixels
		*/
		function initUi(slider, ruler) {
			var opts = slider._opts,
				//get hold of the vocab we need to use
				vocab = getVocab(slider),
				//will hold a nodelist of the slider
				element = slider.element,
				//the height of the slider when the track is 0px. Basically any padding, margins and borders
				verticalPaddingHeight,
				//adjusted size after catering for fitting ticks and steps onto pixels
				adjustedSize,
				//value the slider should start on
				startVal,
				//we listen to the mouse moving while the handle is dragging
				mouseMoveListener,
				//glow.dragDrop.Draggable instance for handle
				handleDraggable,
				//draggable options
				draggableOpts,
				//get the smallest non-zero value for step (if we're snapping while dragging), labelMinor, labelMajor
				smallestStepingVal = greatestCommonDivisor( (opts.step * opts.snapOnDrag), opts.tickMinor, opts.tickMajor ),
				oldLengthStyle;


			if (opts.vertical) {
				verticalPaddingHeight = element.height();
				//apply height, we need to come up with a total of opts.size
				slider._trackOnElm.height(opts.size - verticalPaddingHeight);
			} else {
				//apply width
				element.width(opts.size);
			}

			//vocab.length holds 'width' or 'height'
			slider._trackSize = slider._trackElm[vocab.length]();
			// get the handle size
			// right, this gets complicated in IE if the handle element has a percentage legnth, the offset values come in too late
			oldLengthStyle = slider._handleElm[0].style[vocab.length];
			if (glow.env.ie < 8) {
				slider._handleElm[0].style[vocab.length] = slider._handleElm[0].currentStyle[vocab.length];
				slider._handleElm[0].style[vocab.length] = slider._handleElm[0].style["pixel" + vocab.lengthUpper];
			}
			slider._handleSize = slider._handleElm[0]["offset" + vocab.lengthUpper];
			slider._handleElm[0].style[vocab.length] = oldLengthStyle;



			//apply the start value
			if (opts.val != undefined) { //first use the option
				startVal = opts.val;
			} else if (slider._boundInput[0] && slider._boundInput[0].value != "") { //then the form field
				startVal = slider._boundInput[0].value;
			} else { //default to min val
				startVal = opts.min;
			}

			/*if (slider._handleElm.css("position") != "absolute") {
				// uh oh, our CSS hasn't loaded yet
				// put in a tmp value for _pixelsPerVal, to prevent errors
				slider._pixelsPerVal = 1;
				slider._val = startVal;
				slider._trackOnElm[0].style.height = "";
				// rerun this function later
				setTimeout(function() {
					initUi(slider, ruler);
				}, 0);
				return;
			}*/

			//adjust size so labels / ticks sit on pixels if we have to
			if (smallestStepingVal) {
				adjustedSize =
					// get the value of a pixel
					((slider._trackSize - slider._handleSize) / (opts.max - opts.min))
					// multiple by the smallest non-zero stepping value
					* smallestStepingVal;

				adjustedSize =
					(
						//floor the pixel step (we don't want fractions)
						//get the new value of a pixel and work out the draggable pixel range
						(Math.floor(adjustedSize) / smallestStepingVal) * (opts.max - opts.min)
					//add on the handle size to get the new size of the inner track
					) + slider._handleSize;

				//apply the new size
				if (opts.vertical) {
					//apply the new size to the track
					slider._trackOnElm.height(adjustedSize);
					if (ruler) {
						ruler.element.height(adjustedSize - slider._handleSize);
					}
				} else {
					//work out the difference between the old track size and the new track size
					//apply that difference to the element width
					element.width(opts.size - (slider._trackSize - adjustedSize));
				}
				slider._trackSize = slider._trackElm[vocab.length]();
			}
			slider._pixelsPerVal = ((slider._trackSize - slider._handleSize) / (opts.max - opts.min));
			//apply the start value
			slider.val(startVal);

			// ARIA - initial setup
			element.attr({
				"aria-valuenow": slider._val,
				"aria-valuemin": opts.min,
				"aria-valuemax": opts.max
			});

			//create draggable
			draggableOpts = {
				axis: vocab.axis,
				container: slider._trackElm,
				onDrag: function() {
					if (slider._disabled || slideStart(slider).defaultPrevented()) {
						return false;
					}
					slider._stateElm.addClass("slider-active");
					mouseMoveListener = events.addListener(document, "mousemove", handleMouseMove, slider);
				},
				onDrop: function() {
					slider._stateElm.removeClass("slider-active");
					events.removeListener(mouseMoveListener);
					slideStop(slider);
				}
			};

			if (opts.snapOnDrag) {
				draggableOpts.step = slider._pixelsPerVal * opts.step;
			}

			handleDraggable = new glow.dragdrop.Draggable(slider._handleElm, draggableOpts);

			// track clicking
			if (opts.jumpOnClick) {
				events.addListener(slider._trackElm, "mousedown", function(event) {
					if (slider._disabled || event.source == slider._handleElm[0]) {
						// don't react if slider is disabled or handle is being used
						return;
					}
					// vocab.pos is top / left, vocab.pagePos is pageX / pageY
					var vocab = getVocab(slider),
						oldPagePos = event[vocab.pagePos];

					// This is a bit cheeky...
					// We're tricking the draggable into thinking the mouse is in the centre of the handle.
					// This way, all the handling of stepping and bounds is handled by the draggable
					// TODO: Move this functionality into Draggable
					event[vocab.pagePos] = slider._handleElm.offset()[vocab.pos] + (slider._handleSize / 2);

					// so, make the draggable think the user has clicked in the centre of it
					if (handleDraggable._startDragMouse.call(handleDraggable, event) === false) {
						// now make it think the mouse has moved
						event[vocab.pagePos] = oldPagePos;
						handleDraggable._dragMouse.call(handleDraggable, event);
						adjustTracks(slider);
						// cancel default click
						return false;
					}
				});
			}
		}

		/**
		@name glow.widgets.Slider
		@class
		@description Form control for setting a numerical value within a range.	

		<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>

		@param {glow.dom.NodeList | Selector | HTMLElement} container Container of Slider.
			The Slider will be appended to this element, retaining existing contents.

		@param {Object} [opts] Options object
			@param {Number} [opts.size=300] Pixel width / height of the slider
				The size may be automatically reduced so that stepping sits on absolute pixels.
			@param {glow.dom.NodeList | Selector | HTMLElement} [opts.bindTo] Form element to bind value to.
				Changes to this form element will also cause the Slider to update
			@param {Number} [opts.min=0] Minimum value for slider.
				Can be negative but must be smaller than opts.max.
			@param {Number} [opts.max=100] Maximum value for slider.
				Can be negative but must be greater than opts.min.
			@param {Number} [opts.step=1] Step between values.
				0 or fractional step values may result in fractional values.
			@param {Boolean} [opts.snapOnDrag=false] If true, the slide handle will snap to each step during drag.
				This is a visual effect, it will not impact the value of the slider.
			@param {Boolean} [opts.snapOnDrop=false] If true, the slide handle will snap to a step position on drop.
				This is a visual effect, it will not impact the value of the slider.
			@param {Number} [opts.val] Start value.
				By default, the value from the bound form element will be used. If none
				exists, the minimum value will be used.
			@param {Boolean} [opts.changeOnDrag=false] Fire the 'change' event during drag.
			@param {String} [opts.id] Value for Slider's ID attribute
			@param {String} [opts.className] Values for Slider's class attribute.
				Space separated values.
			@param {Object} [opts.labels] Labels for Slider values.
				For numerical labels, a Number can be provided for the interval between labels. Text labels can
				be specified in the form <code>{"value": "label"}</code>,
				eg <code>{"0": "Min", "50": "Medium", "100": "Maximum"}</code>. Labels may contain
				HTML, so images could be used.
			@param {Number} [opts.tickMajor] The interval between each major tick mark.
			@param {Number} [opts.tickMinor] The interval between each minor tick mark.
			@param {Boolean} [opts.vertical=false] Create a vertical slider?
			@param {String} [opts.theme="light"] Visual theme to use.
				Current themes are "light" and "dark".
			@param {Boolean} [opts.jumpOnClick=true] Does the track react to clicks?
				If true, when the user clicks on the slider track the handle
				will move to that position. Dragging can be initiated from anywhere
				on the track.
			@param {Boolean} [opts.buttons=true] Include fine-tuning buttons?
			@param {Function} [opts.onSlideStart] Event shortcut.
				See documentation below
			@param {Function} [opts.onSlideStop] Event shortcut.
				See documentation below
			@param {Function} [opts.onChange] Event shortcut.
				See documentation below

		@example
			var mySlider = new glow.widgets.Slider("#sliderContainer", {
				min: 5,
				max: 80,
				id: "ageSlider",
				tickMajor: 5,
				tickMinor: 1,
				labels: 5
			});

		@example
			var mySlider = new glow.widgets.Slider("#fishLevelSlider", {
				bindTo: 'numberOfFishInTheSea',
				buttons: false,
				className: 'deepBlue',
				onSlideStart: function() {
					glow.dom.get('img#fishes').toggleCss('moving');
				},
				onSlideStop: function() {
					glow.dom.get('img#fishes').toggleCss('moving');
				},
				size: '600',
			});

		@example
			var mySlider = new glow.widgets.Slider("#soundLevelHolder", {
				min: 1,
				max: 100,
				id: "soundLevel",
				onChange: function () {
					updateFlash('sound', this.val());
				}
				tickMajor: 10,
				tickMinor: 5,
				labels: 5,
				vertical: true
			});

		@see <a href="../furtherinfo/widgets/slider/">Slider user guide</a>
		@see <a href="../furtherinfo/widgets/slider/style.shtml">Restyling a Slider</a>
		@see <a href="../furtherinfo/widgets/slider/colourpicker.shtml">Slider Demo: Colour Picker</a>
		*/
		/**
			@name glow.widgets.Slider#event:slideStart
			@event
			@description Fired when the user starts moving the slider.

				Fired on both keyboard and mouse interaction. Preventing the
				default will prevent the user moving the slider.

			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Slider#event:slideStop
			@event
			@description Fired when the user stops moving the slider.

				Fired on both keyboard and mouse interaction. Preventing the
				default will return the slider to the position it was before
				the user started dragging.

				The event object contains properties 'initialVal' and
				'currentVal', which contain the value before dragging and the
				value about to be set respectively.

			@param {glow.events.Event} event Event Object
		*/
		/**
			@name glow.widgets.Slider#event:change
			@event
			@description Fired when the slider value changes.

				This is usually fired when the user drops the handle, but
				can be configured to fire as the user is dragging the slider,
				via the 'changeOnDrag' option. Change also occurs when the value
				in the bound form element is changed by the user.

				Change does not fire when the slider's value is set via
				<code>mySlider.val()</code>.

			@param {glow.events.Event} event Event Object
		*/

		Slider = glow.widgets.Slider = function(container, opts) {
			//private vars
			/**
			@name glow.widgets.Sliders#_boundInput
			@type glow.dom.NodeList
			@private
			@description Element the slider is bound to.
				Can be an empty NodeList if no input was specified by the user
			*/
			/**
			@name glow.widgets.Sliders#_stateElm
			@private
			@type glow.dom.NodeList
			@description Element to apply state-related class names to, like slider-disabled
			*/
			/**
			@name glow.widgets.Sliders#_trackElm
			@private
			@type glow.dom.NodeList
			@description Element to apply state-related class names to, like slider-disabled
			*/
			/**
			@name glow.widgets.Sliders#_trackOnElm
			@private
			@type glow.dom.NodeList
			@description Element containing the "on" state of the track
			*/
			/**
			@name glow.widgets.Sliders#_trackOffElm
			@private
			@type glow.dom.NodeList
			@description Element containing the "on" state of the track
			*/
			/**
			@name glow.widgets.Sliders#_handleElm
			@private
			@type glow.dom.NodeList
			@description The slider handle
			*/
			/**
			@name glow.widgets.Sliders#_trackSize
			@private
			@type Number
			@description Pixel width / height for track
			*/
			/**
			@name glow.widgets.Sliders#_handleSize
			@private
			@type Number
			@description Pixel width / height for handle
			*/
			/**
			@name glow.widgets.Sliders#_pixelsPerVal
			@private
			@type Number
			@description How much is each pixel movement of the handle worth?
			*/
			/**
			@name glow.widgets.Sliders#_val
			@private
			@type Number
			@description Current value of the slider. Set and read by val()
			*/
			/**
			@name glow.widgets.Sliders#_valBeforeSlide
			@private
			@type Number
			@description The value of the slider when sliding last began
			*/
			/**
			@name glow.widgets.Sliders#_nudgeVal
			@private
			@type Number
			@description Sometimes we need to hold the value of the slider as it's moving.
				We don't want to set the actual val, as the change isn't over yet
			*/
			/**
			@name glow.widgets.Sliders#_disabled
			@private
			@type Boolean
			@description Is the slider disabled
			*/
			this._disabled = false;

			//normalise container
			container = $(container);

			//set up the default options
			this._opts = opts = glow.lang.apply({
				min: 0,
				max: 100,
				step: 1,
				theme: "light",
				jumpOnClick: 1,
				buttons: 1,
				size: 300
			}, opts);

			var i,
				//tmp holder of converted event names
				onEventName,
				//get hold of the vocab we need to use
				vocab = getVocab(this),
				//will hold a nodelist of the slider
				element,
				//the height of the slider when the track is 0px. Basically any padding, margins and borders
				verticalPaddingHeight,
				//adjusted size after catering for fitting ticks and steps onto pixels
				adjustedSize,
				//'that' for event listeners
				that = this,
				//nodelist to the back & fwd buttons
				buttonElms,
				//reference to the ticks & labels ruler used
				ruler,
				//get the smallest non-zero value for step (if we're snapping while dragging), labelMinor, labelMajor
				smallestStepingVal = greatestCommonDivisor( (opts.step * opts.snapOnDrag), opts.tickMinor, opts.tickMajor );

			//apply the listeners passed in through opts
			i = eventNames.length;
			while (i--) {
				//convert names. Eg "slideStart" to "onSlideStart"
				onEventName = "on" + eventNames[i].charAt(0).toUpperCase() + eventNames[i].slice(1);
				if (opts[onEventName]) {
					events.addListener(this, eventNames[i], opts[onEventName]);
				}
			}

			// get bound input
			this._boundInput = opts.bindTo ? $(opts.bindTo) : new glow.dom.NodeList();

			/**
			@name glow.widgets.Slider#element
			@type glow.dom.NodeList
			@description Slider HTML Element.
				This can be used to perform DOM manipulation on the slider

			@example
				//get the offset of a slider
				mySlider.element.offset();
			*/
			// add in wrapping element
			this.element = element = glow.dom.create('<div class="glow173-' + vocab.containerClassNamePart + '" tabindex="0" role="slider" aria-disabled="false">' + SLIDER_TEMPLATE + '</div>');
			this._trackElm = element.get("div.slider-track");
			this._trackOnElm = element.get("div.slider-trackOn");
			this._trackOffElm = element.get("div.slider-trackOff");
			this._handleElm = this._trackElm.get("div.slider-handle");
			this._stateElm = element.get("div.slider-state");

			// add in the theme
			element.get("div.slider-theme").addClass("slider-" + opts.theme);

			// removes buttons if the user doesn't want them
			!opts.buttons && this._stateElm.addClass("slider-noButtons");

			// add custom ID / Class names
			element[0].id = opts.id || "";
			element[0].className += " " + (opts.className || "");

			// add Ruler (ticks and labels)
			if (opts.tickMajor || opts.tickMinor || opts.labels) {
				opts.reverse = opts.vertical;
				ruler = new Ruler(element.get("div.slider-labels"), opts);
			}

			//add to page
			this.element.appendTo(container);

			initUi(this, ruler);			

			if (this._boundInput[0]) {
				// listen for changes
				events.addListener(this._boundInput, "change", function() {
					var snappedValue = sanitiseVal(that, this.value);
					change(that, snappedValue);
					// using val() to do the UI & value updating results in sanitise being called twice, but saves code
					that.val(snappedValue);
				});
			}

			// focus changes
			events.addListener(this.element, "focus", function() {
				if ( !that._disabled ) {
					that._stateElm.addClass("slider-active");
				}
			});

			events.addListener(this.element, "blur", function() {
				that._stateElm.removeClass("slider-active");
			});

			// keyboard events
			events.addListener(this.element, 'keydown', function(event) {
				if (that._disabled) { return; }
				switch (event.key) {
					case 'UP':
					case 'RIGHT':
					case 'DOWN':
					case 'LEFT':
						return handleKeyNav.call(that, event);
				}
			});

			events.addListener(this.element, 'keyup', function(event) {
				if (that._disabled) { return; }
				switch (event.key) {
					case 'UP':
					case 'RIGHT':
					case 'DOWN':
					case 'LEFT':
						return handleKeyNavEnd.call(that, event);
				}
			});

			// the following prevents the arrow keys scrolling in some browsers (such as Opera)
			events.addListener(this.element, 'keypress', function(event) {
				if (that._disabled) { return; }
				switch (event.key) {
					case 'UP':
					case 'RIGHT':
					case 'DOWN':
					case 'LEFT':
						return false;
				}
			});

			// nudge buttons
			buttonElms = this.element.get(".slider-btn-fwd, .slider-btn-bk");
			events.addListener(buttonElms, "mousedown", handleButtonDown, this);
			events.addListener(buttonElms, "mouseup", handleButtonUp, this);
			events.addListener(buttonElms, "mouseout", handleButtonUp, this);

			// label clicking
			if (ruler) {
				events.addListener(ruler.element, "mousedown", function(event) {
					// exit if slider disabled
					if (that._disabled) { return; }

					var labelElm = $(event.source),
						snappedValue;

					// right, we need to turn labelElm (currently the event source) into the label element
					while ( labelElm[0] != ruler.element[0] ) {
						if ( labelElm.hasClass("ruler-label") ) { // yey, we found the label
							// check the value is valid
							snappedValue = sanitiseVal(that, labelElm[0]._labelVal);
							change(that, snappedValue);
							// update UI
							that.val(snappedValue);
							return false;
						}
						labelElm = labelElm.parent();
					}
					// the user must have clicked outside a label
				});
			}
		};

		Slider.prototype = {
			/**
			@name glow.widgets.Slider#disabled
			@function
			@description Get / Set the disabled state of the slider
				Call without parameters to get the state, call with parameters
				to set the state.

				Disabling the slider will also disable the bound form element.

			@param {Boolean} [disable] Disable the slider?
				'false' will enable a disabled slider.

			@returns
				The slider instance when setting. Boolean when getting.

			@example
				// disabling a slider
				mySlider.disabled( true );

				// toggling a slider
				mySlider.disabled( !mySlider.disabled() )
			*/
			disabled: function(disable) {
				if (disable !== undefined) {
					// setting...

					// cast to boolean and set
					this._disabled = disable = !!disable;

					// ARIA update
					this.element.attr("aria-disabled", disable);

					// add / remove the disabled class
					this._stateElm[disable ? "addClass" : "removeClass"]("slider-disabled");

					//disable the bound form field, if it's there
					( this._boundInput[0] || {} ).disabled = disable;

					return this;
				} else {
					// getting...
					return this._disabled;
				}
			},
			/**
			@name glow.widgets.Slider#val
			@function
			@description Get / Set the value the slider
				Call without parameters to get the value, call with parameters
				to set the value.

			@param {Number} [newVal] New value for the slider

			@returns
				The slider instance when setting. Number when getting.

			@example
				// getting the current value
				var sliderVal = mySlider.val();

				// setting the value
				mySlider.val(50);
			*/
			/*
			This param is a possible future enhancment

			@param {glow.anim.Animation | Boolean} [anim] Animate the slider to the new value.
				Ommiting this parameter will simply switch the slider to the new value.

				True will create a basic easing animation, or a custom animation can
				be provided.

				Animating to a new value simulates human interaction. The usual events
				will be fired along the way.
			*/
			val: function(newVal) {
				if (newVal != undefined) {
					//setting...

					//sanitise and set
					this._val = sanitiseVal(this, newVal);
					//update aria
					this.element.attr("aria-valuenow", this._val);
					//update form
					(this._boundInput[0] || {}).value = this._val;
					//update UI
					updateSliderUi(this);

					return this;
				} else {
					return this._val;
				}
			},
			/**
			@name glow.widgets.Slider#valToLabel
			@function
			@description Get the label for a value.

			@param {Number} [val] The value.
				If omitted, the current slider value is used.

			@returns {String}
				Label text.

			@example
				// find out the label the handle is nearest
				var label = mySlider.valToLabel();
			*/
			valToLabel: function(val) {
				// pick the value up from the slider if there are no params
				if (val === undefined) {
					val = this._val;
				}

				var labels = this._opts.labels,
					// the lowest difference between labels
					lowestDiff = Infinity,
					// the lowest different passed through Math.abs
					lowestDiffAbs = Infinity,
					// label that has the lowest differece
					currentLabel,
					// tmp value
					diffAbs,
					i;

				// return null if there are no labels
				if (labels === undefined) { return null; }

				// look out for interval labels
				if (typeof labels == 'number') {
					// round to the nearest interval label
					return Math.round(val / labels) * labels;
				}

				// deal with object labels
				// is the value the actual position of a label? If so return it
				if (labels[val]) {
					return labels[val];
				}

				// bah, we have to look for the closest label
				for (i in labels) {
					// get the difference between the label and value
					diffAbs = Math.abs(Number(i) - val);

					if (diffAbs < lowestDiffAbs) {
						// the difference is less than ones found previously, we have a new winner
						lowestDiffAbs = diffAbs;
						lowestDiff = Number(i) - val;
						currentLabel = labels[i];
					} else if (diffAbs == lowestDiffAbs) {
						// uh oh, we have two diffs the same. Round up!
						if (lowestDiff < 0) {
							lowestDiffAbs = diffAbs;
							lowestDiff = Number(i) - val;
							currentLabel = labels[i];
						}
					}
				}
				return currentLabel;
			},
			/**
			@name glow.widgets.Slider#labelToVal
			@function
			@description Get the value for a particular label.
				If the label doesn't exist in the slider, null is returned

			@param {String} [label] A label used in the slider

			@returns {Number}
				Value.

			@example
				// find out that value of "Medium" on the slider
				var val = mySlider.labelToVal("Medium");
			*/
			labelToVal: function(label) {
				var i,
					labels = this._opts.labels;

				// return null if there are no labels
				if (labels === undefined) { return null; }

				// look out for interval labels
				if (typeof labels == 'number') {
					label = Number(label);

					// if the label is divisable by the interval, return it
					if ( !(Number(label) % labels) && !isNaN(label) ) {
						return label;
					}
					return null;
				}

				// loop through the objects until we find a match
				for (i in labels) {
					if (label == labels[i]) {
						return Number(i);
					}
				}
				return null;
			}
		};
	}
});


(window.gloader || glow).module({
	name: "glow.widgets.Timetable",
	library: ["glow", "1.7.3"],
	depends: [[
		"glow", "1.7.3",
		'glow.dom',
		'glow.events',
		'glow.widgets',
		'glow.widgets.Slider',
		'glow.dragdrop',
		'glow.i18n'
	]],
	builder: function(glow) {
		var $dom = glow.dom,
			$ = $dom.get,
			$create = $dom.create,
			$events = glow.events,
			$listen = $events.addListener,
			$fire = $events.fire,
			$lang = glow.lang,
			$apply = $lang.apply,
			$i18n = glow.i18n,
			idIndex = 0,
			vocabs = [
				{
					length: "width",
					breadth: "height",
					rootClass: "glow173-Timetable",
					dragAxis: "x",
					pos: "left",
					posOpposite: "right",
					otherPos: "top",
					otherPosOpposite: "bottom"

				},
				{
					length: "height",
					breadth: "width",
					rootClass: "glow173-vTimetable",
					dragAxis: "y",
					pos: "top",
					posOpposite: "bottom",
					otherPos: "left",
					otherPosOpposite: "right"
				}
			];

		$i18n.addLocaleModule("GLOW_WIDGETS_TIMETABLE", "en", {
			ACCESSIBILITY_MENU_START : "Start",
			ACCESSIBILITY_MENU_END : "End",
			ACCESSIBILITY_INTRO : "Use this menu to choose what section of the timetable to view.",
			SKIPLINK_TO_TRACK : "skip to track data",
			SKIPLINK_BACK_TO_HEADERS : "back to track headers"
		});

		function getId() {
			return glow.UID + "TimetableWidget" + (idIndex++);
		}

		/*
		  This returns either the horizontal or vertical vocab.
		*/
		function getVocab() {
			return vocabs[!!this._opts.vertical * 1];
		}

		// Helper for banding iterations
		function _adder(amount) {
			return function (prev) {
				if(prev instanceof Date) {
					return new Date(prev.getTime() + amount);
				} else {
					return prev + amount;
				}
			};
		}

		// type is "hour", "day", "week", "month" a function (which will just be returned) or a number
		// TODO - stop using this directly and roll it into _getSegments?? ()
		function _createIncrementer(type) {
			switch(type) {
				case "am/pm":
					return _adder(43200000); // 12 * 60 * 60 * 1000
				case "hour":
					return _adder(3600000); // 60 * 60 * 1000
				case "day":
					return _adder(86400000); // 24 * 60 * 60 * 1000
				case "week":
					return _adder(604800000); // 7 * 24 * 60 * 60 * 1000
				case "month":
					return function(prev)
					{
						var d = new Date(prev);
						d.setMonth(d.getMonth() + 1);
						return d;
					};
				case "year":
					return function(prev)
					{
						var d = new Date(prev);
						d.setFullYear(d.getFullYear() + 1);
						return d;
					};
				default:
					if (type instanceof Function) {
						return type;
					} else if (isNaN(type)) {
						throw new Error("Can't create incrementer");
					} else {
						return _adder(parseInt(type));
					}
			}
		}

		function _getSegments(rule, first, start, stop) {
			if(rule instanceof Array) { // use it directly
				if (!this.numerical) {
					// make sure all the values are dates
					return glow.lang.map(rule, function(item) {
						return new Date(item);
					})
				}
				return rule;
			}

			var iSize, output, sizes,
				now,
				len = 1,
				incrementer = _createIncrementer(rule);

			if(first == "auto") {
				sizes = {
					"am/pm"	: 43200000, // 12 * 60 * 60 * 1000
					"hour" 	:  3600000, //      60 * 60 * 1000
					"day" 	: 86400000  // 24 * 60 * 60 * 1000
				};

				switch (rule) {
					case "am/pm":
					case "hour":
					case "day":
						now = new Date(sizes[rule] * Math.floor(start.valueOf() / sizes[rule]));
						break;
					case "week":
						now = new Date(start);
						now.setHours(0, 0, 0, 0);
						now.setDate(now.getDate() - now.getDay());
						break;
					case "month":
						now = new Date(start);
						now.setHours(0, 0, 0, 0);
						now.setDate(1);
						break;
					case "year":
						now = new Date(start);
						now.setHours(0, 0, 0, 0);
						now.setMonth(0, 1);
						break;
					default:
						now = start;
				}
			} else {
				now = first || start;
			}

			output = [now];

			while(now < stop)
			{
				now = incrementer(now);
				output[len++] = now;
			}

			return output;
		}

		// for building track header/footer, item, scale segment and scrollbar mark contents from a template
		function _buildFromTemplate(template) {
			var halfway, content;

			if (template == undefined) {
				return null;
			}

			if(template instanceof $dom.NodeList) {
				halfway = template;
			} else if(template instanceof Function) {
				halfway = template(this);
			} else {
				halfway = $lang.interpolate("" + template, this);
			}

			if(halfway instanceof $dom.NodeList) {
				content = $dom.create("<div></div>").append(halfway);
			} else {
				content = $dom.create("<div>" + halfway + "</div>");
			}

			return content;
		}

		/**
		@name glow.widgets.Timetable
		@class
		@description A scrollable list of ordered items displayed against a proportional axis.
			Note: you must call draw() on a timetable before it is displayed.

			<div class="info">Widgets must be called in a <code>glow.ready()</code> call.</div>

		@param {String|HTMLElement|glow.dom.NodeList} container The Element into which the Timetable will be placed.
			If a String is given, it is used as a selector. If a Nodelist is given, the first item is used.

			The contents of the element will be replaced by the Timetable. Ideally, this element should contain
			a static version of the timetable for users without JavaScript.
		@param {Date | Number} start The start point of the entire Timetable.
			The user will not be able to scroll before this point.

			Also controls the unit of the Timetable. If a Number is given, the Timetable is regarded as number based, otherwise it's regarded as Date based
		@param {Date | Number} end The end point of the entire Timetable
			The user will not be able to scroll beyond this point.
		@param {Date | Number} viewStart The start point of the visible area.
			This sets the start point of the view, and in conjunction with viewEnd sets the zoom level of the timetable
		@param {Date | Number} viewEnd The end point of the visible portion.
			In conjunction with viewStart sets the zoom level of the timetable
		@param {Object} [opts] An optional options object
			@param {String} [opts.theme="light"] Visual theme for the Timetable.
				Possible values are "light" and "dark". Both themes can be altered with
				CSS to fit the design of your site.
			@param {String} [opts.id=auto-generated] An id for the Timetable.
				You must set this (or className) if you're going to customise the design
				of the timetable, to target it with CSS selectors.
			@param {String} [opts.className] A class name for the Timetable's container element
				You must set this (or id) if you're going to customise the design
				of the timetable, to target it with CSS selectors.
			@param {Boolean} [opts.vertical=true] Create a vertical Timetable?
			@param {String | Number} [opts.size=container size] The width (if horizontal) or height (if vertical) of the scrollable area of the Timetable.
				Note that headers and footers will add to the overall size.
			@param {Array} [opts.tracks] An array of Tracks to create the Timetable with.
				Each element in the Array is an Array of parameters that are passed to the addTrack method.

				This can be used to pass in timetable data as a single JSON object rather than using the addTrack and
				addItem methods.
			@param {Boolean} [opts.collapseItemBorders=true] Should item borders collapse into each other?
				As in, take up the same space.
			@param {Boolean} [opts.collapseTrackBorders=false] Should track borders collapse into each other?
				As in, take up the same space. This must be false if you want your tracks to be separated by a margin.
			@param {Boolean} [opts.keepItemContentInView=true] Should the content of an item that is partially in view be moved into view?
			@param {String | glow.dom.NodeList | Function} [opts.itemTemplate] Template for each Item on a Track in the Timetable
				The {@link glow.widgets.Timetable.Item item} will be passed into the template.

				<p>A default template is used if this is not provided, which displays just the item title</p>
				<ul>
					<li>If a String is provided, it is passed through glow.lang.interpolate, with the Item as the data parameter, and the output is used.</li>
					<li>If a NodeList is provided it is used directly.</li>
					<li>If a function is provided it should take the Item as its only argument, and return the HTML or a NodeList to use.</li>
				</ul>
			@param {String | glow.dom.NodeList | Function} [opts.trackHeader] Template for the header section the each Track in the Timetable
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.

				Defaults to no header.
				See itemTemplate above for a description of how the different values are treated.
			@param {String | glow.dom.NodeList | Function} [opts.trackFooter] Template for the footer section the each Track in the Timetable
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.

				Defaults to no footer.
				See itemTemplate above for a description of how the different values are treated.
			@param {Function} [opts.onChange] Event shortcut
			@param {Function} [opts.onItemClick] Event shortcut
			@param {Function} [opts.onMoveStart] Event shortcut
			@param {Function} [opts.onMoveStop] Event shortcut

		@example
			// using dates
			var myTimetable = new glow.widgets.Timetable('#timetableContainer',
				"31 December 2008 23:30", "1 January 2009 14:30",
				"1 January 2009 00:30", "1 January 2009 05:30",
				{
					itemTemplate: "<strong>{title} # {id}</strong>",
					trackHeader: "<h2>{title}</h2>",
				}
			)

			// using numbers
			var myTimetable = new glow.widgets.Timetable('#timetableContainer',
				0, 100,
				5, 6,
				{
					itemTemplate: "<strong>{title} # {id}</strong>",
					trackHeader: "<h2>{title}</h2>",
				}
			)

		@see <a href="../furtherinfo/widgets/timetable/">Timetable user guide</a>
		@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
		@see <a href="../furtherinfo/widgets/timetable/styling.shtml">Styling a Timetable</a>
		@see <a href="../furtherinfo/widgets/timetable/remotedata.shtml">Loading Timetable Data From A Remote Source</a>

		*/
		/**
		@name glow.widgets.Timetable#event:change
		@event
		@description Fires each time the Timetable view start point changes.

			This will fire after dragging, rather than during dragging.

		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.Timetable#event:itemClick
		@event
		@description Fires when the user clicks an item on the Timetable.

			The Event object will have an 'item' property.

		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.Timetable#event:moveStart
		@event
		@description Fires when the Timetable starts to move (by whatever UI method).
		@param {glow.events.Event} event Event Object
		*/
		/**
		@name glow.widgets.Timetable#event:moveStop
		@event
		@description Fires when the Timetable stops moving (by whatever UI method).
		@param {glow.events.Event} event Event Object
		*/

		function Timetable(container, start, end, viewStart, viewEnd, opts) {

			this._opts = opts = $apply({
				vertical: true,
				tracks: [],
				collapseItemBorders: true,
				collapseTrackBorders: false,
				keepItemContentInView: true,
				className: "",
				theme: "light"
			}, opts || {});

			var vocab = getVocab.call(this);

			this._container = $(container);

			if (!this._container[0]) {
				throw new Error("Could not find container for Timetable");
			}

			/**
			@name glow.widgets.Timetable#id
			@type String
			@description The Timetable's id
			*/
			this.id = opts.id || getId();

			/**
			@name glow.widgets.Timetable#size
			@type Number
			@description The width (if horizontal) or height (if vertical) of the Timetable's scrollable arae
			*/
			this.size = opts.size || this._container[vocab.length]();

			/**
			@name glow.widgets.Timetable#numerical
			@type Boolean
			@description true if the Timetable is Number based, false if it is Date based
			*/
			this.numerical = ((typeof start) == "number");

			/**
			@name glow.widgets.Timetable#start
			@type Date | Number
			@description The start point of the whole Timetable.
				The user will not be able to scroll before this point.
			*/
			this.start = start;

			/**
			@name glow.widgets.Timetable#end
			@type Date | Number
			@description The end point of the whole Timetable
				The user will not be able to scroll beyond this point.
			*/
			this.end = end;

			/**
			@name glow.widgets.Timetable#_viewStart
			@private
			@type Date | Number
			@description The start point of the visible portion
			*/
			this._viewStart = viewStart;

			/**
			@name glow.widgets.Timetable#_viewEnd
			@private
			@type Date | Number
			@description The end point of the visible portion
			*/
			this._viewEnd = viewEnd;

			if(!this.numerical) {
				this.start = new Date(start);
				this.end = new Date(end);
				this._viewStart = new Date(viewStart);
				this._viewEnd = new Date(viewEnd);
			}

			this._viewWindowSize = this._viewEnd - this._viewStart;



			/**
			@name glow.widgets.Timetable#tracks
			@type glow.widgets.Timetable.Track[]
			@description Array of all the Tracks in the Timetable (including disabled ones).
				Ordered by the order they were added.
			*/
			this.tracks = [];

			for(var i = 0, l = opts.tracks.length; i < l; i++) {
				this.addTrack.apply(this, opts.tracks[i]);
			}

			if(opts.onChange) {
				$listen(this, "change", opts.onChange);
			}
			if(opts.onItemClick) {
				$listen(this, "itemClick", opts.onItemClick);
			}
			if(opts.onMoveStart) {
				$listen(this, "moveStart", opts.onMoveStart);
			}
			if(opts.onMoveStop) {
				$listen(this, "moveStop", opts.onMoveStop);
			}

			/**
			@name glow.widgets.Timetable#element
			@type glow.dom.NodeList
			@description The root element of the Timetable widget
			*/
			this.element;

			// create view
			this._view = new View(this);

			/**
			@name glow.widgets.Timetable#_banding
			@private
			@type Number[] | Date[]
			@description The banding of the Timetable, as an array of banding interval boundary points. An empty array signifies no banding.
			*/
			this._banding = [];

			/**
			@name glow.widgets.Timetable#_primaryScales
			@private
			@type Object[]
			@description The top/left scales of the Timetable, as an array of objects, each containg an array of segment end points ("points" property), the size of the scale ("size" property) and a String/function/Nodelist template ("template" property). An empty array signifies no primary scale.
				ie it will end up looking a bit like this [{template: "{start} to {end}", points: [0, 1, 2, 3]}, ...]
			*/
			this._primaryScales = [];

			/**
			@name glow.widgets.Timetable#_secondaryScales
			@private
			@type Object[]
			@description The bottom/right scales of the Timetable, just like _primaryScales.
			*/
			this._secondaryScales = [];

			/**
			@name glow.widgets.Timetable#_primaryScrollbar
			@private
			@type Object
			@description The top/left scrollbar of the Timetable, as an object containg an array of mark points ("points" property), the size of the scrollbar ("size" property) and a String/function/Nodelist template ("template" property). An null object signifies no primary scrollbar.
				ie it will end up looking a bit like this [{template: "{start} to {end}", points: [0, 1, 2, 3]}, ...]
			*/
			this._primaryScrollbar = null;

			/**
			@name glow.widgets.Timetable#_secondaryScrollbar
			@private
			@type Object[]
			@description The bottom/right scrollbar of the Timetable, just like _primaryScrollbar.
			*/
			this._secondaryScrollbar = null;
		}

		Timetable.prototype = {
			/**
			@name glow.widgets.Timetable#addTrack
			@function
			@description Factory method for creating a standard Track and adding it to the Timetable.
				Tracks can only created by using this method.

			@param {String} title The title of the Track
			@param {String | Number} size The height (if horizontal) or width (if vertical) of the Track (not including borders and margins)
			@param {Object} [opts] Options object
				@param {String} [opts.id=auto-generated] An id for the Track
				@param {String} [opts.className] A class name for the Track's container element
				@param {String | glow.dom.NodeList | Function} [opts.itemTemplate] Template for each Item on this Track.
					The {@link glow.widgets.Timetable.Item item} will be passed into the template.

					<ol>
						<li>If a String is provided, it is passed through glow.lang.interpolate, with the Item as the other parameter, and the output is used.</li>
						<li>If a NodeList is provided it is used directly.</li>
						<li>If a function is provided it should take the Item as its only argument, and return the HTML or a NodeList to use.</li>
					</ol>
				@param {String | glow.dom.NodeList | Function} [opts.trackHeader] Template for the header section the this Track.
					The {@link glow.widgets.Timetable.Track track} will be passed into the template.

					Overrides any template specified at Timetable level.

					See itemTemplate above for a description of how the different values are treated.
				@param {String | glow.dom.NodeList | Function} [opts.trackFooter] Template for the footer section the this Track.
					The {@link glow.widgets.Timetable.Track track} will be passed into the template.

					Overrides any template specified at Timetable level.

					See itemTemplate above for a description of how the different values are treated.
				@param {Object} [opts.data] An object of arbitrary data to be attached to the Track.
				@param {Boolean} [opts.disabled=false] A disabled track is not rendered in the view
				@param {Array} [opts.items] An array of Items to create the Track with
					Each element in the Array is an Array of parameters that are passed to the addItem method of the Track

			@returns {glow.widgets.Timetable.Track} The Track that was created

			@example
				// no items
				var myTrack1 = myTimetable.addTrack("Track 1", 250);

				// add some items at the same time
				var myTrack2 = myTimetable.addTrack("Track 2", 250, {
					items : [
						["Item 1", "2009/01/01 00:00", "2009/01/01 01:00"],
						["Item 2", "2009/01/01 01:00", "2009/01/01 01:30"],
						["Item 3", "2009/01/01 01:30", "2009/01/01 01:40"]
					]
				});

				// add additional items
				myTrack2.addItem("Item 4", "2009/01/01 01:40", "2009/01/01 02:00");

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>

			*/
			addTrack : function(title, size, opts) {
				return this.tracks[this.tracks.length] = new Track(this, title, size, opts);
			},

			/**
			@name glow.widgets.Timetable#currentPosition
			@function
			@description Gets or sets the start point of the Timetable's visible portion

			@param {Date | Number} value The new start point to use

			@returns this
			*/
			currentPosition : function(value) {
				if(value === undefined) {
					var current = (this._view) ? this._view.currentPosition() : this._viewStart;
					// convert it to a date if we have to
					if (!this.numerical) {
						current = new Date(current);
					}
					return current;
				} else {

					if (!this.numerical) {
						value = new Date(value);
					}



					this._view.currentPosition(value);

					return this;
				}
			},

			/**
			@name glow.widgets.Timetable#viewRange
			@function
			@description Get or set the visible data range.
				Changing this changes the scale of the timetable, you can use
				this to 'zoom' the view in or out.

			@param {Object} [newRange] An object with 'start' and / or 'end' properties, in the same format as the viewStart and viewEnd constructor parameters.
				If either the 'start' or 'end' property is omitted, the current value is taken.

			@returns this (if setting) or Object with start & end properties representing the view range

			@example
				// function to zoom in a timetable
				function zoomIn(timetable) {
				  // get the current range
				  var range = timetable.viewRange();
				  // get the difference between the start and end values
				  var currentDiff = range.end - range.start;
				  // half the difference, this is a 2x zoom
				  var newDiff = currentDiff / 2;

				  // set a new end value for the range
				  timetable.viewRange({
					end: range.start.valueOf() + newDiff
				  })
				}
			*/
			viewRange: function(newRange) {
				// start by getting the current range
				var duration = this._viewEnd - this._viewStart,
					currentPos = this.currentPosition(),
					range = {
						start: currentPos,
						end: currentPos.valueOf() + duration
					};

				if (!this.numerical) {
					range.end = new Date( range.end );
				}

				if (newRange) { // setting
					this._viewStart = newRange.start || range.start;
					this._viewEnd = newRange.end || range.end;

					if (!this.numerical) {
						this._viewStart = new Date( this._viewStart );
						this._viewEnd = new Date( this._viewEnd );
					}
					// make sure the values aren't out of range
					if (this._viewStart < this.start) {
						this._viewStart = this.start;
					}
					if (this._viewEnd > this.end) {
						this._viewEnd = this.end;
					}
					if (this._view && this._view._drawn) {
						this.draw(true).currentPosition(this._viewStart);
					}
					return this;
				} else { // getting
					return range;
				}
			},

			/**
			@name glow.widgets.Timetable#setItemTemplate
			@function
			@description Sets the Default Item template for the Timetable
				The {@link glow.widgets.Timetable.Item item} will be passed into the template.
			@param {String | glow.dom.NodeList | function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setItemTemplate : function(template) {
				this._opts.itemTemplate = template;

				return this;
			},

			/**
			@name glow.widgets.Timetable#setTrackHeaderTemplate
			@function
			@description Sets the default Track header template for the Timetable
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.
			@param {String | glow.dom.NodeList | Function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setTrackHeaderTemplate : function(template) {
				this._opts.trackHeader = template;
				return this;
			},

			/**
			@name glow.widgets.Timetable#setTrackFooterTemplate
			@function
			@description Sets the default Track footer template for the Timetable
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.
			@param {String | glow.dom.NodeList | Function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setTrackFooterTemplate : function(template) {
				this._opts.trackFooter = template;
				return this;
			},

			/**
			@name glow.widgets.Timetable#setBanding
			@function
			@description Sets the background banding for the Timetable.
				Note that banding won't appear until the Timetable has been {@link glow.widgets.Timetable#draw redrawn}.
			@param {Number | String | function | Array} banding Defines the banding intervals
				<ul>
					<li>If a number is passed, banding intervals are defined that far apart. If the Timetable is date based, this should be a number of milliseconds.</li>
					<li>If a String is passed, it should be one of "am/pm", "hour", "day", "week", "month" or "year", as shortcuts for common (not necessarily even) time intervals.</li>
					<li>If a function is passed, it should take a point on the Timetable as its only argument and return the next point. It will be used to iteratively generate the banding interval points starting from the first.</li>
					<li>If an Array is passed, its elements should be points on the Timetable, and these will be used directly as the banding interval end points. The start option below will have no effect.</li>
				</ul>
			@param {Object} [opts] Options object
				@param {String | Date | Number} [opts.start=auto] The start point of the first banding interval.
					<p>If set to auto, an appropriate choice is made for the banding.</p>
					<ul>
						<li>"am/pm" chooses 12am or 12pm.</li>
						<li>"hour" gives the beginning of the hour</li>
						<li>"day" gives midnight</li>
						<li>"week" gives midnight on sunday</li>
						<li>"month" gives midnight on the first</li>
						<li>"year" gives midnight on January 1st</li>
					</ul>
					<p>For any other banding definition, auto sets the start to the Timetable start point.</p>
					<p>Has no effect if an Array is passed as the banding.</p>

			@returns this

			@example
				myTimetable.setBanding("hour");
			*/
			setBanding : function(banding, opts) {
				var options = opts || {};

				this._banding = _getSegments.call(this, banding, options.start || "auto", this.start, this.end);

				return this;
			},

			/**
			@name glow.widgets.Timetable#addScale
			@function
			@description Adds a scale to one or both sides of the Timetable.
				Several scales can be attached to either side of the Timetable - eg hours and "am/pm".

				Scales will appear in the order in which they were added, working inwards. ie the last to be added will be closest to the Tracks.

				Note that scales won't appear until the Timetable has been {@link glow.widgets.Timetable#draw redrawn}.

			@param {Number | String | function | Array} segmentation Defines the size of the scale's segments
				<ul>
					<li>If a number is passed, scale segments are defined that size. If the Timetable is date based, this should be a number of milliseconds.</li>
					<li>If a String is passed, it should be one of "am/pm", "hour", "day", "week", "month" or "year", as shortcuts for common (not necessarily even) time intervals.</li>
					<li>If a function is passed, it should take a point on the Timetable as its only argument and return another point. It will be used to iteratively generate the scale segment end points starting from the first.</li>
					<li>If an Array is passed, its elements should be points on the Timetable, and these will be used directly as the scale segment end points. The start option below will have no effect.</li>
				</ul>
			@param {String} [position] "top", "bottom", "left", "right" or "both" to determine where the scale should display.
				<ul>
					<li>"top" and "left" are synonymous, and positions the scale above a horizontal timetable or to the left of a vertical one.</li>
					<li>"bottom" and "right" are synonymous, and positions the scale below a horizontal timetable or to the right of a vertical one.</li>
					<li>"both" positions two identical scales, one in each position.</li>
					<li>If more than one scale is added on the same side of the timetable, they will display in the order they were added on the top/left and in the reverse order on the bottom/right.</li>
				</ul>
			@param {String | Number} size The height (if horizontal) or width (if vertical) of the scale
			@param {Object} [opts] Options object
				@param {String} [opts.id] An id for the scale's container element. Do not use this if adding a scale to both sides, or an error will be thrown (use className instead).
				@param {String} [opts.className] A class name for the scale's container element
				@param {String | glow.dom.NodeList | Function} [opts.template] Specification for templating HTML of each section of the scale
					<p>The template uses an object giving the segments "start" and "end" points.</p>
					<ul>
						<li>If a String is provided, it is passed through glow.lang.interpolate, with the above scale segment data object as the other parameter, and the output is used.</li>
						<li>If a NodeList is provided it is used directly.</li>
						<li>If a function is provided it should take the above scale segment data object as its argument, and return a String or a NodeList to use.</li>
						<li>If the final output of the template is a String, it need not contain any HTML (eg just a time of day, like "8am" is OK).</li>
						<li>If no template is supplied the scale segments will be empty.</li>
					</ul>
				@param {String | Date | Number} [opts.start=auto] The start point of the first scale segments.
					<p>If set to auto, an appropriate choice is made for the start point.</p>
					<ul>
						<li>"am/pm" chooses 12am or 12pm</li>
						<li>"hour" gives the beginning of the hour</li>
						<li>"day" gives midnight</li>
						<li>"week" gives midnight on sunday</li>
						<li>"month" gives midnight on the first</li>
						<li>"year" gives midnight on January 1st</li>
					</ul>
					<p>For any other segmentation definition, auto sets the start to the Timetable start point.</p>
					<p>Has no effect if an Array is passed as the interval.</p>

			@returns this

			@example
				myTimetable.addScale("hour", "left", 50, {
				  template: function (segment) {
					return segment.start.getHours();
				  }
				});

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>

			*/
			addScale : function(segmentation, position, size, opts) {
				var options = opts || {},
					spec = {
						template: options.template,
						size: size,
						points: _getSegments.call(this, segmentation, options.start || "auto", this.start, this.end),
						opts: options
					};

				position = position.toLowerCase();

				if ((position == "both") && options.id) {
					throw new Error("Cannot apply an id when adding to both sides of the timetable");
				}

				if((position == "top") || (position == "left") || (position == "both")) {
					this._primaryScales[this._primaryScales.length] = spec;
				}

				if((position == "bottom") || (position == "right") || (position == "both")) {
					this._secondaryScales[this._secondaryScales.length] = spec;
				}

				return this;
			},

			/**
			@name glow.widgets.Timetable#removeScales
			@function
			@description Removes all the scales from one or both sides of the Timetable.
				Note that scales won't disappear until the Timetable has been {@link glow.widgets.Timetable#draw redrawn}.

			@param {String} [position] "top", "bottom", "left", "right" or "both" to determine which scales to remove.
				<ul>
					<li>"top" and "left" are synonymous, and removes the scales above a horizontal timetable or to the left of a vertical one.</li>
					<li>"bottom" and "right" are synonymous, and removes the scales below a horizontal timetable or to the right of a vertical one.</li>
					<li>"both" all the scales.</li>
				</ul>

			*/
			removeScales: function(position) {
				if((position == "top") || (position == "left") || (position == "both")) {
					this._primaryScales = [];
				}

				if((position == "bottom") || (position == "right") || (position == "both")) {
					this._secondaryScales = [];
				}

				return this;
			},

			/**
			@name glow.widgets.Timetable#addScrollbar
			@function
			@description Adds a scrollbar to one or both sides of the Timetable
				Only one scrollbar can be attached to either side of the Timetable, if more than one are added, the last one is used.

				Note that scrollbars won't appear until the Timetable has been {@link glow.widgets.Timetable#draw redrawn}.
			@param {Number | String | function | Array} marks Defines the scrollbar's mark points
				<ul>
					<li>If a number is passed, mark points are defined that far apart. If the Timetable is date based, this should be a number of milliseconds.</li>
					<li>If a String is passed, it should be one of "am/pm", "hour", "day", "week", "month" or "year", as shortcuts for common (not necessarily even) time intervals.</li>
					<li>If a function is passed, it should take a point on the Timetable as its only argument and return the next point. It will be used to iteratively generate the mark points starting from the first.</li>
					<li>If an Array is passed, its elements should be points on the Timetable, and these will be used directly as the mark points. The start option below will have no effect.</li>
				</ul>
			@param {String} [position] "top", "bottom", "left", "right" or "both" to determine where the scale should display
				<ul>
					<li>"top" and "left" are synonymous, and positions the scrollbar above a horizontal timetable or to the left of a vertical one.</li>
					<li>"bottom" and "right" are synonymous, and positions the scrollbar below a horizontal timetable or to the right of a vertical one.</li>
					<li>"both" positions two identical scrollbar, one in each position.</li>
				</ul>
			@param {String | Number} size The height (if horizontal) or width (if vertical) of the scrollbar
			@param {Object} [opts] Options object
				@param {String} [opts.id] An id for the scrollbar container element. Do not use this if adding a scrollbar to both sides, or an errro will be thrown.
				@param {String} [opts.className] A class name for the scrollbar's container element
				@param {String | glow.dom.NodeList | Function} [opts.template] Specification for templating HTML of each mark point
					<p>The template uses an object giving the mark's "start" and "end" points.</p>
					<ul>
						<li>If a String is provided, it is passed through glow.lang.interpolate, with the above data object as the other parameter, and the output is used.</li>
						<li>If a NodeList is provided it is used directly.</li>
						<li>If a function is provided it should take the above data object as its argument, and return a String or a NodeList to use.</li>
						<li>If the final output of the template is a String, it need not contain any HTML (eg just a time of day, like "8am" is OK).</li>
						<li>If no template is supplied the scale segments will be empty.</li>
					</ul>
				@param {String | Date | Number} [opts.start=auto] The first mark point.
					<p>If set to auto, an appropriate choice is made for the start point.</p>
					<ul>
						<li>"am/pm" chooses 12am or 12pm</li>
						<li>"hour" gives the beginning of the hour</li>
						<li>"day" gives midnight</li>
						<li>"week" gives midnight on sunday</li>
						<li>"month" gives midnight on the first</li>
						<li>"year" gives midnight on January 1st</li>
					</ul>
					<p>Has no effect if an Array is passed as the marks.</p>

			@returns this

			@example
				myTimetable.addScrollbar("hour", "left", 50, {
				  template: function (segment) {
					return segment.start.getHours();
				  }
				});

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>

			*/
			addScrollbar : function(marks, position, size, opts) {
				var options = $apply({
						buttons: true
					}, opts || {}),
					spec = {
						template: options.template,
						size: size,
						points: _getSegments.call(this, marks, options.start || "auto", this.start, this.end),
						opts: options
					};

				position = position.toLowerCase();

				if ((position == "both") && options.id) {
					throw new Error("Cannot apply an id when adding to both sides of the timetable");
				}

				if((position == "top") || (position == "left") || (position == "both")) {
					this._primaryScrollbar = spec;
				}

				if((position == "bottom") || (position == "right") || (position == "both")) {
					this._secondaryScrollbar = spec;
				}

				return this;
			},

			/**
			@name glow.widgets.Timetable#draw
			@function
			@description Update the view with any changes you've made.
				You need to call this function after adding new tracks or items
				to make them visible on the timetable.

			@param {Boolean} [redraw=false] Redraw all items?
				Usually, draw will just draw items & tracks that have been added since
				last calling draw. Use this option to force the timetable to
				completely redraw.

			@returns this
			*/
			draw: function(redraw) {
				this._view.draw(redraw);
				return this;
			}
		};


		/**
		@name glow.widgets.Timetable.Track
		@class
		@description A Track is a grouping of Timetable items.

		@glowPrivateConstructor A Track cannot be directly instantiated. Instead the {@link glow.widgets.Timetable#addTrack addTrack} method of glow.widgets.Timetable must be used.
		*/
		function Track(timetable, title, size, opts) {
			this._opts = opts = $apply({
				className: ""
			}, opts || {});

			/**
			@name glow.widgets.Timetable.Track#disabled
			@type Boolean
			@description Should the Track be removed from the view?
				If set to true, this Track will not be rendered in the Timetable view the next time it is {@link glow.widgets.Timetable#draw drawn/redrawn}
			*/
			this.disabled = opts.disabled || false;

			/**
			@name glow.widgets.Timetable.Track#data
			@type Object
			@description The track's arbitrary data store
			*/
			this.data = opts.data || {};

			/**
			@name glow.widgets.Timetable.Track#title
			@type String
			@description The Track's title
			*/
			this.title = title;

			/**
			@name glow.widgets.Timetable.Track#size
			@type Number
			@description The Track's size
			*/
			this.size = size;

			/**
			@name glow.widgets.Timetable.Track#timetable
			@type glow.widgets.Timetable
			@description The Track's parent Timetable
			*/
			this.timetable = timetable;

			/**
			@name glow.widgets.Timetable.Track#id
			@type String
			@description The Track's id
			*/
			this.id = opts.id || getId();

			/**
			@name glow.widgets.Timetable.Track#items
			@type Item[]
			@description an array of the Track's Items in order of their start time
			*/
			this.items = [];

			if(opts.items != undefined) {
				for(var i = 0, l = opts.items.length; i < l; i++) {
					_factoryItem.apply(this, opts.items[i]);
				}

				_sortItems.call(this);
			}
		}

		// create an Item and add it to the Track
		function _factoryItem (title, start, end, options) {
			return this.items[this.items.length] = new Item(this, title, start, end, options);
		}

		function _itemSortOrder(a, b) {
			return ((a.start - b.start) || (a._addIndex - b._addIndex)); // _addIndexes will *never* be equal so this function will never return 0, meaning the sort is always stable.
		}

		// factorised out because it may become more complex in the future
		function _sortItems() {
			this.items.sort(_itemSortOrder);
		}

		// This is the core function for finding Items on a track given a point or segment of the Timetable. All the public query methods delegate to this
		// TODO - investigate quicker (eg binary?) search to find first item quickly. May need an extra sort index.
		function _queryItems(start, end, testFunc) {
			if (((typeof start) == "number") !== this.timetable.numerical)
			{
				throw new Error("Cannot get Item(s) - point(s) not in the correct scale type.");
			}

			var items = this.items,
				results = {items: [], indices: []},
				num = 0;

			if(!this.timetable.numerical) {
				start = new Date(start);
				end = new Date(end);
			}

			for(var i = 0, l = items.length; i < l; i++) {
				if(items[i].start > end) {
					break;
				}
				if (testFunc.call(items[i], start, end)) {
					results.items[num] = items[i];
					results.indices[num] = i;
					num++;
				}
			}

			return results;
		}

		// helper for use in _queryItems calls
		function _rangeContainsItem(start, end) {
			return ((this.start >= start) && (this.end <= end));
		}

		// helper for use in _queryItems calls and Item.inRange calls
		function _itemOverlapsRange(start, end) {
			return ((this.start < end) && (this.end > start));
		}

		// helper for use in _queryItems calls
		function _itemAtPoint(point) {
			return ((this.start <= point) && (this.end > point));
		}

		Track.prototype = {
			toString : function() {return this.title;},

			/**
			@name glow.widgets.Timetable.Track#addItem
			@function
			@description Factory method for creating an Item and adding it to the Track

			@param {String} title The title
			@param {Date | Number} start The start point
			@param {Date | Number} end The end point
			@param {Object} [opts] Options object
				@param {String} [opts.id=auto-generated] An id for the Item
				@param {String} [opts.className] A class name for the Item's container element
				@param {String | glow.dom.NodeList | Function} [opts.itemTemplate] Specification for templating HTML of the this Item
					<p>Overrides any template specified at Track or Timetable level.</p>
					<ul>
						<li>If a String is provided, it is passed through glow.lang.interpolate, with the Item as the other parameter, and the output is used.</li>
						<li>If a NodeList is provided it is used directly.</li>
						<li>If a function is provided it should take the Item as its only argument, and return the HTML or a NodeList to use.</li>
					</ul>
				@param {Object} [opts.data] An object of arbitrary data to be attached to the Item

			@returns {glow.widgets.Item}
				The created Item.

			@example
				// on a numeric Timetable (1 - 100)
				var myItem = myTrack.addItem("Some Item", 10, 14);
			*/
			addItem : function(title, start, end, options) {
				var item = _factoryItem.call(this, title, start, end, options);
				_sortItems.call(this);

				return item;
			},

			/**
			@name glow.widgets.Timetable.Track#itemAt
			@function
			@description Returns the Item that is on the Track at the given point

			@param {Date | Number} point The point on the Track to inspect
			@returns {Item}

			@example
				var anItem = myTrack.itemAt("31 December 1999 23:59");
				// anItem now holds a reference to a glow.Timetable.Item
			*/
			itemAt : function(point) {
				return _queryItems.call(this, point, point, _itemAtPoint).items[0];
			},

			/**
			@name glow.widgets.Timetable.Track#indexAt
			@function
			@description Finds the Item that is on the Track at the given point, and returns it's index in the items[] property

			@param {Date | Number} point The point on the Track to inspect
			@returns {Number}

			@example
				var nowIndex = myTrack.indexAt(new Date());
				var now = myTrack.items[nowIndex];
				var next = myTrack.items[nowIndex + 1];
			*/
			indexAt : function(point) {
				return _queryItems.call(this, point, point, _itemAtPoint).indices[0];
			},

			/**
			@name glow.widgets.Timetable.Track#itemsAt
			@function
			@description Returns an array of any Items that are on the Track at the given point
				Items appear in the array in "choronological" order
			@param {Date | Number} point The point on the Track to inspect
			@returns {Item[]}

			@example
				var someItems = myTrack.itemsAt("31 December 1999 23:59");
				// someItems now holds a reference to an Array of glow.Timetable.Items
			*/
			itemsAt : function(point) {
				return _queryItems.call(this, point, point, _itemAtPoint).items;
			},

			/**
			@name glow.widgets.Timetable.Track#indicesAt
			@function
			@description Finds any Items that are on the Track at the given point, and returns an array of their indices in the items[] property
				Items appear in the array in "choronological" order
			@param {Date | Number} point The point on the Track to inspect
			@returns {Number[]}

			@example
				var someIndexes = myTrack.indicesAt("31 December 1999 23:59");
				// someIndexes now holds a reference to an Array of integers
			*/
			indicesAt : function(point) {
				return _queryItems.call(this, point, point, _itemAtPoint).indices;
			},

			/**
			@name glow.widgets.Timetable.Track#itemsInRange
			@function
			@description Returns an array of any Items that are on the Track overlapping the given range
				Items appear in the array in "choronological" order
			@param {Date | Number} start The start point of the portion of the Track to inspect
			@param {Date | Number} end The end point of the portion of the Track to inspect
			@returns {Item[]}

			@example
				var someItems = myTrack.itemsInRange("31 December 1999 23:59", "1 January 2000 00:01");
				// someItems now holds a reference to an Array of glow.Timetable.Items
			*/
			itemsInRange : function(start, end) {
				return _queryItems.call(this, start, end, _itemOverlapsRange).items;
			},

			/**
			@name glow.widgets.Timetable.Track#indicesInRange
			@function
			@description Finds any Items that are on the Track overlapping the given range, and returns an array of their indices in the items[] property
				Items appear in the array in "choronological" order
			@param {Date | Number} start The start point of the portion of the Track to inspect
			@param {Date | Number} end The end point of the portion of the Track to inspect
			@returns {Number[]}

			@example
				var someIndexes = myTrack.indicesInRange("31 December 1999 23:59", "1 January 2000 00:01");
				// someIndexes now holds a reference to an Array of integers
			*/
			indicesInRange : function(start, end) {
				return _queryItems.call(this, start, end, _itemOverlapsRange).indices;
			},

			/**
			@name glow.widgets.Timetable.Track#setItemTemplate
			@function
			@description Sets the Default Item template for this track
				The {@link glow.widgets.Timetable.Item item} will be passed into the template.
			@param {String | glow.dom.NodeList | function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setItemTemplate : function(template) {
				this._opts.itemTemplate = template;

				return this;
			},

			/**
			@name glow.widgets.Timetable.Track#setTrackHeaderTemplate
			@function
			@description Sets the header template for this track
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.
			@param {String | glow.dom.NodeList | function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setTrackHeaderTemplate : function(template) {
				this._opts.trackHeader = template;

				return this;
			},

			/**
			@name glow.widgets.Timetable.Track#setTrackFooterTemplate
			@function
			@description Sets the footer template for this track
				The {@link glow.widgets.Timetable.Track track} will be passed into the template.
			@param {String | glow.dom.NodeList | function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setTrackFooterTemplate : function(template) {
				this._opts.trackFooter = template;

				return this;
			},

			/**
			@name glow.widgets.Timetable.Track#getHeader
			@function
			@description Gets the actual content of if the Track header (if any) for the Timetable to display
			@returns glow.dom.NodeList
			*/
			getHeader : function() {
				return _buildFromTemplate.call(this, this._opts.trackHeader || this.timetable._opts.trackHeader);
			},

			/**
			@name glow.widgets.Timetable.Track#getFooter
			@function
			@description Gets the actual content of if the Track footer (if any) for the Timetable to display
			@returns glow.dom.NodeList
			*/
			getFooter : function() {
				return _buildFromTemplate.call(this, this._opts.trackFooter || this.timetable._opts.trackFooter);
			}
		};

		/**
		@name glow.widgets.Timetable.Item
		@class
		@description An Item is an "event" on a Track.

		@glowPrivateConstructor An Item cannot be directly instantiated. Instead the {@link glow.widgets.Timetable.Track#addItem addItem} method of glow.widgets.Timetable.Track must be used.
		*/
		function Item(track, title, start, end, opts) {
			/**
			@name glow.widgets.Timetable.Item#_addIndex
			@private
			@type Number
			@description An integer that increments by one for each Item added to the track, so that each Item has a different and constant _addIndex. This is then used in Item sorting to force stability on the sort algorithm in JS engines (like V8) that use an unstable sort.
			*/
			this._addIndex = track.items.length;

			this._opts = opts = $apply({
				className: ""
			}, opts || {});

			if (((typeof start) == "number") !== track.timetable.numerical)
			{
				throw new Error("Item scale type does not match Timetable.");
			}

			/**
			@name glow.widgets.Timetable.Item#data
			@type Object
			@description The Item's arbitrary data store
				This can be used to attach any arbitrary data to the Item, without the possibility of conflicting with the Item's designed properties.
			@example
				myItem.data.moreInfoUrl = "someUrl"; // used in the Item templare to provide a link to a "more info" page.
			*/
			this.data = opts.data || {};

			/**
			@name glow.widgets.Timetable.Item#title
			@type String
			@description The Item's title
			*/
			this.title = title;

			/**
			@name glow.widgets.Timetable.Item#start
			@type Date | Number
			@description The Item's start point
			*/
			this.start = start;

			/**
			@name glow.widgets.Timetable.Item#end
			@type Date | Number
			@description The Item's end point
			*/
			this.end = end;

			if(!track.timetable.numerical) {
				this.start = new Date(start);
				this.end = new Date(end);
			}

			/**
			@name glow.widgets.Timetable.Item#track
			@type glow.widgets.Timetable.Track
			@description The Item's parent Track
			*/
			this.track = track;

			/**
			@name glow.widgets.Timetable.Item#id
			@type String
			@description The Item's id
			*/
			this.id = opts.id || getId();

			/**
			@name glow.widgets.Timetable.Item#element
			@type glow.dom.Nodelist
			@description The HTML element that represents the item in the Timetable.
			*/
			this.element;
		}

		Item.prototype = {
			toString : function() {return this.title;},

			/**
			@name glow.widgets.Timetable.Item#setItemTemplate
			@function
			@description Sets the Default Item template for the Timetable
				The {@link glow.widgets.Timetable.Item item} will be passed into the template.
			@param {String | glow.dom.NodeList | function} template The template to use
			@returns this

			@see <a href="../furtherinfo/widgets/timetable/templating.shtml">Templating within a Timetable</a>
			*/
			setItemTemplate : function(template) {
				this._opts.itemTemplate = template;

				return this;
			},

			/**
			@name glow.widgets.Timetable.Item#getContent
			@function
			@description Gets the actual content of the Item for the Timetable to display
			@returns glow.dom.NodeList
			*/
			getContent : function() {
				return _buildFromTemplate.call(this, this._opts.itemTemplate || this.track._opts.itemTemplate || this.track.timetable._opts.itemTemplate);
			},



			/**
			@name glow.widgets.Timetable.Item#inRange
			@function
			@description Returns true if the Item overlaps the range with the given start and end points
			@returns Boolean

			@example
				var item = myTrack.addItem("Item", 1, 2);

				if (item.inRange(0, 1.5)) {
					// code here runs
				}

				if (item.inRange(3, 4)) {
					// code here doesn't run
				}
			*/
			inRange : function (start, end) {

				if(!this.track.timetable.numerical) {
					start = new Date(start);
					end = new Date(end);
				}

				return _itemOverlapsRange.call(this, start, end);

			}
		};

		glow.widgets.Timetable = Timetable;
		glow.widgets.Timetable.Track = Track;
		glow.widgets.Timetable.Item = Item;

		/**
		@name glow.widgets.Timetable.View
		@private
		@class
		@description Deals with the rendering of the timetable

		@param {glow.widgets.Timetable} timetable The timetable instance to render
		*/
		var View;

		(function() {
			// TODO test keyboard navigation of items (can they be focused and clicked?)
			var containerTemplate = '' +
					'<div>' +
						'<div class="timetable-theme">' +
							'<div class="timetable-state">' +
								'<div class="timetable-container">' +
									'<div class="timetable-accessibility-navigation">{ACCESSIBILITY_INTRO}</div>' +
									'<div class="timetable-track-headers" role="presentation" id="' + glow.UID + 'TimetableWidgetHeaders"></div>' +
									'<div class="timetable-scrollView">' +
										'<div class="timetable-scrollbar1"></div>' +
										'<div class="timetable-innerView">' +
											'<div class="timetable-dragRange">' +
												'<div class="timetable-dragArea" aria-live="polite">' +
												'</div>' +
											'</div>' +
										'</div>' +
										'<div class="timetable-scrollbar2"></div>' +
									'</div>' +
									'<div class="timetable-track-footers" role="presentation" id="' + glow.UID + 'TimetableWidgetFooters"></div>' +
								'</div>' +
							'</div>' +
						'</div>' +
					'</div>',
				headerHolderTemplate = '' +
					'<div class="timetable-header-holder"></div>',
				footerHolderTemplate = '' +
					'<div class="timetable-footer-holder"></div>',
				trackTemplate = '' +
					'<div class="timetable-track"><ol class="timetable-trackList"></ol></div>',
				itemHolderTemplate = '' +
					'<li class="timetable-item" tabindex="0"></li>',
				scaleTemplate = '' +
					'<div class="timetable-scale"></div>',
				scaleItemTemplate = '' +
					'<div class="timetable-scaleItem"></div>',
				emptyDiv = $dom.create('<div></div>'),
				// the maximum number of pixels (in any direction) the mouse can move between mousedown and click to count as 'clicking' rather than dragging
				mouseMoveTolerance = 10;

			// called when the mouse moves during a timetable drag
			function _mouseMoveDuringTimetableDrag(event) {
				if (!this._clickStart) {
					// this is the first run of this, capture the mouse position
					this._clickStart = [event.pageX, event.pageY];
				}
				// cancel the click if the mouse has moved outside the tolerance range
				else if (
					!this._cancelNextItemClick && // no point recalculating if we've already canceled
					(Math.abs(this._clickStart[0] - event.pageX) > mouseMoveTolerance ||
					 Math.abs(this._clickStart[1] - event.pageY) > mouseMoveTolerance)
				) {
					this._cancelNextItemClick = true;
				}

				// call _moveToPosition with the correct value
				_moveToPosition.call( this, this.currentPosition() );
			}

			// here we work out if we should react to the click or not
			function _dragAreaClicked(event) {
				if (this._cancelNextItemClick) return false;
				// TODO work out which item, if any, has been clicked and fire itemClicked event

				var itemElm = $(event.source);

				// bubble up until we find the item the user clicked on
				while (itemElm[0] != event.attachedTo) {
					if ( itemElm.hasClass("timetable-item") ) {
						// found it!
						$fire(this._timetable, "itemClick", $apply({item: this.itemInstance[ itemElm[0].id ]}, new $events.Event(event)));
					}
					itemElm = itemElm.parent();
				}
			}

			// called before the timetable begins to move
			function _moveStart() {
				// TODO does anything need to be included in this event?
				// TODO make cancelable
				$fire(this._timetable, "moveStart");
			}

			// updates the position of elements for a given val
			function _moveToPosition(val) {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable);

				// update any interface element that need changing
				this._dragAreaElm.css( vocab.pos, -(_valToPos.call(this, val)) );
				// TODO add slider position updates here
				if (this._scrollbar1) {
					this._scrollbar1.moveToPosition(val);
				}
				if (this._scrollbar2) {
					this._scrollbar2.moveToPosition(val);
				}

			}

			// called when a moving action ends that triggered a _moveStart (ie, not pragmatic change)
			function _moveStop() {
				$fire(this._timetable, "moveStop");
			}

			// called when the timetable has completed a move (eg, dragging is complete or position is changed programmatically)
			function _moved() {
				// move elements that are half in view
				_adjustContentPosition.call(this);
				// fire the change event if we should
				_fireChangeEvent.call(this);
			}

			// move content of items into view, and reset others
			function _adjustContentPosition() {

				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					i = 0,
					len = timetable.tracks.length,
					item,
					itemToAdjust,
					itemContentToAdjust,
					itemId,
					currentPos = timetable.currentPosition(),
					itemPixelOffset,
					newMargin,
					posPixelOffset = parseInt( this._dragAreaElm[0].style[vocab.pos] );

				// reset position of other items
				if (this._timetable._opts.keepItemContentInView) {
					this._itemContentHangingOffStart.css("margin-" + vocab.pos, 0);
					this._itemsHangingOffStart.removeClass("timetable-itemHangingClipping");
				}
				this._itemsHangingOffStart.removeClass("timetable-itemHangingOffStart");

				// start collecting new items to move
				this._itemContentHangingOffStart = new $dom.NodeList();
				this._itemsHangingOffStart = new $dom.NodeList();

				for (; i < len; i++) {
					// get hold of the item element and its inner content
					item = timetable.tracks[i].itemAt(currentPos);
					// no item found? Also, skip items that start at the current time
					if ( !item || item.start.valueOf() == currentPos.valueOf() ) {
						continue;
					}
					itemId = item.id;
					itemContentToAdjust = this.itemContent[ itemId ];
					itemToAdjust = this.items[ itemId ];

					this._itemContentHangingOffStart.push(itemContentToAdjust);
					this._itemsHangingOffStart.push(itemToAdjust);

					if (this._timetable._opts.keepItemContentInView) {
						// find out what the pixel offset of the item is
						itemPixelOffset = parseInt( itemToAdjust[0].style[vocab.pos] );
						newMargin = -posPixelOffset - itemPixelOffset;
						itemContentToAdjust.css("margin-" + vocab.pos,
							newMargin
						);
						// is the content clipping against the bottom of the item box?
						if (itemToAdjust[vocab.length]() < (itemContentToAdjust[vocab.length]() + newMargin)) {
							itemToAdjust.addClass("timetable-itemHangingClipping");
						}
					}
				}
				this._itemsHangingOffStart.addClass("timetable-itemHangingOffStart");
			}

			// get pixel value for a timetable unit
			function _valToPos(val) {
				return (val - this._timetable.start) / this.scale;
			}

			// get a value for a pixel position
			function _posToVal(pos) {
				return (pos * this.scale) + this._timetable.start.valueOf();
			}

			// only fire change event if the value has changed
			function _fireChangeEvent() {
				var timetable = this._timetable,
					newPos = timetable.currentPosition();

				if(newPos.valueOf() != this._posBeforeMove.valueOf()) {
					$fire(timetable, "change");
					this._posBeforeMove = newPos;
					_updateHiddenNavSelect.call(this);

				}
			}

			// create an item element from Item instance
			function _createItem(item, border) {
				// generate container
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					itemPos = _valToPos.call(this, item.start),
					itemLength = _valToPos.call(this, item.end) - itemPos,
					itemElm = $dom.create(itemHolderTemplate),
					itemContent = item.getContent() || _itemDefaultContent(item);

				// add class name & id
				itemElm.attr("id", item.id);
				itemContent[0].className = "timetable-itemContent " + item._opts.className;

				var self = this;

				item.element = this.items[item.id] = itemElm;
				this.itemContent[item.id] = itemContent;
				this.itemInstance[item.id] = item;

				// we need to deduct borders from the item length. We deduct 2 borders if we're not collapsing. One otherwise.
				itemLength -= border * ((!timetable._opts.collapseItemBorders) + 1);
				// size and position

				// it's possible the itemLength has gone below 0, which it shouldn't
				if (itemLength < 0) {
					itemLength = 0;
				}

				itemElm.css(vocab.pos, itemPos)
					.css(vocab.length, itemLength);

				// add content
				itemElm.append(itemContent);
				// return container
				return itemElm;
			}

			function _itemDefaultContent(item) {
				return $create("<div>" + item.title + "</div>");
			}

			function _drawTrack(track) {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					items = track.items,
					i = 0,
					len = items.length,
					trackElm = this.tracks[track.id],
					header = this._headers[track.id],

					footer = this._footers[track.id],

					trackListElm,
					itemBorder,
					itemElmTmp,
					item;

				// generate html for the track if we haven't already
				if (!trackElm) {
					trackElm = this.tracks[track.id] = _createTrack.call(this, track);
					// size the track
					trackElm.css(vocab.breadth, track.size);
					trackElm.appendTo( this._dragAreaElm );
					// draw headers and footers for this track (if needed)
					_drawHeaderAndFooter.call(this, track);
					if(header) {
						trackElm.prepend(header.clone().removeClass("timetable-header-holder").addClass("timetable-accessibility-hidden"));
					}
					if(footer) {
						trackElm.append(footer.clone().removeClass("timetable-footer-holder").addClass("timetable-accessibility-hidden"));
					}
				}



				trackListElm = trackElm.get("> ol");

				// calculate an item border for this track
				itemElmTmp = $dom.create(itemHolderTemplate).appendTo(trackListElm);
				itemBorder = parseInt(itemElmTmp.css(["border-" + vocab.pos + "-width", "border-" + vocab.posOpposite + "-width"])) / 2;
				itemElmTmp.remove();

				// loop over items
				for (; i < len; i++) {
					item = track.items[i];
					// if item isn't already drawn
					if (!this.items[item.id]) {
						// append item to track and save in register
						_createItem.call(this, items[i], itemBorder).appendTo(trackListElm);
					}
				}
			}

			function _drawHeaderAndFooter(track) {
				var content,
					id = track.id;

				content = track.getHeader();

				// do we have content?
				if (content) {
					// get and add the content
					this._headers[id] = $dom.create(headerHolderTemplate).append( content.addClass("timetable-header-content") );
					this._headerElm.append(this._headers[id])
						.append('<a class="timetable-accessibility-hidden" href="#' + id + '">' + this._locale.SKIPLINK_TO_TRACK + '</a>');
				}

				content = track.getFooter();

				if (content) {
					this._footers[id] = $dom.create(footerHolderTemplate).append( content.addClass("timetable-footer-content") );
					this._footerElm.append(this._footers[id])
					   .append('<a class="timetable-accessibility-hidden" href="#' + glow.UID + 'TimetableWidgetHeaders">' + this._locale.SKIPLINK_BACK_TO_HEADERS + '</a>');
				}
			}

			function _createTrack(track) {
				var r = $dom.create(trackTemplate).attr("id", track.id);

				// TODO add class name & id
				return r;
			}

			function _positionTracks() {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					i = 0,
					tracksLen = timetable.tracks.length,
					primaryScalesLen = this._primaryScaleElms.length,
					secondaryScalesLen = this._secondaryScaleElms.length,
					lenTotal = tracksLen + primaryScalesLen + secondaryScalesLen,
					trackElm,
					headerElm,
					footerElm,
					headerMaxLength = 0,
					footerMaxLength = 0,

					headerFooterOffset,
					headerFooterBreadth,
					breadthBorders = ["border-" + vocab.otherPos + "-width", "border-" + vocab.otherPosOpposite + "-width"],
					posSum = 0,
					collapseBorders = timetable._opts.collapseTrackBorders,
					border,
					margin,
					size,
					id,
					trackObj;


				headerFooterOffset = this._scrollbar1Elm[vocab.breadth]() - parseInt( this._headerElm.css("border-" + vocab.otherPos + "-width") );


				for (; i < lenTotal; i++) {
					// figure out what we're looping through
					if (i < primaryScalesLen) {
						trackElm = this._primaryScaleElms[i];
						headerElm = footerElm = null;
					} else if (i < primaryScalesLen + tracksLen) {
						trackObj = timetable.tracks[i-primaryScalesLen];
						id = trackObj.id;
						trackElm = this.tracks[id];
						headerElm = this._headers[id];
						footerElm = this._footers[id];
						if (trackObj.disabled) {
							// ensure the elements are hidden
							$(trackElm, headerElm, footerElm).css("display", "none");
							continue;
						} else {
							// ensure the elements are shown
							$(trackElm, headerElm, footerElm).css("display", "");
						}
					} else {
						trackElm = this._secondaryScaleElms[i-primaryScalesLen-tracksLen];
						headerElm = footerElm = null;
					}

					border = parseInt(trackElm.css(breadthBorders)) / 2;
					// || 0 is to catch IE return 'auto' for margin
					margin = collapseBorders ? 0 : parseInt(trackElm.css("margin-" + vocab.otherPosOpposite)) || 0;
					size = parseInt(trackElm.css(vocab.breadth)) + (border * ((!collapseBorders) + 1)) + margin;
					// set breadth and position
					trackElm.css(vocab.otherPos, posSum);
					if(headerElm) {
						headerElm.css(vocab.otherPos, posSum + headerFooterOffset).css(vocab.breadth, trackObj.size + 2 * border);
						headerMaxLength = Math.max(
							parseInt( headerElm.css(vocab.length) ),
							headerMaxLength
						);

					}

					if(footerElm) {
						footerElm.css(vocab.otherPos, posSum + headerFooterOffset).css(vocab.breadth, trackObj.size + 2 * border);
						footerMaxLength = Math.max(
							parseInt( footerElm.css(vocab.length) ),
							footerMaxLength
						);

					}

					// deduct border if we're collapsing borders. We deduct 2 borders if we're not collapsing. One otherwise.
					posSum += size;
				}


				// set this.element to be width / height of the total, ignoring the final margin
				this._innerViewElm.css(vocab.breadth, posSum + (border * collapseBorders) - margin);
				// set the width / height of header and footer containers
				headerFooterBreadth = posSum + (border * collapseBorders) - margin + headerFooterOffset + this._scrollbar2Elm[vocab.breadth]();

				$(this._headerElm, this._footerElm).css(vocab.breadth,
					headerFooterBreadth
					- parseInt( this._headerElm.css("border-" + vocab.otherPosOpposite + "-width") )
				);

				// set container sizes
				this._headerElm.css(vocab.length, headerMaxLength);
				this._footerElm.css(vocab.length, footerMaxLength);
			}

			function _drawBanding() {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					i = 0,
					len = timetable._banding.length - 1,
					bandStart,
					bandStartPos,
					bandEnd,
					bandEndPos,
					band;

				// loop through the banding points
				for (; i < len; i++) {
					bandStart = timetable._banding[i].valueOf();
					bandEnd = timetable._banding[i+1].valueOf();

					// get pixel values for band positions
					bandStartPos = _valToPos.call(this, bandStart);
					bandEndPos = _valToPos.call(this, bandEnd) - bandStartPos;

					// create our band
					band = emptyDiv.clone()
						// set its starting position
						.css(vocab.pos, bandStartPos)
						// set its length
						.css(vocab.length, bandEndPos)
						// add class name
						.addClass( "timetable-band" + (i%2 ? 'Odd' : 'Even') )
						// add to document
						.appendTo( this._dragAreaElm );

				}
			}

			function _createScale(scaleData) {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					scaleElm = $create(scaleTemplate).css(vocab.breadth, scaleData.size),
					i = 0,
					points = scaleData.points,
					len = points.length - 1,
					itemStart,
					itemStartPos,
					itemEnd,
					itemLength,
					itemContext;

				scaleElm[0].id = scaleData.opts.id || "";
				scaleElm[0].className += " " + (scaleData.opts.className || "");

				// loop though points
				for (; i < len; i++) {
					itemStart = points[i].valueOf();
					itemEnd = points[i+1].valueOf();

					// get pixel positions
					itemStartPos = _valToPos.call(this, itemStart);
					itemLength = _valToPos.call(this, itemEnd) - itemStartPos;

					// create template data object
					itemContext = {
						start: points[i],
						end: points[i+1]
					}

					// create our item
					$create(scaleItemTemplate)
						.append( _buildFromTemplate.call(itemContext, scaleData.template).addClass('timetable-itemContent') )
						.css(vocab.pos, itemStartPos)
						.css(vocab.length, itemLength)
						.appendTo(scaleElm);
				}

				return scaleElm;
			}

			function _drawScales() {
				var timetable = this._timetable,
					i = timetable._primaryScales.length,
					largestIndex;

				this._primaryScaleElms = [];
				this._secondaryScaleElms = [];

				// beginning scales
				while (i--) {
					this._primaryScaleElms[i] = _createScale.call(this, timetable._primaryScales[i]).addClass("timetable-scalePrimary").appendTo(this._dragAreaElm);
				}
				// end scales
				i = timetable._secondaryScales.length;
				largestIndex = i - 1;
				while (i--) {
					// add them to the elms array in reverse
					this._secondaryScaleElms[largestIndex - i] = _createScale.call(this, timetable._secondaryScales[i]).addClass("timetable-scaleSecondary").appendTo(this._dragAreaElm);
				}
			}

			// add a css rule to the page
			function _setStyle(selector, style) {
				$create('<style type="text/css">' + selector + " { " + style + ' } </style>').appendTo("head");
			}

			function _drawScrollbars() {
				// TODO: make these optional and based on API
				var timetable = this._timetable,
					primary = timetable._primaryScrollbar,
					secondary = timetable._secondaryScrollbar;

				// we need to show / hide the scrollbar elm because IE threw its toys out of the pram
				if (primary) {
					this._scrollbar1Elm.css("display", "block");
					this._scrollbar1 = new TimetableScrollbar(this, this._scrollbar1Elm, primary);
				}
				this._scrollbar1Elm.css("display", primary ? "block" : "");
				if (secondary) {
					this._scrollbar2Elm.css("display", "block");
					this._scrollbar2 = new TimetableScrollbar(this, this._scrollbar2Elm, secondary);
				}
				this._scrollbar2Elm.css("display", secondary ? "block" : "");
			}

			function _setDraggableSizes() {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					dragAreaSize,
					dragRangeSize;

				// size draggable & drag range
				dragAreaSize = _valToPos.call(this, timetable.end);
				dragRangeSize = (dragAreaSize * 2) - this._viewSize;
				// vocab.length is width / height
				this._dragAreaElm[vocab.length](dragAreaSize);
				this._dragRangeElm[vocab.length](dragRangeSize).css("margin-" + vocab.pos, - dragAreaSize + this._viewSize);
			}

			function _calculateScale() {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable);

				// vocab.length is width / height
				this._viewSize = this._innerViewElm[vocab.length]();
				/**
				@name glow.widgets.Timetable.View#scale
				@private
				@type Number
				@description The units per pixel scale of the Timetable
				*/
				this.scale = (timetable._viewEnd - timetable._viewStart) / this._viewSize;
			}

			function _initDraggable() {
				var timetable = this._timetable,
					vocab = getVocab.call(timetable),
					that = this;

				this._draggable = new glow.dragdrop.Draggable(this._dragAreaElm, {
					axis: vocab.dragAxis,
					container: this._dragRangeElm,
					placeholder: "none",
					onDrag: function() {
						// we need to distinguish between a drag and a click
						that._cancelNextItemClick = false;
						that._clickStart = 0;
						// listen for mouse moving
						that._mouseMoveListener = $listen(document, "mousemove", _mouseMoveDuringTimetableDrag, that);
						// TODO, make this cancelable
						_moveStart.call(that);
						_clearItemHiding.call(that);

					},
					onDrop: function() {
						_moveStop.call(that);
						_moved.call(that);
						// remove mouse move listener
						that._mouseMoveListener && glow.events.removeListener(that._mouseMoveListener);
					}
				});
			}

			function _hideOutOfView () {

				var timetable = this._timetable,
					tracks = timetable.tracks,
					numTracks = tracks.length,
					inCurrentView = this._inCurrentView,
					innerViewElm = this._innerViewElm,
					newView = null,
					viewRange = timetable.viewRange(),
					viewStart = viewRange.start,
					viewEnd = viewRange.end,
					id = "",
					i = 0,
					l = 0;

				if(inCurrentView == null) {
					innerViewElm.addClass("timetable-hideitems");
					this._inCurrentView = inCurrentView = {};
				}

				for(id in inCurrentView) {
					if(!inCurrentView[id].inRange(viewStart, viewEnd)) {
						delete inCurrentView[id];
						$(id).css("display", "");
					}
				}

				for(j = 0; j < numTracks; j++) {

					newView = tracks[j].itemsInRange(viewStart, viewEnd)

					for(i = 0, l = newView.length; i < l; i++) {
						id = newView[i].id;

						if(!inCurrentView[id]) {
							inCurrentView[id] = newView[i];
							$("#" + id).css("display", "block");
						}
					}
				}
			}

			function _clearItemHiding() {
				for(id in this._inCurrentView) {
					$("#" + id).css("display", "");
				}
				this._inCurrentView = null;
				this._innerViewElm.removeClass("timetable-hideitems");
			}



			function _createHiddenNavSelect() {
				var timetable = this._timetable,
					spec = timetable._primaryScales[0] || timetable._secondaryScales[0] || timetable._primaryScrollbar || timetable._secondaryScrollbar;

				if(spec) {
					var points = spec.points,
						entries = [],
						len = points.length - 1,
						itemContext,
						i = 0,
						that = this,
						lastViewStart = timetable.end - timetable._viewWindowSize,
						startOption = '<option value="' + timetable.start.valueOf() + '">' + this._locale.ACCESSIBILITY_MENU_START + '</option>',
						endOption = '<option value="' + lastViewStart.valueOf() + '">' + this._locale.ACCESSIBILITY_MENU_END + '</option>';

					for(; i < len; i++) {
						itemContext = {
							start: points[i],
							end: points[i + 1]
						}
						if ((itemContext.start >= timetable.start) && (itemContext.start <= lastViewStart)) {
							entries[i] = '<option value="' + points[i].valueOf() + '">' + _buildFromTemplate.call(itemContext, spec.template).text() + '</option>';
							if (itemContext.start.valueOf() == timetable.start.valueOf()) {
								startOption = '';
							}
							if (itemContext.start.valueOf() == lastViewStart.valueOf()) {
								endOption = '';
							}
						}
					}
					var select = this._accessibiltySelect = $dom.create('<select>' + startOption + entries.join('') + endOption + '</select>');

					$listen(select, "change", function() {
						that._timetable.currentPosition(select.val() * 1);
						_hideOutOfView.call(that);
					});
					this._accessibiltyElm.append(select);
					_updateHiddenNavSelect.call(this);
				}
			}



			function _updateHiddenNavSelect() {

				if(this._accessibiltySelect) {
					var currentPos = this.currentPosition(),
						selectOptions = this._accessibiltySelect[0].options,
						i = 0,
						len = selectOptions.length,
						val = selectOptions[i].value * 1,
						tmp;

					for (; i < len; i++) {
						tmp = selectOptions[i].value * 1;
						if(tmp <= (currentPos + this.scale)) val = tmp; // add scale to allow for rounding errors
					}
					this._accessibiltySelect.val(val);
				}
			}



			View = function (timetable) {
				var vocab = getVocab.call(timetable),
					that = this;

				// storage for determining event firing
				this._cancelNextItemClick = false;
				this._posBeforeMove = timetable.currentPosition();

				this._timetable = timetable;

				this._headers = {};
				this._footers = {};

				this._inCurrentView = null;

				this._locale = $i18n.getLocaleModule("GLOW_WIDGETS_TIMETABLE");

				/**
				@name glow.widgets.Timetable.View#tracks
				@private
				@type Object
				@description A NodeList of a rendered track, indexed by ID
				*/
				this.tracks = {};
				/**
				@name glow.widgets.Timetable.View#items
				@private
				@type Object
				@description A NodeList of a rendered item, indexed by ID
				*/
				this.items = {};
				/**
				@name glow.widgets.Timetable.View#itemContent
				@private
				@type Object
				@description A NodeList of a rendered item's content, indexed by ID
				*/
				this.itemContent = {};
				/**
				@name glow.widgets.Timetable.View#itemInstance
				@private
				@type Object
				@description Instance of an item, indexed by ID
				*/
				// TODO: should this be outside the view, perhaps a getItemById function on timetable?
				this.itemInstance = {};

				/**
				@name glow.widgets.Timetable.View#element
				@private
				@type glow.dom.NodeList
				@description Outer element
				*/
				// init html interface and apply and class names we need
				this.element = $dom.create(containerTemplate, {interpolate: this._locale}).attr("id", timetable.id);
				this.element[0].className = timetable._opts.className;

				this.element.addClass(vocab.rootClass);


				// get hold of the elements we need
				this._headerElm = this.element.get("div.timetable-track-headers");

				this._footerElm = this.element.get("div.timetable-track-footers");

				this._accessibiltyElm = this.element.get("div.timetable-accessibility-navigation");

				this._stateElm = this.element.get("div.timetable-state");
				this._themeElm = this.element.get("div.timetable-theme");
				this._innerViewElm = this.element.get("div.timetable-innerView");
				this._dragRangeElm = this.element.get("div.timetable-dragRange");
				this._dragAreaElm = this.element.get("div.timetable-dragArea");
				this._scrollbar1Elm = this.element.get("div.timetable-scrollbar1");
				this._scrollbar2Elm = this.element.get("div.timetable-scrollbar2");

				// apply theme class
				this._themeElm.addClass(
					"timetable-" + timetable._opts.theme
				);

				// set a private var for elements that are half in view at the start of the view
				// set and used by _adjustContentPosition
				this._itemsHangingOffStart = new $dom.NodeList();
				this._itemContentHangingOffStart = new $dom.NodeList();

				// listen for clicks within the drag area
				$listen(this._dragAreaElm, "click", _dragAreaClicked, this);

			};

			View.prototype = {
				/**
				@name glow.widgets.Timetable.View#draw
				@private
				@function
				@description Draw the timetable's tracks and items

				@param {Boolean} [redraw=false] Redraw items that have already been drawn

				@returns this
				*/
				draw: function(redraw) {
					var timetable = this._timetable,
						vocab = getVocab.call(timetable),
						calculatedViewSize = timetable.size,
						tracks = timetable.tracks,
						len = tracks.length,
						startPosition,
						i = 0;

					if (!this._drawn) { // first draw
						// empty the container, add element to page
						this.element.appendTo( timetable._container.empty() );
						// init draggable
						_initDraggable.call(this);
					}

					if (redraw) {
						// capture the current position
						startPosition = timetable.currentPosition();
						// if redraw is true, trash our 'drawn' registry and empty our view
						this.tracks = {};
						this.items = {};
						this.itemContent = {};
						this.itemInstance = {};
						// clear all items
						this._dragAreaElm.empty();
						// destroy scrollbars
						this._scrollbar1Elm.empty();
						this._scrollbar2Elm.empty();
						// get rid of headers and footers
						this._headerElm.empty();
						this._footerElm.empty();
						// empty hidden a11y nav
						this._accessibiltyElm.empty();
						this._headers = {};
						this._footers = {};
					}

					if (redraw || !this._drawn) {
						this._innerViewElm[vocab.length]( calculatedViewSize );
						_calculateScale.call(this);
						_drawBanding.call(this);
						_drawScrollbars.call(this);
						_setDraggableSizes.call(this);
						_drawScales.call(this);
						_createHiddenNavSelect.call(this);
						// set start position
						_moveToPosition.call(this, startPosition || timetable._viewStart);

					}

					// loop over tracks
					for (i = 0; i < len; i++) {
						_drawTrack.call(this, tracks[i]);
					}

					// set up the width of the tracks (and scales)
					_positionTracks.call(this);
					_adjustContentPosition.call(this);

					this._drawn = true;

					return this;
				},
				/**
				@name glow.widgets.Timetable.View#currentPosition
				@private
				@function
				@description Get or sets the

				@param {Number | Date} [val] Value to move to. Omit to get the current value

				@returns Number for getting, 'this' when setting.
				*/
				currentPosition: function(val) {
					var vocab = getVocab.call(this._timetable);

					if (val === undefined) { // getting
						return _posToVal.call( this, -parseInt(this._dragAreaElm[0].style[vocab.pos]) );
					} else { // setting
						_clearItemHiding.call(this);

						_moveToPosition.call(this, val);
						_moved.call(this);
						return this;
					}
				},



				hide : function () {

					_hideOutOfView.call(this);

				},

				clear : function () {

					_clearItemHiding.call(this);

				}
			};

			var TimetableScrollbar;

			(function() {
				var scrollbarNum = 0;

				function _scrollbarChange() {
					if (this._ignoreChange) {
						return;
					}
					// update UI
					_moveToPosition.call( this._timetable._view, (this._timetable._opts.vertical ? -1 : 1) * this.slider.val() );

					if (!this._isDraggingChange) {
						_moved.call(this._timetable._view);
					}
				}

				// called when a dragging action start
				function _scrollbarMoveStart() {
					_clearItemHiding.call(this._timetable._view)
					// we use this to tell if a change is a dragging change or set programmatically
					this._isDraggingChange = true;
					_moveStart.call(this._timetable._view);
				}

				// called when a dragging action stops
				function _scrollbarMoveStop() {
					this._isDraggingChange = false;
					_moveStop.call(this._timetable._view);
					_moved.call(this._timetable._view);
				}

				function _positionHighlight() {
					var timetable = this._timetable,
						vocab = getVocab.call(timetable),
						pos = parseInt( this._sliderHandle[0].style[vocab.pos] );

					if (this._timetable._opts.vertical) {
						this._labelsHighlight[0].style.clip = 'rect(' + pos + 'px, auto, ' + (pos + this._handleLength) + 'px, auto)';
					} else {
						this._labelsHighlight[0].style.clip = 'rect(auto, ' + (pos + this._handleLength) + 'px, auto, ' + pos + 'px)';
					}
				}

				// TODO, document this properly
				TimetableScrollbar = function(view, container, scaleData) {
					var timetable = view._timetable,
						vocab = getVocab.call(timetable),
						i = 0,
						points = scaleData.points,
						len = points.length - 1,
						itemStart,
						itemStartPos,
						itemEnd,
						itemLength,
						itemContext,
						labels = $create('<div class="timetable-scrollbarLabels"></div>'),
						id = glow.UID + "scrollbar" + (scrollbarNum++),
						sliderTrack,
						viewSize = timetable._viewEnd - timetable._viewStart,
						timetableSize = timetable.end - timetable.start,
						min,
						max,
						val,
						viewStart = timetable.viewRange().start;

					this._timetable = timetable;

					// set the size of the handle
					_setStyle(
						"#" + id + " .slider-handle",
						vocab.length + ":" + (viewSize/timetableSize)*100 + "%"
					);

					if (timetable._opts.vertical) {
						min = -timetable.end + viewSize;
						max = -timetable.start;
						val = -viewStart;
					} else {
						min = timetable.start-0;
						max = timetable.end - viewSize;
						val = viewStart;
					}

					// we use negative values for min & max for vertical sliders so the 'min' value is at the top (we flip it round later)
					this.slider = new glow.widgets.Slider(container, {
						// we use negative min & maxv values if we're vertical, so the larger abs value is at the bottom
						min: min,
						max: max,
						vertical: timetable._opts.vertical,
						className: "timetable-scrollbar",
						id: id,
						val: val,
						size: view._innerViewElm[vocab.length](),
						step: 0,
						changeOnDrag: true
					});

					sliderTrack = this.slider.element.get("div.slider-track");
					// having to set this for IE6, thanks IE.
					if (timetable._opts.vertical) {
						sliderTrack.css(vocab.length, sliderTrack.get("div.slider-trackOn").css(vocab.length));
					}

					this.slider.element.get("div.slider-btn-bk, div.slider-btn-fwd").push(sliderTrack).css(vocab.breadth, scaleData.size);
					// work out the scale to use
					this.scale = (timetableSize) / sliderTrack[vocab.length]();


					// loop though points top create labels
					for (; i < len; i++) {
						itemStart = points[i].valueOf();
						itemEnd = points[i+1].valueOf();


						// get pixel positions
						itemStartPos = _valToPos.call(this, itemStart);
						itemLength = _valToPos.call(this, itemEnd) - itemStartPos;


						// create template data object
						itemContext = {
							start: points[i],
							end: points[i+1]
						}


						// create our item
						$dom.create('<div class="timetable-scrollbarItem"></div>')
							.append( _buildFromTemplate.call(itemContext, scaleData.template).addClass('timetable-itemContent') )
							.css(vocab.pos, itemStartPos)
							.css(vocab.length, itemLength)
							.appendTo(labels);
					}

					// create highlighted labels
					this._labelsHighlight = labels.clone().addClass("timetable-scrollbarLabelsHighlight");

					// listen for events
					$listen(this.slider, "change", _scrollbarChange, this);
					$listen(this.slider, "slideStart", _scrollbarMoveStart, this);
					$listen(this.slider, "slideStop", _scrollbarMoveStop, this);

					sliderTrack.prepend(labels).prepend(this._labelsHighlight);
					this._sliderHandle = this.slider.element.get("div.slider-handle");
					this._handleLength = this._sliderHandle[vocab.length]();

					_positionHighlight.call(this);
				};

				TimetableScrollbar.prototype = {
					// update the interface of the scrollbar for a particular value
					moveToPosition: function(val) {
						this._ignoreChange = true;
						this.slider.val( (this._timetable._opts.vertical ? -1 : 1) * val );
						this._ignoreChange = false;
						_positionHighlight.call(this);
					}
				};
			})();
		})();
	}
});
/*@end @*/
