window.Mouse = {};
Mouse.init = function(target){

	// Events!
	var _onmousedown = function(event){
		Mouse.moved = false;
		Mouse.pressed = true;
		Mouse.startedOnTarget = true;
		publish("mousedown");
	};
	var _onmousemove = function(event){

		// DO THE INVERSE
		var canvasses = document.getElementById("canvasses");
		var tx = 0;
		var ty = 0;
		var s = 1/loopy.offsetScale;
		var CW = canvasses.clientWidth - _PADDING - _PADDING;
		var CH = canvasses.clientHeight - _PADDING_BOTTOM - _PADDING;

		if(loopy.embedded){
			tx -= _PADDING/2; // dunno why but this is needed
			ty -= _PADDING/2; // dunno why but this is needed
		}
		
		tx -= (CW+_PADDING)/2;
		ty -= (CH+_PADDING)/2;
		
		tx = s*tx;
		ty = s*ty;

		tx += (CW+_PADDING)/2;
		ty += (CH+_PADDING)/2;

		tx -= loopy.offsetX;
		ty -= loopy.offsetY;

		// Mutliply by Mouse vector
		var mx = event.x*s + tx;
		var my = event.y*s + ty;

		// Mouse!
		Mouse.x = mx;
		Mouse.y = my;

		// Raw (un-transformed) pointer position, in canvas CSS pixels.
		// Used for panning, which must be independent of the camera offset.
		Mouse.rawX = event.x;
		Mouse.rawY = event.y;

		Mouse.moved = true;
		publish("mousemove");

	};
	var _onmouseup = function(){
		Mouse.pressed = false;
		if(Mouse.startedOnTarget){
			publish("mouseup");
			if(!Mouse.moved) publish("mouseclick");
		}
		Mouse.moved = false;
		Mouse.startedOnTarget = false;
	};

	// Add mouse & touch events!
	_addMouseEvents(target, _onmousedown, _onmousemove, _onmouseup);

	// Mouse-wheel: zoom the canvas, centered on the cursor.
	var _onwheel = function(event){

		// Only while editing, and never over an open modal.
		if(!window.loopy) return;
		if(loopy.mode!=Loopy.MODE_EDIT) return;
		if(loopy.modal && loopy.modal.isShowing) return;

		event.preventDefault();

		// Normalise wheel delta (lines/pages -> approx pixels).
		var dy = event.deltaY;
		if(event.deltaMode==1) dy *= 33;
		else if(event.deltaMode==2) dy *= (window.innerHeight||600);

		// New scale (scroll up = zoom in), clamped to sane bounds.
		var oldScale = loopy.offsetScale;
		var newScale = oldScale * Math.pow(1.0015, -dy);
		newScale = Math.max(0.2, Math.min(4, newScale));
		if(newScale==oldScale) return;

		// Cursor position, in the same CSS-pixel space as the inverse transform.
		var ex = event.offsetX;
		var ey = event.offsetY;

		// Same centering constants as _onmousemove's inverse transform.
		var canvasses = document.getElementById("canvasses");
		var Kx = (canvasses.clientWidth - _PADDING - _PADDING + _PADDING)/2;
		var Ky = (canvasses.clientHeight - _PADDING_BOTTOM - _PADDING + _PADDING)/2;

		// Keep the model point under the cursor fixed:
		// offset += (s_new - s_old)*(cursor - center), where s = 1/scale.
		var sOld = 1/oldScale, sNew = 1/newScale;
		loopy.offsetX += (sNew - sOld)*(ex - Kx);
		loopy.offsetY += (sNew - sOld)*(ey - Ky);
		loopy.offsetScale = newScale;

		loopy.model.update(); // redraw

	};
	target.addEventListener("wheel", _onwheel, {passive:false});

	// Cursor & Update
	Mouse.target = target;
	Mouse.showCursor = function(cursor){
		Mouse.target.style.cursor = cursor;
	};
	Mouse.update = function(){
		Mouse.showCursor("");
	};

};