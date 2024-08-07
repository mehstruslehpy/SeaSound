/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.
*/
/**
* The coded event class stores state and methods for dealing with coded event canvas widgets.
* Coded event canvas widgets are used to emit textual events with respect to time.
* @class
* @public
*/
class CodedEventCanvas
{
	/**
	* On file save/load denotes the type of widget that this widget is.
	*/
	widgetType = "CodedEventCanvas";
	/**
	* The coords of the mouse.
	*/
	coord = {x:0, y:0};
	/**
	* the coords of the mouse at the start of a click.
	*/
	leftClickStart = {x:0, y:0};
	/**
	* The coords of the mouse at the release of a click.
	*/
	leftClickEnd = {x:0, y:0};
	/**
	* The array of created events (as rectangles).
	*/
	rectangleList = Array();
	/**
	* The in progress event (as a rectangle).
	*/
	workingRectangle = null;
	/**
	* The input text for the next event.
	*/
	workingText = "...";
	/**
	* Indicates whether or not we are in the middle of a mouse click.
	*/
	mousePressed = false;

	/**
	* Width of lines for drawing.
	*/
	lineWidth = 1;
	/**
	* Amount translate changes by.
	*/
	translateAmt = 10;
	/**
	* Amount X scaling changes by.
	*/
	scaleAmtX = 1.15;
	/**
	* Amount Y scaling changes by.
	*/
	scaleAmtY = 1.15;

	/**
	* Controls whether the widget triggers notes or controls parameters.
	*/
	triggerMode = false;

	/**
	* The instrument this widget is a parameter for (as a list of widgets).
	*/
	instrument = null;
	/**
	* The name of the instrument this widget is a parameter for.
	*/
	name = "";
	/**
	* The name of the track this widget is assigned to.
	*/
	trackName = "";

	/**
	* Indicates whether we are in delete mode or not.
	*/
	controlPressed = false;

	/**
	* The number of beats per cell of our piano roll grid.
	*/
	beatsPerCell = 1;

	/**
	* Configures the fraction of cell that snapping occurs on.
	*/
	snapAmount = 1;

	/**
	* Width of a cell in local, i.e., not screen coords.
	*/
	localWidth = 0;
	/**
	* Height of a cell in local, i.e., not screen coords.
	*/
	localHeight = 0;

