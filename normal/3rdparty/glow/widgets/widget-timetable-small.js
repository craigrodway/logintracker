(window.gloader||glow).module({name:"glow.widgets",library:["glow","1.7.3"],depends:[["glow","1.7.3","glow.dom","glow.events"]],builder:function(p){var K,t,C=p.env;p.ready(function(){K=document;t=K.body;var P=p.dom.create('<div class="glow173-cssTest" style="height:0;position:absolute;visibility:hidden;top:-20px;display:block"></div>').appendTo(t);if(P.css("visibility")!="hidden")t.className+=" glow173-basic";else{p._addReadyBlock("glow_widgetsCSS");(function(){if(P.css("z-index")!="1234")setTimeout(arguments.callee,
10);else{p._removeReadyBlock("glow_widgetsCSS");if(P.css("background-image").indexOf("ctr.png")==-1)t.className+=" glow173-basic"}})()}C.ie&&(t.className+=" glow173-ie");(C.ie<7||!C.standardsMode)&&(t.className+=" glow173-ielt7");C.gecko&&(t.className+=" glow173-gecko")});p.widgets={_scrollPos:function(){var P=window,X=C.standardsMode?K.documentElement:t;return{x:X.scrollLeft||P.pageXOffset||0,y:X.scrollTop||P.pageYOffset||0}}}}});
(window.gloader||glow).module({name:"glow.widgets.Slider",library:["glow","1.7.3"],depends:[["glow","1.7.3","glow.dom","glow.events","glow.dragdrop","glow.anim","glow.widgets"]],builder:function(p){function K(){for(var b=0,e=arguments.length,a,c;!(a=arguments[b++])&&b<e;);for(;b<e;b++)if(c=arguments[b])for(;;){a%=c;if(!a){a=c;break}c%=a;if(!c)break}return a}function t(b){return ia[!!b._opts.vertical*1]}function C(b){var e=t(b);b[e.trackToChange][0].style[e.length]=parseInt(b._handleElm[0].style[e.pos])+
b._handleSize/2+"px"}function P(){C(this);if(this._opts.changeOnDrag){var b=Q(this);L(this,b);(this._boundInput[0]||{}).value=b}}function X(b){t(this);var e=this,a;if(R=="prevented")return false;else if(R!=b.key){if(!R&&$(this).defaultPrevented()){R="prevented";return false}a=b.key=="UP"||b.key=="RIGHT"?1:-1;clearInterval(aa);aa=setTimeout(function(){aa=setInterval(function(){ba(e,a)},40)},500);ba(e,a);R=b.key}return false}function Y(b){if(R==b.key){R=null;clearInterval(aa);y(this)}}function ga(b){if(!this._disabled&&
!$(this).defaultPrevented()){var e=b.attachedTo.className.indexOf("-fwd")!=-1?1:-1,a=this;ba(this,e);F=setTimeout(function(){F=setInterval(function(){ba(a,e)},40)},500)}return false}function da(){if(F){clearTimeout(F);clearInterval(F);F=null;y(this)}return false}function ba(b,e){b._nudgeVal=T(b,b._nudgeVal+(b._opts.step||1/b._pixelsPerVal)*e);fa(b,b._nudgeVal);if(b._opts.changeOnDrag){L(b,b._nudgeVal);(b._boundInput[0]||{}).value=b._val}}function fa(b,e){var a=t(b);e=e===undefined?b._val:e;b._handleElm[0].style[a.pos]=
(b._opts.vertical?(b._opts.max-e)*b._pixelsPerVal:(e-b._opts.min)*b._pixelsPerVal)+"px";C(b)}function Q(b){var e=t(b);e=parseInt(b._handleElm[0].style[e.pos]);e=b._opts.vertical?b._trackSize-b._handleSize-e:e;e=e/b._pixelsPerVal+b._opts.min;return T(b,e)}function T(b,e){var a=b._opts.step,c=b._opts.min,g=b._opts.max;e=Number(e)||0;if(e<c)return c;if(e>g)return g-(g-c)%(a||1);if(a===0)return e;return Math.round((e-c)/a)*a+c}function L(b,e){var a=b._val;e=e===undefined?Q(b):e;b.element.attr("aria-valuenow",
e);b._val=e;e!=a&&w.fire(b,"change")}function $(b){b._valBeforeSlide=b._nudgeVal=b._val;return w.fire(b,"slideStart")}function y(b){var e={initialVal:b._valBeforeSlide,currentVal:Q(b)};if(w.fire(b,"slideStop",e).defaultPrevented()){L(b,b._valBeforeSlide);b.val(b._valBeforeSlide)}else{L(b,e.currentVal);if(b._opts.snapOnDrop)b.val(e.currentVal);else(b._boundInput[0]||{}).value=e.currentVal}}function S(b,e){var a=b._opts,c=t(b),g=b.element,f,r,l,x,q=K(a.step*a.snapOnDrag,a.tickMinor,a.tickMajor);if(a.vertical){f=
g.height();b._trackOnElm.height(a.size-f)}else g.width(a.size);b._trackSize=b._trackElm[c.length]();f=b._handleElm[0].style[c.length];if(p.env.ie<8){b._handleElm[0].style[c.length]=b._handleElm[0].currentStyle[c.length];b._handleElm[0].style[c.length]=b._handleElm[0].style["pixel"+c.lengthUpper]}b._handleSize=b._handleElm[0]["offset"+c.lengthUpper];b._handleElm[0].style[c.length]=f;r=a.val!=undefined?a.val:b._boundInput[0]&&b._boundInput[0].value!=""?b._boundInput[0].value:a.min;if(q){f=(b._trackSize-
b._handleSize)/(a.max-a.min)*q;f=Math.floor(f)/q*(a.max-a.min)+b._handleSize;if(a.vertical){b._trackOnElm.height(f);e&&e.element.height(f-b._handleSize)}else g.width(a.size-(b._trackSize-f));b._trackSize=b._trackElm[c.length]()}b._pixelsPerVal=(b._trackSize-b._handleSize)/(a.max-a.min);b.val(r);g.attr({"aria-valuenow":b._val,"aria-valuemin":a.min,"aria-valuemax":a.max});c={axis:c.axis,container:b._trackElm,onDrag:function(){if(b._disabled||$(b).defaultPrevented())return false;b._stateElm.addClass("slider-active");
l=w.addListener(document,"mousemove",P,b)},onDrop:function(){b._stateElm.removeClass("slider-active");w.removeListener(l);y(b)}};if(a.snapOnDrag)c.step=b._pixelsPerVal*a.step;x=new p.dragdrop.Draggable(b._handleElm,c);a.jumpOnClick&&w.addListener(b._trackElm,"mousedown",function(G){if(!(b._disabled||G.source==b._handleElm[0])){var U=t(b),H=G[U.pagePos];G[U.pagePos]=b._handleElm.offset()[U.pos]+b._handleSize/2;if(x._startDragMouse.call(x,G)===false){G[U.pagePos]=H;x._dragMouse.call(x,G);C(b);return false}}})}
var V=p.dom.get,w=p.events,E,W=["slideStart","slideStop","change"],R=null,F,aa;navigator.platform.slice(0,3);var ia=[{containerClassNamePart:"slider",length:"width",lengthUpper:"Width",pos:"left",trackToChange:"_trackOnElm",axis:"x",pagePos:"pageX"},{containerClassNamePart:"vSlider",length:"height",lengthUpper:"Height",pos:"top",trackToChange:"_trackOffElm",axis:"y",pagePos:"pageY"}];(function(){var b=[{containerClassNamePart:"ruler",length:"width",pos:"left"},{containerClassNamePart:"vRuler",length:"height",
pos:"top"}];E=function(e,a){e=V(e);a=p.lang.apply({size:300,min:0,max:100},a);var c=b[!!a.vertical*1],g=p.dom.create('<div class="ruler-tickMajor"></div>'),f=p.dom.create('<div class="ruler-tickMinor"></div>'),r=p.dom.create('<div class="ruler-label"><span></span></div>'),l=Number(a.labels),x=K(a.tickMajor,a.tickMinor,l),q,G=a.reverse,U=a.max-a.min,H,Z,ca,I=a.min;this.element=H=p.dom.create('<div role="presentation" class="glow173-'+c.containerClassNamePart+'"><div class="ruler-spacer"></div><div class="ruler-labels"></div></div>');
Z=H.get("div.ruler-labels");H[0].id=a.id||"";for(H[0].className+=" "+(a.className||"");I<=a.max;I+=x){q=(I-a.min)/U*100;q=G?100-q:q;if(a.tickMajor&&!((I-a.min)%a.tickMajor))g.clone().css(c.pos,q+"%").appendTo(H);else a.tickMinor&&!((I-a.min)%a.tickMinor)&&f.clone().css(c.pos,q+"%").appendTo(H);if(l&&!((I-a.min)%l)){q=r.clone().css(c.pos,q+"%");q[0]._labelVal=I;q.get("span").html(a.labelMapper?a.labelMapper(I):I);Z.append(q)}}if(!l)for(ca in a.labels){q=(Number(ca)-a.min)/U*100;q=G?100-q:q;if(q<=100){q=
r.clone().css(c.pos,q+"%");q[0]._labelVal=Number(ca);q.get("span").html(a.labelMapper?a.labelMapper(a.labels[ca]):a.labels[ca]);Z.append(q)}}e.append(H)}})();(p.widgets.Slider=function(b,e){this._disabled=false;b=V(b);this._opts=e=p.lang.apply({min:0,max:100,step:1,theme:"light",jumpOnClick:1,buttons:1,size:300},e);var a,c,g=t(this),f=this,r;K(e.step*e.snapOnDrag,e.tickMinor,e.tickMajor);for(a=W.length;a--;){c="on"+W[a].charAt(0).toUpperCase()+W[a].slice(1);e[c]&&w.addListener(this,W[a],e[c])}this._boundInput=
e.bindTo?V(e.bindTo):new p.dom.NodeList;this.element=a=p.dom.create('<div class="glow173-'+g.containerClassNamePart+'" tabindex="0" role="slider" aria-disabled="false"><div class="slider-theme"><div class="slider-state"><div class="slider-container"><div class="slider-btn-bk"></div><div class="slider-track"><div class="slider-trackOn"></div><div class="slider-trackOff"></div><div class="slider-handle"></div></div><div class="slider-labels"></div><div class="slider-btn-fwd"></div></div></div></div></div>');
this._trackElm=a.get("div.slider-track");this._trackOnElm=a.get("div.slider-trackOn");this._trackOffElm=a.get("div.slider-trackOff");this._handleElm=this._trackElm.get("div.slider-handle");this._stateElm=a.get("div.slider-state");a.get("div.slider-theme").addClass("slider-"+e.theme);!e.buttons&&this._stateElm.addClass("slider-noButtons");a[0].id=e.id||"";a[0].className+=" "+(e.className||"");if(e.tickMajor||e.tickMinor||e.labels){e.reverse=e.vertical;r=new E(a.get("div.slider-labels"),e)}this.element.appendTo(b);
S(this,r);this._boundInput[0]&&w.addListener(this._boundInput,"change",function(){var l=T(f,this.value);L(f,l);f.val(l)});w.addListener(this.element,"focus",function(){f._disabled||f._stateElm.addClass("slider-active")});w.addListener(this.element,"blur",function(){f._stateElm.removeClass("slider-active")});w.addListener(this.element,"keydown",function(l){if(!f._disabled)switch(l.key){case "UP":case "RIGHT":case "DOWN":case "LEFT":return X.call(f,l)}});w.addListener(this.element,"keyup",function(l){if(!f._disabled)switch(l.key){case "UP":case "RIGHT":case "DOWN":case "LEFT":return Y.call(f,
l)}});w.addListener(this.element,"keypress",function(l){if(!f._disabled)switch(l.key){case "UP":case "RIGHT":case "DOWN":case "LEFT":return false}});a=this.element.get(".slider-btn-fwd, .slider-btn-bk");w.addListener(a,"mousedown",ga,this);w.addListener(a,"mouseup",da,this);w.addListener(a,"mouseout",da,this);r&&w.addListener(r.element,"mousedown",function(l){if(!f._disabled)for(l=V(l.source);l[0]!=r.element[0];){if(l.hasClass("ruler-label")){l=T(f,l[0]._labelVal);L(f,l);f.val(l);return false}l=l.parent()}})}).prototype=
{disabled:function(b){if(b!==undefined){this._disabled=b=!!b;this.element.attr("aria-disabled",b);this._stateElm[b?"addClass":"removeClass"]("slider-disabled");(this._boundInput[0]||{}).disabled=b;return this}else return this._disabled},val:function(b){if(b!=undefined){this._val=T(this,b);this.element.attr("aria-valuenow",this._val);(this._boundInput[0]||{}).value=this._val;fa(this);return this}else return this._val},valToLabel:function(b){if(b===undefined)b=this._val;var e=this._opts.labels,a=Infinity,
c=Infinity,g,f,r;if(e===undefined)return null;if(typeof e=="number")return Math.round(b/e)*e;if(e[b])return e[b];for(r in e){f=Math.abs(Number(r)-b);if(f<c){c=f;a=Number(r)-b;g=e[r]}else if(f==c)if(a<0){c=f;a=Number(r)-b;g=e[r]}}return g},labelToVal:function(b){var e,a=this._opts.labels;if(a===undefined)return null;if(typeof a=="number"){b=Number(b);if(!(Number(b)%a)&&!isNaN(b))return b;return null}for(e in a)if(b==a[e])return Number(e);return null}}}});
(window.gloader||glow).module({name:"glow.widgets.Timetable",library:["glow","1.7.3"],depends:[["glow","1.7.3","glow.dom","glow.events","glow.widgets","glow.widgets.Slider","glow.dragdrop","glow.i18n"]],builder:function(p){function K(){return p.UID+"TimetableWidget"+ia++}function t(){return b[!!this._opts.vertical*1]}function C(a){return function(c){return c instanceof Date?new Date(c.getTime()+a):c+a}}function P(a){switch(a){case "am/pm":return C(432E5);case "hour":return C(36E5);case "day":return C(864E5);
case "week":return C(6048E5);case "month":return function(c){c=new Date(c);c.setMonth(c.getMonth()+1);return c};case "year":return function(c){c=new Date(c);c.setFullYear(c.getFullYear()+1);return c};default:if(a instanceof Function)return a;else if(isNaN(a))throw Error("Can't create incrementer");else return C(parseInt(a))}}function X(a,c,g,f){if(a instanceof Array){if(!this.numerical)return p.lang.map(a,function(x){return new Date(x)});return a}var r=1,l=P(a);if(c=="auto"){c={"am/pm":432E5,hour:36E5,
day:864E5};switch(a){case "am/pm":case "hour":case "day":g=new Date(c[a]*Math.floor(g.valueOf()/c[a]));break;case "week":g=new Date(g);g.setHours(0,0,0,0);g.setDate(g.getDate()-g.getDay());break;case "month":g=new Date(g);g.setHours(0,0,0,0);g.setDate(1);break;case "year":g=new Date(g);g.setHours(0,0,0,0);g.setMonth(0,1);break;default:g=g}}else g=c||g;for(a=[g];g<f;){g=l(g);a[r++]=g}return a}function Y(a){if(a==undefined)return null;a=a instanceof y.NodeList?a:a instanceof Function?a(this):R.interpolate(""+
a,this);return a instanceof y.NodeList?y.create("<div></div>").append(a):y.create("<div>"+a+"</div>")}function ga(a,c,g,f,r,l){this._opts=l=F({vertical:true,tracks:[],collapseItemBorders:true,collapseTrackBorders:false,keepItemContentInView:true,className:"",theme:"light"},l||{});var x=t.call(this);this._container=S(a);if(!this._container[0])throw Error("Could not find container for Timetable");this.id=l.id||K();this.size=l.size||this._container[x.length]();this.numerical=typeof c=="number";this.start=
c;this.end=g;this._viewStart=f;this._viewEnd=r;if(!this.numerical){this.start=new Date(c);this.end=new Date(g);this._viewStart=new Date(f);this._viewEnd=new Date(r)}this._viewWindowSize=this._viewEnd-this._viewStart;this.tracks=[];a=0;for(c=l.tracks.length;a<c;a++)this.addTrack.apply(this,l.tracks[a]);l.onChange&&E(this,"change",l.onChange);l.onItemClick&&E(this,"itemClick",l.onItemClick);l.onMoveStart&&E(this,"moveStart",l.onMoveStart);l.onMoveStop&&E(this,"moveStop",l.onMoveStop);this._view=new e(this);
this._banding=[];this._primaryScales=[];this._secondaryScales=[];this._secondaryScrollbar=this._primaryScrollbar=null}function da(a,c,g,f){this._opts=f=F({className:""},f||{});this.disabled=f.disabled||false;this.data=f.data||{};this.title=c;this.size=g;this.timetable=a;this.id=f.id||K();this.items=[];if(f.items!=undefined){a=0;for(c=f.items.length;a<c;a++)ba.apply(this,f.items[a]);this.items.sort(fa)}}function ba(a,c,g,f){return this.items[this.items.length]=new $(this,a,c,g,f)}function fa(a,c){return a.start-
c.start||a._addIndex-c._addIndex}function Q(a,c,g){if(typeof a=="number"!==this.timetable.numerical)throw Error("Cannot get Item(s) - point(s) not in the correct scale type.");var f=this.items,r={items:[],indices:[]},l=0;if(!this.timetable.numerical){a=new Date(a);c=new Date(c)}for(var x=0,q=f.length;x<q;x++){if(f[x].start>c)break;if(g.call(f[x],a,c)){r.items[l]=f[x];r.indices[l]=x;l++}}return r}function T(a,c){return this.start<c&&this.end>a}function L(a){return this.start<=a&&this.end>a}function $(a,
c,g,f,r){this._addIndex=a.items.length;this._opts=r=F({className:""},r||{});if(typeof g=="number"!==a.timetable.numerical)throw Error("Item scale type does not match Timetable.");this.data=r.data||{};this.title=c;this.start=g;this.end=f;if(!a.timetable.numerical){this.start=new Date(g);this.end=new Date(f)}this.track=a;this.id=r.id||K()}var y=p.dom,S=y.get,V=y.create,w=p.events,E=w.addListener,W=w.fire,R=p.lang,F=R.apply,aa=p.i18n,ia=0,b=[{length:"width",breadth:"height",rootClass:"glow173-Timetable",
dragAxis:"x",pos:"left",posOpposite:"right",otherPos:"top",otherPosOpposite:"bottom"},{length:"height",breadth:"width",rootClass:"glow173-vTimetable",dragAxis:"y",pos:"top",posOpposite:"bottom",otherPos:"left",otherPosOpposite:"right"}];aa.addLocaleModule("GLOW_WIDGETS_TIMETABLE","en",{ACCESSIBILITY_MENU_START:"Start",ACCESSIBILITY_MENU_END:"End",ACCESSIBILITY_INTRO:"Use this menu to choose what section of the timetable to view.",SKIPLINK_TO_TRACK:"skip to track data",SKIPLINK_BACK_TO_HEADERS:"back to track headers"});
ga.prototype={addTrack:function(a,c,g){return this.tracks[this.tracks.length]=new da(this,a,c,g)},currentPosition:function(a){if(a===undefined){a=this._view?this._view.currentPosition():this._viewStart;this.numerical||(a=new Date(a));return a}else{this.numerical||(a=new Date(a));this._view.currentPosition(a);return this}},viewRange:function(a){var c=this._viewEnd-this._viewStart,g=this.currentPosition();c={start:g,end:g.valueOf()+c};if(!this.numerical)c.end=new Date(c.end);if(a){this._viewStart=a.start||
c.start;this._viewEnd=a.end||c.end;if(!this.numerical){this._viewStart=new Date(this._viewStart);this._viewEnd=new Date(this._viewEnd)}if(this._viewStart<this.start)this._viewStart=this.start;if(this._viewEnd>this.end)this._viewEnd=this.end;this._view&&this._view._drawn&&this.draw(true).currentPosition(this._viewStart);return this}else return c},setItemTemplate:function(a){this._opts.itemTemplate=a;return this},setTrackHeaderTemplate:function(a){this._opts.trackHeader=a;return this},setTrackFooterTemplate:function(a){this._opts.trackFooter=
a;return this},setBanding:function(a,c){this._banding=X.call(this,a,(c||{}).start||"auto",this.start,this.end);return this},addScale:function(a,c,g,f){f=f||{};a={template:f.template,size:g,points:X.call(this,a,f.start||"auto",this.start,this.end),opts:f};c=c.toLowerCase();if(c=="both"&&f.id)throw Error("Cannot apply an id when adding to both sides of the timetable");if(c=="top"||c=="left"||c=="both")this._primaryScales[this._primaryScales.length]=a;if(c=="bottom"||c=="right"||c=="both")this._secondaryScales[this._secondaryScales.length]=
a;return this},removeScales:function(a){if(a=="top"||a=="left"||a=="both")this._primaryScales=[];if(a=="bottom"||a=="right"||a=="both")this._secondaryScales=[];return this},addScrollbar:function(a,c,g,f){f=F({buttons:true},f||{});a={template:f.template,size:g,points:X.call(this,a,f.start||"auto",this.start,this.end),opts:f};c=c.toLowerCase();if(c=="both"&&f.id)throw Error("Cannot apply an id when adding to both sides of the timetable");if(c=="top"||c=="left"||c=="both")this._primaryScrollbar=a;if(c==
"bottom"||c=="right"||c=="both")this._secondaryScrollbar=a;return this},draw:function(a){this._view.draw(a);return this}};da.prototype={toString:function(){return this.title},addItem:function(a,c,g,f){a=ba.call(this,a,c,g,f);this.items.sort(fa);return a},itemAt:function(a){return Q.call(this,a,a,L).items[0]},indexAt:function(a){return Q.call(this,a,a,L).indices[0]},itemsAt:function(a){return Q.call(this,a,a,L).items},indicesAt:function(a){return Q.call(this,a,a,L).indices},itemsInRange:function(a,
c){return Q.call(this,a,c,T).items},indicesInRange:function(a,c){return Q.call(this,a,c,T).indices},setItemTemplate:function(a){this._opts.itemTemplate=a;return this},setTrackHeaderTemplate:function(a){this._opts.trackHeader=a;return this},setTrackFooterTemplate:function(a){this._opts.trackFooter=a;return this},getHeader:function(){return Y.call(this,this._opts.trackHeader||this.timetable._opts.trackHeader)},getFooter:function(){return Y.call(this,this._opts.trackFooter||this.timetable._opts.trackFooter)}};
$.prototype={toString:function(){return this.title},setItemTemplate:function(a){this._opts.itemTemplate=a;return this},getContent:function(){return Y.call(this,this._opts.itemTemplate||this.track._opts.itemTemplate||this.track.timetable._opts.itemTemplate)},inRange:function(a,c){if(!this.track.timetable.numerical){a=new Date(a);c=new Date(c)}return T.call(this,a,c)}};p.widgets.Timetable=ga;p.widgets.Timetable.Track=da;p.widgets.Timetable.Item=$;var e;(function(){function a(d){if(this._clickStart){if(!this._cancelNextItemClick&&
(Math.abs(this._clickStart[0]-d.pageX)>ja||Math.abs(this._clickStart[1]-d.pageY)>ja))this._cancelNextItemClick=true}else this._clickStart=[d.pageX,d.pageY];f.call(this,this.currentPosition())}function c(d){if(this._cancelNextItemClick)return false;for(var h=S(d.source);h[0]!=d.attachedTo;){h.hasClass("timetable-item")&&W(this._timetable,"itemClick",F({item:this.itemInstance[h[0].id]},new w.Event(d)));h=h.parent()}}function g(){W(this._timetable,"moveStart")}function f(d){this._dragAreaElm.css(t.call(this._timetable).pos,
-q.call(this,d));this._scrollbar1&&this._scrollbar1.moveToPosition(d);this._scrollbar2&&this._scrollbar2.moveToPosition(d)}function r(){W(this._timetable,"moveStop")}function l(){x.call(this);var d=this._timetable,h=d.currentPosition();if(h.valueOf()!=this._posBeforeMove.valueOf()){W(d,"change");this._posBeforeMove=h;I.call(this)}}function x(){var d=this._timetable,h=t.call(d),o=0,u=d.tracks.length,n,m,s=d.currentPosition(),i,k=parseInt(this._dragAreaElm[0].style[h.pos]);if(this._timetable._opts.keepItemContentInView){this._itemContentHangingOffStart.css("margin-"+
h.pos,0);this._itemsHangingOffStart.removeClass("timetable-itemHangingClipping")}this._itemsHangingOffStart.removeClass("timetable-itemHangingOffStart");this._itemContentHangingOffStart=new y.NodeList;for(this._itemsHangingOffStart=new y.NodeList;o<u;o++){n=d.tracks[o].itemAt(s);if(!(!n||n.start.valueOf()==s.valueOf())){m=n.id;n=this.itemContent[m];m=this.items[m];this._itemContentHangingOffStart.push(n);this._itemsHangingOffStart.push(m);if(this._timetable._opts.keepItemContentInView){i=parseInt(m[0].style[h.pos]);
i=-k-i;n.css("margin-"+h.pos,i);m[h.length]()<n[h.length]()+i&&m.addClass("timetable-itemHangingClipping")}}}this._itemsHangingOffStart.addClass("timetable-itemHangingOffStart")}function q(d){return(d-this._timetable.start)/this.scale}function G(d){var h=t.call(this._timetable),o=V(ka).css(h.breadth,d.size),u=0,n=d.points,m=n.length-1,s,i,k;o[0].id=d.opts.id||"";for(o[0].className+=" "+(d.opts.className||"");u<m;u++){s=n[u].valueOf();i=n[u+1].valueOf();s=q.call(this,s);i=q.call(this,i)-s;k={start:n[u],
end:n[u+1]};V(la).append(Y.call(k,d.template).addClass("timetable-itemContent")).css(h.pos,s).css(h.length,i).appendTo(o)}return o}function U(){var d=t.call(this._timetable),h=this;this._draggable=new p.dragdrop.Draggable(this._dragAreaElm,{axis:d.dragAxis,container:this._dragRangeElm,placeholder:"none",onDrag:function(){h._cancelNextItemClick=false;h._clickStart=0;h._mouseMoveListener=E(document,"mousemove",a,h);g.call(h);Z.call(h)},onDrop:function(){r.call(h);l.call(h);h._mouseMoveListener&&p.events.removeListener(h._mouseMoveListener)}})}
function H(){var d=this._timetable,h=d.tracks,o=h.length,u=this._inCurrentView,n=this._innerViewElm,m=null;m=d.viewRange();d=m.start;var s=m.end,i="",k=0,v=0;if(u==null){n.addClass("timetable-hideitems");this._inCurrentView=u={}}for(i in u)if(!u[i].inRange(d,s)){delete u[i];S(i).css("display","")}for(j=0;j<o;j++){m=h[j].itemsInRange(d,s);k=0;for(v=m.length;k<v;k++){i=m[k].id;if(!u[i]){u[i]=m[k];S("#"+i).css("display","block")}}}}function Z(){for(id in this._inCurrentView)S("#"+id).css("display","");
this._inCurrentView=null;this._innerViewElm.removeClass("timetable-hideitems")}function ca(){var d=this._timetable,h=d._primaryScales[0]||d._secondaryScales[0]||d._primaryScrollbar||d._secondaryScrollbar;if(h){for(var o=h.points,u=[],n=o.length-1,m,s=0,i=this,k=d.end-d._viewWindowSize,v='<option value="'+d.start.valueOf()+'">'+this._locale.ACCESSIBILITY_MENU_START+"</option>",A='<option value="'+k.valueOf()+'">'+this._locale.ACCESSIBILITY_MENU_END+"</option>";s<n;s++){m={start:o[s],end:o[s+1]};if(m.start>=
d.start&&m.start<=k){u[s]='<option value="'+o[s].valueOf()+'">'+Y.call(m,h.template).text()+"</option>";if(m.start.valueOf()==d.start.valueOf())v="";if(m.start.valueOf()==k.valueOf())A=""}}var D=this._accessibiltySelect=y.create("<select>"+v+u.join("")+A+"</select>");E(D,"change",function(){i._timetable.currentPosition(D.val()*1);H.call(i)});this._accessibiltyElm.append(D);I.call(this)}}function I(){if(this._accessibiltySelect){for(var d=this.currentPosition(),h=this._accessibiltySelect[0].options,
o=0,u=h.length,n=h[o].value*1,m;o<u;o++){m=h[o].value*1;if(m<=d+this.scale)n=m}this._accessibiltySelect.val(n)}}var ma='<div><div class="timetable-theme"><div class="timetable-state"><div class="timetable-container"><div class="timetable-accessibility-navigation">{ACCESSIBILITY_INTRO}</div><div class="timetable-track-headers" role="presentation" id="'+p.UID+'TimetableWidgetHeaders"></div><div class="timetable-scrollView"><div class="timetable-scrollbar1"></div><div class="timetable-innerView"><div class="timetable-dragRange"><div class="timetable-dragArea" aria-live="polite"></div></div></div><div class="timetable-scrollbar2"></div></div><div class="timetable-track-footers" role="presentation" id="'+
p.UID+'TimetableWidgetFooters"></div></div></div></div></div>',ka='<div class="timetable-scale"></div>',la='<div class="timetable-scaleItem"></div>',na=y.create("<div></div>"),ja=10;e=function(d){var h=t.call(d);this._cancelNextItemClick=false;this._posBeforeMove=d.currentPosition();this._timetable=d;this._headers={};this._footers={};this._inCurrentView=null;this._locale=aa.getLocaleModule("GLOW_WIDGETS_TIMETABLE");this.tracks={};this.items={};this.itemContent={};this.itemInstance={};this.element=
y.create(ma,{interpolate:this._locale}).attr("id",d.id);this.element[0].className=d._opts.className;this.element.addClass(h.rootClass);this._headerElm=this.element.get("div.timetable-track-headers");this._footerElm=this.element.get("div.timetable-track-footers");this._accessibiltyElm=this.element.get("div.timetable-accessibility-navigation");this._stateElm=this.element.get("div.timetable-state");this._themeElm=this.element.get("div.timetable-theme");this._innerViewElm=this.element.get("div.timetable-innerView");
this._dragRangeElm=this.element.get("div.timetable-dragRange");this._dragAreaElm=this.element.get("div.timetable-dragArea");this._scrollbar1Elm=this.element.get("div.timetable-scrollbar1");this._scrollbar2Elm=this.element.get("div.timetable-scrollbar2");this._themeElm.addClass("timetable-"+d._opts.theme);this._itemsHangingOffStart=new y.NodeList;this._itemContentHangingOffStart=new y.NodeList;E(this._dragAreaElm,"click",c,this)};e.prototype={draw:function(d){var h=this._timetable,o=t.call(h),u=h.size,
n=h.tracks,m=n.length,s,i=0;if(!this._drawn){this.element.appendTo(h._container.empty());U.call(this)}if(d){s=h.currentPosition();this.tracks={};this.items={};this.itemContent={};this.itemInstance={};this._dragAreaElm.empty();this._scrollbar1Elm.empty();this._scrollbar2Elm.empty();this._headerElm.empty();this._footerElm.empty();this._accessibiltyElm.empty();this._headers={};this._footers={}}if(d||!this._drawn){this._innerViewElm[o.length](u);i=this._timetable;this._viewSize=this._innerViewElm[t.call(i).length]();
this.scale=(i._viewEnd-i._viewStart)/this._viewSize;i=this._timetable;d=t.call(i);o=0;u=i._banding.length-1;for(var k,v;o<u;o++){k=i._banding[o].valueOf();v=i._banding[o+1].valueOf();k=q.call(this,k);v=q.call(this,v)-k;na.clone().css(d.pos,k).css(d.length,v).addClass("timetable-band"+(o%2?"Odd":"Even")).appendTo(this._dragAreaElm)}d=this._timetable;i=d._primaryScrollbar;d=d._secondaryScrollbar;if(i){this._scrollbar1Elm.css("display","block");this._scrollbar1=new ha(this,this._scrollbar1Elm,i)}this._scrollbar1Elm.css("display",
i?"block":"");if(d){this._scrollbar2Elm.css("display","block");this._scrollbar2=new ha(this,this._scrollbar2Elm,d)}this._scrollbar2Elm.css("display",d?"block":"");d=this._timetable;i=t.call(d);d=q.call(this,d.end);o=d*2-this._viewSize;this._dragAreaElm[i.length](d);this._dragRangeElm[i.length](o).css("margin-"+i.pos,-d+this._viewSize);i=this._timetable;d=i._primaryScales.length;this._primaryScaleElms=[];for(this._secondaryScaleElms=[];d--;)this._primaryScaleElms[d]=G.call(this,i._primaryScales[d]).addClass("timetable-scalePrimary").appendTo(this._dragAreaElm);
d=i._secondaryScales.length;for(o=d-1;d--;)this._secondaryScaleElms[o-d]=G.call(this,i._secondaryScales[d]).addClass("timetable-scaleSecondary").appendTo(this._dragAreaElm);ca.call(this);f.call(this,s||h._viewStart)}for(i=0;i<m;i++){h=n[i];s=t.call(this._timetable);d=h.items;o=0;u=d.length;k=this.tracks[h.id];v=this._headers[h.id];var A=this._footers[h.id],D=void 0,M=void 0,z=void 0;z=void 0;if(!k){k=this.tracks[h.id]=_createTrack.call(this,h);k.css(s.breadth,h.size);k.appendTo(this._dragAreaElm);
_drawHeaderAndFooter.call(this,h);v&&k.prepend(v.clone().removeClass("timetable-header-holder").addClass("timetable-accessibility-hidden"));A&&k.append(A.clone().removeClass("timetable-footer-holder").addClass("timetable-accessibility-hidden"))}D=k.get("> ol");z=y.create('<li class="timetable-item" tabindex="0"></li>').appendTo(D);M=parseInt(z.css(["border-"+s.pos+"-width","border-"+s.posOpposite+"-width"]))/2;for(z.remove();o<u;o++){z=h.items[o];this.items[z.id]||_createItem.call(this,d[o],M).appendTo(D)}}s=
this._timetable;n=t.call(s);i=0;d=s.tracks.length;o=this._primaryScaleElms.length;u=d+o+this._secondaryScaleElms.length;var B;h=m=0;var N;D=["border-"+n.otherPos+"-width","border-"+n.otherPosOpposite+"-width"];M=0;z=s._opts.collapseTrackBorders;var O,ea,J;for(A=this._scrollbar1Elm[n.breadth]()-parseInt(this._headerElm.css("border-"+n.otherPos+"-width"));i<u;i++){if(i<o){k=this._primaryScaleElms[i];v=B=null}else if(i<o+d){J=s.tracks[i-o];B=J.id;k=this.tracks[B];v=this._headers[B];B=this._footers[B];
if(J.disabled){S(k,v,B).css("display","none");continue}else S(k,v,B).css("display","")}else{k=this._secondaryScaleElms[i-o-d];v=B=null}N=parseInt(k.css(D))/2;O=z?0:parseInt(k.css("margin-"+n.otherPosOpposite))||0;ea=parseInt(k.css(n.breadth))+N*(!z+1)+O;k.css(n.otherPos,M);if(v){v.css(n.otherPos,M+A).css(n.breadth,J.size+2*N);m=Math.max(parseInt(v.css(n.length)),m)}if(B){B.css(n.otherPos,M+A).css(n.breadth,J.size+2*N);h=Math.max(parseInt(B.css(n.length)),h)}M+=ea}this._innerViewElm.css(n.breadth,
M+N*z-O);N=M+N*z-O+A+this._scrollbar2Elm[n.breadth]();S(this._headerElm,this._footerElm).css(n.breadth,N-parseInt(this._headerElm.css("border-"+n.otherPosOpposite+"-width")));this._headerElm.css(n.length,m);this._footerElm.css(n.length,h);x.call(this);this._drawn=true;return this},currentPosition:function(d){var h=t.call(this._timetable);if(d===undefined)return-parseInt(this._dragAreaElm[0].style[h.pos])*this.scale+this._timetable.start.valueOf();else{Z.call(this);f.call(this,d);l.call(this);return this}},
hide:function(){H.call(this)},clear:function(){Z.call(this)}};var ha;(function(){function d(){if(!this._ignoreChange){f.call(this._timetable._view,(this._timetable._opts.vertical?-1:1)*this.slider.val());this._isDraggingChange||l.call(this._timetable._view)}}function h(){Z.call(this._timetable._view);this._isDraggingChange=true;g.call(this._timetable._view)}function o(){this._isDraggingChange=false;r.call(this._timetable._view);l.call(this._timetable._view)}function u(){var m=t.call(this._timetable);
m=parseInt(this._sliderHandle[0].style[m.pos]);this._labelsHighlight[0].style.clip=this._timetable._opts.vertical?"rect("+m+"px, auto, "+(m+this._handleLength)+"px, auto)":"rect(auto, "+(m+this._handleLength)+"px, auto, "+m+"px)"}var n=0;ha=function(m,s,i){var k=m._timetable,v=t.call(k),A=0,D=i.points,M=D.length-1,z,B=V('<div class="timetable-scrollbarLabels"></div>'),N=p.UID+"scrollbar"+n++,O=k._viewEnd-k._viewStart;z=k.end-k.start;var ea,J;J=k.viewRange().start;this._timetable=k;V('<style type="text/css">'+
("#"+N+" .slider-handle")+" { "+(v.length+":"+O/z*100+"%")+" } </style>").appendTo("head");if(k._opts.vertical){ea=-k.end+O;O=-k.start;J=-J}else{ea=k.start-0;O=k.end-O;J=J}this.slider=new p.widgets.Slider(s,{min:ea,max:O,vertical:k._opts.vertical,className:"timetable-scrollbar",id:N,val:J,size:m._innerViewElm[v.length](),step:0,changeOnDrag:true});m=this.slider.element.get("div.slider-track");k._opts.vertical&&m.css(v.length,m.get("div.slider-trackOn").css(v.length));this.slider.element.get("div.slider-btn-bk, div.slider-btn-fwd").push(m).css(v.breadth,
i.size);for(this.scale=z/m[v.length]();A<M;A++){k=D[A].valueOf();z=D[A+1].valueOf();k=q.call(this,k);z=q.call(this,z)-k;s={start:D[A],end:D[A+1]};y.create('<div class="timetable-scrollbarItem"></div>').append(Y.call(s,i.template).addClass("timetable-itemContent")).css(v.pos,k).css(v.length,z).appendTo(B)}this._labelsHighlight=B.clone().addClass("timetable-scrollbarLabelsHighlight");E(this.slider,"change",d,this);E(this.slider,"slideStart",h,this);E(this.slider,"slideStop",o,this);m.prepend(B).prepend(this._labelsHighlight);
this._sliderHandle=this.slider.element.get("div.slider-handle");this._handleLength=this._sliderHandle[v.length]();u.call(this)};ha.prototype={moveToPosition:function(m){this._ignoreChange=true;this.slider.val((this._timetable._opts.vertical?-1:1)*m);this._ignoreChange=false;u.call(this)}}})()})()}});