	/**
	* Construct a coded event canvas widget instance and draw it to the screen.
	* @param {string} query - String containing html id of the canvas we are constructing for.
	* @param {string} trackName - String containing the track name that this widget corresponds to.
	* @param {number} cells - The number of horizontal cells to draw.
	* @param {number} beatsPerCell - The number of beats each cell containg.
	*/
	constructor(query,trackName,cells,beatsPerCell)
	{
		this.trackName = trackName;
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight - tabsHeight;
		this.localWidth = 1000;
		this.localHeight = 1000;
	
		this.cells = cells;
		this.cellWidth = this.localWidth/this.cells;

		// For unit conversion later
		this.beatsPerCell = beatsPerCell;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.buttonClick(ev); });
		this.draw();
	}

	/**
	* Handles button clicks from the user.
	* @param {event} ev - The event containing the button click we are handling.
	*/
	buttonClick(ev)
	{
		let controlText = "";
			controlText += "h: display keybinds\n";
			controlText += "wasd: scroll viewport\n";
			controlText += "qe: scale viewport in X\n";
			controlText += "zc: scale viewport in X\n";
			controlText += "rf: change amount to translate by\n";
			controlText += "tg: change X scaling amount\n";
			controlText += "yh: change Y scaling amount\n";
			controlText += "j: change input text\n";
			controlText += "x: change snap to grid amount\n";
			controlText += "ctrl: toggle note/delete modes\n";
			controlText += "i: change instrument name\n";

		if (ev.key == "Control" && this.triggerMode) this.controlPressed = true;
		else if (ev.key == "x") 
		{
			let n = prompt("Input snap to grid amount:");
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].setSnapAmount(n);
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].draw();
		}
		else if (ev.key == "h") alert(controlText);
		else if (ev.key == "q") this.scaleAll(this.scaleAmtX,1);
		else if (ev.key == "e") this.scaleAll(1/this.scaleAmtX,1);
		else if (ev.key == "z") this.scaleAll(1,this.scaleAmtY);
		else if (ev.key == "c") this.scaleAll(1,1/this.scaleAmtY);
		else if (ev.key == "a") this.translateAll(this.translateAmt,0);
		else if (ev.key == "d") this.translateAll(-this.translateAmt,0);
		else if (ev.key == "s") this.translateAll(0,-this.translateAmt);
		else if (ev.key == "w") this.translateAll(0,this.translateAmt);
		else if (ev.key == "r") this.translateAmountAll(this.translateAmt+10);
		else if (ev.key == "f") this.translateAmountAll(this.translateAmt-10);
		else if (ev.key == "t") this.scaleAmountAll(this.scaleAmtX*(1+1/(2**4)),this.scaleAmtY);
		else if (ev.key == "g") this.scaleAmountAll(this.scaleAmtX/(1+1/(2**4)),this.scaleAmtY);
		else if (ev.key == "y") this.scaleAmountAll(this.scaleAmtX,this.scaleAmtY*(1+1/(2**4)));
		else if (ev.key == "h") this.scaleAmountAll(this.scaleAmtX,this.scaleAmtY/(1+1/(2**4)));
		else if (ev.key == "j") this.workingText = prompt("Please enter event text.");
		else if (ev.key == "i") 
		{
			let n = prompt("Input new instrument name:");
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].setName(n);
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].draw();
		}
		this.draw();	
	}

	
	/**
	* Snap input coordinates to grid and return the resulting coord
	* @param {number} c - the coordinate to snap to the grid.
	* @returns The coordinate resulting from snapping c to the grid.
	*/
	snapToGrid(c)
	{
		let division = 1/this.snapAmount;
		var out = {
			x: division * this.cellWidth * Math.floor(c.x/(division * this.cellWidth)),
   			y: 0
		};
		return out;
	}

	/**
	* Handle when mouse left click is pressed down.
	*/
	leftClickDown()
	{
		if (!this.triggerMode) this.nonTriggerModeClick();
		else if (this.controlPressed) this.controlLeftClickDown();
		else
		{
			let val = this.screenToWorldCoords(this.coord);
			this.leftClickStart = {x:this.snapToGrid(val).x, y:0};
			this.workingRectangle = new Array(this.leftClickStart,this.leftClickStart);
			this.mousePressed = true;
		}
	}

	/**
	* Handle when mouse left click is pressed down while not in trigger mode.
	*/
	nonTriggerModeClick()
	{
		let c = {x:this.coord.x, y:this.coord.y};
		c = this.screenToWorldCoords(c);
		for (let i = 0; i < this.rectangleList.length; i++)
			if (this.rectangleXAxisCollision(c,this.rectangleList[i])) // if cursor lies inside a rectangle
			{
				this.rectangleList[i][2] = prompt("Please enter event text.");
			}
		this.draw(); // redraw
	}

	/**
	* Handle when mouse left click is pressed down after control mode switch.
	*/
	controlLeftClickDown()
	{
		if (!this.triggerMode) return;
		let c = {x:this.coord.x, y:this.coord.y};
		c = {x:this.screenToWorldCoords(c).x, y:0};
		for (let i = this.rectangleList.length - 1; i >= 0; i--)
			if (this.rectangleCollision(c,this.rectangleList[i])) // if cursor lies inside a rectangle
			{
				this.rectangleList.splice(i,1); // remove the rectangle
				// Update the non-triggering widgets
				for (let j = 0; j < this.instrument.length; j++)
					if (this.instrument[j] != this)
					{
						this.instrument[j].splice(i,1);
						this.instrument[j].draw();
					}
				break;
			}

		this.draw();
	}
	/**
	* Handle release of mouse left click.
	*/
	leftClickUp()
	{
		if (!this.triggerMode) return;
		if (this.controlPressed) // if it was a control press
		{
			this.controlPressed = false; // untoggle controlPressed var and return
			this.draw();
			return;
		}

		this.clickHelper();

		let c1 = { // top left coord of rectangle
			x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   			y: 0
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			y: 0
		};

		// Reset the mousePressed value and the working rectangle
		this.mousePressed = false; // the mouse is no longer pressed
		this.workingRectangle = null; // The working rectangle is null again
	
		this.rectangleList.push([c1,c2,this.workingText]);

		// Update the non-triggering widgets
		for (let i = 0; i < this.instrument.length; i++)
			if (this.instrument[i] != this)
			{
				this.instrument[i].addRectangle([c1,c2]); 
				this.instrument[i].draw();
			}
		this.draw();
	
	}

	/**
	* Update the current coordinates of the mouse.
	*/
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 

		if (this.mousePressed)
		{
			this.clickHelper();

			let c1 = { // left coord of rectangle
				x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   				y: 0
			};
			let c2 = { // right coord of rectangle
				x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   				y: 0
			};

			// If the mouse is pressed and held there is stuff to draw
			if (this.mousePressed && this.workingRectangle != null)
			{
				this.workingRectangle[0] = c1;
				this.workingRectangle[1] = c2;
				this.draw();
			}
		}
	}

	/**
	* Draw the current state of the widget to the screen.
	*/
	draw()
	{
		// First we need to clear the old background 

		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Restore the transform
		this.ctx.restore();

		// Now we can actually start drawing

		//draw vertical divisions
		for (var i = 0; i < this.cells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.localWidth/this.cells),0);
			this.ctx.lineTo(i*(this.localWidth/this.cells),this.localHeight);
			this.ctx.stroke();
		}

		// draw the rectangles
		for (let i = 0; i < this.rectangleList.length; i++) this.drawRectangle(this.rectangleList[i]);
		if (this.workingRectangle != null) 
			this.drawRectangle([this.workingRectangle[0],this.workingRectangle[1],"..."]);
		
		// Draw the outlines for the canvas too
		this.drawRectangleOutline({x:0,y:0},{x:this.localWidth,y:this.localHeight});

		// Now we want to draw the outlines for the helper text on top of the canvas
		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.drawRectangleOutline({x:0,y:0},{x:this.canvas.width,y:this.canvas.height});

		// Restore the transform
		this.ctx.restore();
	}

	/**
	* Draw a rectangle outline with the given points.
	* @param {object} c1 - Object denoting top left coord of rectangle.
	* @param {object} c2 - Object denoting bottom right coord of rectangle.
	*/
	drawRectangleOutline(c1,c2)
	{
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,c2.y);
		this.ctx.lineTo(c2.x,c2.y);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.lineTo(c1.x,c1.y);
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}

	/**
	* Prints helper text to the top right corner of the widget.
	*/
	helperText()
	{
		// Draw text showing the mode
		let text = ""
		if (this.controlPressed) text = "Delete mode. ";
		else text = "Enter mode. ";
		text += "Press h for keybinds.";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,textHeight);
		text = "translate amount: " +this.translateAmt + ", snap amount: "+this.snapAmount;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,3*textHeight);
		text = "input text: " + this.workingText;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,4*textHeight);
		text = "instrument name: " + this.name;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,5*textHeight);
	}
	/**
	* Stores the instrument array corresponding to this parameter widget.
	* @param {object} inst - The instrument array.
	* @param {string} name - The name of the instrument containing this parameter widget.
	*/
	registerInstrument(inst,name)
	{
		this.instrument = inst;
		this.name = name;
	}
	/**
	* Sets the instrument array corresponding to this parameter widget.
	* @param {object} inst - The instrument array.
	*/
	setInstrument(inst)
	{ this.instrument = inst; }
	/**
	* Get the name of the instrument associated with this parameter widget.
	* @returns The above mentioned name.
	*/
	getName()
	{
		return this.name;
	}	
	/**
	* Get the trackname associated to the instrument this parameter widget is assigned to.
	* @returns The above mentioned name.
	*/
	getTrack()
	{
		return this.trackName;
	}
	/**
	* Sets the name of the instrument associated with this parameter widget.
	* @param {string} name - The name to set.
	*/
	setName(name)
	{ this.name = name; }
	/**
	* Gets the trigger mode for this parameter widget.
	* @returns The trigger mode of this parameter widget.
	*/
	getTriggerMode()
	{
		return this.triggerMode;
	}
	/**
	* Sets the trigger mode for this parameter widget.
	* @param {boolean} t - True if this parameter widget is in trigger mode else false.
	*/
	setTriggerMode(t)
	{
		this.triggerMode = t;
	}

	/**
	* Scale all params in the instrument array (including this one).
	* @param {number} x - Scale factor in x direction.
	* @param {number} y - Scale factor in y direction.
	*/
	scaleAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].applyScale(x,y);
	}

	/**
	* Translate all params in the instrument array (including this one).
	* @param {number} x - Translation amount in x direction.
	* @param {number} y - Translation amount in y direction.
	*/
	translateAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].applyTranslate(x,y);
	}

	/**
	* Set scale amount for all params in the instrument array (including this one).
	* @param {number} x - Scale factor in x direction.
	* @param {number} y - Scale factor in y direction.
	*/
	scaleAmountAll()
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].setScaleAmount(x,y);
	}
	/**
	* Set translate amount for all params in the instrument array (including this one).
	* @param {number} x - Translate amount in x direction.
	* @param {number} y - Translate amount in y direction.
	*/
	translateAmountAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].setTranslateAmount(x,y);
	}

	/**
	* Apply a scaling to the current instrument.
	* @param {number} x - Scale factor in x direction.
	* @param {number} y - Scale factor in y direction.
	*/
	applyScale(x,y)
	{
		this.ctx.scale(x,y);
		this.draw();
	}
	/**
	* Apply a translation to the current instrument.
	* @param {number} x - Translation amount in x direction.
	* @param {number} y - Translation amount in y direction.
	*/
	applyTranslate(x,y)
	{
		this.ctx.translate(x,y);
		this.draw();
	}
	/**
	* Set the scaling amount for the current instrument.
	* @param {number} x - Scale factor in x direction.
	* @param {number} y - Scale factor in y direction.
	*/
	setScaleAmount(x,y)
	{
		this.scaleAmtX = x;
		this.scaleAmtY = y;	
		this.draw();
	}
	/**
	* Set the translation amount for the current instrument
	* @param {number} x - Translation amount in x direction.
	* @param {number} y - Translation amount in y direction.
	*/
	setTranslateAmount(x)
	{
		this.translateAmount = x;	
		this.draw();
	}

	/**
	* Draw the given rectangle to the screen.
	* @param {object} rect - The rectangle (as an array of coords) to draw.
	*/
	drawRectangle(rect)
	{
		let c1 = rect[0];
		let c2 = rect[1];
		let value = rect[2];

		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 255 0)";
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,0);
		this.ctx.lineTo(c1.x,this.localHeight);
		this.ctx.lineTo(c2.x,this.localHeight);
		this.ctx.lineTo(c2.x,0);
		this.ctx.lineTo(c1.x,0);
		this.ctx.fill();

		// Draw rectangle outlines
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,0);
		this.ctx.lineTo(c1.x,this.localHeight);
		this.ctx.lineTo(c2.x,this.localHeight);
		this.ctx.lineTo(c2.x,0);
		this.ctx.lineTo(c1.x,0);
	
		// draw the text
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
		this.ctx.font = "bold 50px Arial";
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(value,c1.x,this.localHeight/2,Math.abs(c1.x-c2.x));
	}

	/**
	* Converts the coordinates of the input point in screen coordinates to local/world coordinates.
	* @param {object} p - Point to convert.
	* @returns A new point with transformed x and y coords.
	*/
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
	}
	/**
	* Helper that sets up leftClickEnd and leftClickStarts coordinates.
	*/
	clickHelper()
	{
		// set up left click coords
		this.leftClickEnd = this.screenToWorldCoords(this.coord);

		let division = 1/this.snapAmount;
		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x += this.cellWidth * division;
		else 
			this.leftClickEnd.x = this.leftClickStart.x+this.cellWidth * division;

		// Line the two y coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.y <= this.leftClickEnd.y)
			this.leftClickEnd.y += this.cellHeight;
		else
			this.leftClickStart.y += this.cellHeight;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);
	}

	/**
	* Checks if point pt lies inside rectangle rect.
	* @param {object} pt - Point to test for inclusion.
	* @param {object} rect - Rectangle (array containing topleft/bottom right coords) to test inclusion of pt against.
	* @returns true or false depending on if pt lies in rect.
	*/
	rectangleCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x && rect[0].y <= pt.y && pt.y <= rect[1].y);
	}
	/**
	* Add rectangle to the rectangle list of this object.
	* @param {object} rect - The rectangle to add to the list.
	*/
	addRectangle(rect)
	{
		let c1 = {x:rect[0].x,y:0};
		let c2 = {x:rect[1].x,y:0};
		this.rectangleList.push([c1,c2,this.workingText]);
	}
	/**
	* Checks if point pt's x coordinate lies inside rectangle rect's x axis bounds.
	* @param {object} pt - Point to test with.
	* @param {object} rect - Rectangle (array containing topleft/bottom right coords) to test against.
	* @returns true or false depending on if the x coord of pt lies within the x axis bounds of rect.
	*/
	rectangleXAxisCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x);
	}
	/**
	* Setter for the fraction of a cell that snapping occurs to.
	* @param {number} n - Fraction of a cell to snap to.
	*/
	setSnapAmount(n)
	{
		if (n>=1) this.snapAmount = Math.trunc(n);
		else this.snapAmount = 1;
		// sometimes our snap code skips drawing so force a draw
		//this.draw();
	}
	/**
	* Splice the rectangle list. See javascript array splice() method documentation.
	* @param {number} i - The index to remove items from.
	* @param {number} j - The number of items to be removed.
	*/
	splice(i,j)
	{
		this.rectangleList.splice(i,j);
	}
	/**
	* Converts the input rectangle to a quadruple [start time, duration, note].
	* @param {object} rect - The input rectangle to convert.
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @returns Tuple containing tuple in form [start, time, duration, note] for input note with bpm.
	*/
	convertRectToNote(rect,bpm)
	{
		// Get the start time relative to the cell scaling of the left point
		let start = rect[0].x/this.cellWidth; 
		start = Math.round(start * this.snapAmount) / this.snapAmount; // mult/div here preserves snapping
		// Get the note duration relative to the same cell scaling
		let dur = (rect[1].x - rect[0].x)/this.cellWidth; 
		dur = Math.round(dur * this.snapAmount) / this.snapAmount; // mult/div here preserves snapping
		// Convert raw cell values to values in seconds
		start = this.cellsToSeconds(start,bpm);
		dur = this.cellsToSeconds(dur,bpm);
		return [start,dur,rect[2]]; // rect[2] contains the text output of this rectangle
	}
	/**
	* Creates array of note quadruples in [start, time, duration, note] format from rectangle list.
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @returns Array containing list of tuples in the above form.
	*/
	getNoteOutput(bpm)
	{
		let out = new Array();
		for (let i = 0; i < this.rectangleList.length; i++)
		{
			let note = this.convertRectToNote(this.rectangleList[i],bpm);
			out.push(note);	
		}
		return out;
	}
	/**
	* Convert a raw cell number to a value in seconds.
	* @param {number} c - The cell number to convert.
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @returns Converted value described above.
	*/
	cellsToSeconds(c,bpm)
	{
		let cellsPerSecond = bpm * (1/this.beatsPerCell) * (1/60);
		return c/cellsPerSecond;
	}
	/**
	* Getter for the number of beats per cell.
	* @returns The number of beats per cell.
	*/
	getBeatsPerCell()
	{
		return this.beatsPerCell;
	}
	/**
	* Getter for the number of notes displayed vertically by this widget.
	* @returns The number of cells per beat.
	*/
	getNotes()
	{
		return this.horizontalCells;
	}
	/**
	* Set up the state of the widget based on the input argument.
	* @param {object} state - The state used to configure the widget.
	*/
	reconfigure(state)
	{
		this.rectangleList = state.rectangleList;
		this.workingText = state.workingText;

		this.lineWidth = state.lineWidth;

		this.translateAmt = state.translateAmt;
		this.scaleAmtX = state.scaleAmtX;
		this.scaleAmtY = state.scaleAmtY;

		this.triggerMode = state.triggerMode;

		this.instrument = null;
		this.name = state.name;
		this.trackName = state.trackName;

		this.beatsPerCell = state.beatsPerCell;

		this.snapAmount = state.snapAmount;

		this.localHeight = state.localHeight;
		this.localWidth = state.localWidth;
		this.cells = state.cells;
		this.cellWidth = state.cellWidth;
		this.draw();
	}
}
// Draw the divisions
//let codedEventObject= new CodedEventCanvas(".codedEventCanvas",40);
