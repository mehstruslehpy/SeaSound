/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.

*/

//TODO: Need to actually set up these parameters to take advantage of inheritance. Currently there is too much duplicate code.
//TODO: Need to check that deletion works as expected with this one. It might be kind of weird
//TODO: Scaling looks really weird on this one since it stretches the little lollipop circles
//TODO: Make sure line widths are set up like in pianoroll

/**
* The slider class stores state and methods for dealing with slider canvas widgets.
* Slider canvas widgets are used for storing data ("sliders") to do with discrete numerical values with respect to time.
* @class
* @public
*/
class SliderCanvas 
{
	/**
	* On file save/load denotes the type of widget that this widget is.
	*/
	widgetType = "SliderCanvas";
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
	* The possible display styles for this widget.
	* Lollipop mode displays values as vertical bars with a circle drawn at the top.
	* Solid mode displays amplitudes as rectangular blocks.
	*/
	styles = ["solid","lollipop"];
	/**
	* Indicates whether we are in delete mode or not.
	*/
	controlPressed = false;
	/**
	* Indicates whether or not we are in the middle of a mouse click.
	*/
	mousePressed = false;
	/**
	* The in progress slider.
	*/
	workingSlider = null;
	/**
	* The array of created sliders.
	*/
	sliderList = new Array();

	/**
	* Controls whether the widget triggers notes or controls parameters.
	*/
	triggerMode = false;
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
	* The number of beats per cell of our piano roll grid.
	*/
	beatsPerCell = 1;

	/**
	* Configures the fraction of cell that snapping occurs on.
	*/
	snapAmount = 1;

	/**
	* The maximum value a slider can take.
	*/
	maxOut = 1;
	/**
	* The minimum value a slider can take.
	*/
	minOut = -1;

	/**
	* Width of a cell in local, i.e., not screen coords.
	*/
	localWidth = 0;
	/**
	* Height of a cell in local, i.e., not screen coords.
	*/
	localHeight = 0;
	/**
	* Construct a slider canvas widget instance and draw it to the screen.
	* @param {string} query - String containing html id of the canvas we are constructing for.
	* @param {string} trackName - String containing the track name that this widget corresponds to.
	* @param {number} horizontalCells - The number of horizontal cells to draw.
	* @param {number} verticalCells - The number of vertical cells to draw.
	* @param {number} beatsPerCell - The number of beats each cell containg.
	* @param {string} rectangleStyle - The style of slider canvas to construct.
	*/
	constructor(query,trackName,horizontalCells,verticalCells,beatsPerCell,rectangleStyle)
	{
		this.trackName = trackName;
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		//this.width = (this.canvas.width = window.innerWidth);
		//this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight - tabsHeight;
		this.localWidth = 1000;
		this.localHeight = 1000;
		
		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;

		// The cell width is determined here
		this.cellWidth = this.localWidth/this.verticalCells;
		this.cellHeight = this.localHeight/this.horizontalCells;

		this.radius = this.cellWidth/6; // the radius for lollipop style

		if (!this.styles.includes(rectangleStyle)) throw "Unknown draw style";
		this.rectangleStyle = rectangleStyle;

		// For unit conversion later
		this.beatsPerCell = beatsPerCell;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.buttonClick(ev); });
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
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
			controlText += "x: change snap to grid amount\n";
			controlText += "nm: change output max/min values\n";
			controlText += "ctrl: toggle enter/delete modes\n";
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
		else if (ev.key == "m") this.setMax(prompt("Set maximum output value:"));
		else if (ev.key == "n") this.setMin(prompt("Set minimum output value:"));
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
   			//y: this.cellHeight * Math.floor(c.y/this.cellHeight)
   			y: c.y 
		};
		return out;
	}
	/**
	* Draw a circle around the input coord.
	* @param {number} c - Coordinate to draw a circle around.
	*/
	circleCoord(c)
	{
		this.ctx.beginPath();
		this.ctx.arc(c.x, c.y, this.radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = 'green';
		this.ctx.fill();
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
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
			this.leftClickStart = this.snapToGrid(this.screenToWorldCoords(this.coord));
			this.workingSlider = Array(this.leftClickStart,this.leftClickStart);
			this.mousePressed = true;
		}
		this.draw();
	}
	/**
	* Handle when mouse left click is pressed down while not in trigger mode.
	*/
	nonTriggerModeClick()
	{
		let c = {x:this.coord.x, y:this.coord.y};
		c = this.screenToWorldCoords(c);
		for (let i = 0; i < this.sliderList.length; i++)
			switch (this.rectangleStyle)
			{
				case "lollipop":
				{
					if (this.rectangleXAxisCollision1(c,this.sliderList[i])) // if cursor lies inside a rectangle
					{
						this.sliderList[i][0].y = c.y; // then adjust the y axis coord of the collision rectangle
						this.sliderList[i][1].y = c.y + this.cellHeight;
					}
					break;
				}
				case "solid":
				{
					if (this.rectangleXAxisCollision2(c,this.sliderList[i])) // if cursor lies inside a rectangle
					{
						this.sliderList[i][0].y = c.y; // then adjust the y axis coord of the collision rectangle
						this.sliderList[i][1].y = c.y + this.cellHeight;
					}
					break;
				}
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
		c = this.screenToWorldCoords(c);
		// Delete the selected note if any exists
		// Iterating backwards ensures we delete the note at the front of the display
		for (let i = this.sliderList.length - 1; i >= 0; i--)
			switch (this.rectangleStyle)
			{
				case "lollipop":
					if (this.lollipopCollision(c,this.sliderList[i]))
					{
						this.sliderList.splice(i,1);
						// Update the non-triggering widgets
						for (let j = 0; j < this.instrument.length; j++)
							if (this.instrument[j] != this)
							{
								this.instrument[j].splice(i,1);
								this.instrument[j].draw();
							}
						break;
					}
				case "solid":
					if (this.solidCollision(c,this.sliderList[i]))
					{
						this.sliderList.splice(i,1);
						// Update the non-triggering widgets
						for (let j = 0; j < this.instrument.length; j++)
							if (this.instrument[j] != this)
							{
								this.instrument[j].splice(i,1);
								this.instrument[j].draw();
							}
						break;
					}
			}

		this.draw();
	}

	/**
	* Handle release of mouse left click.
	*/
	leftClickUp()
	{
		if (!this.triggerMode) return;
		if (this.controlPressed) // control clicks end here
		{
			this.controlPressed = false;
			this.draw();
			return;
		}

		// set up left click coords
		this.leftClickEnd = this.screenToWorldCoords(this.coord);

		this.clickHelper();

		let c1 = { // top left coord of rectangle
			x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   			y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			// for a piano roll we force the height of the rectangles to be a single unit 
   			y: c1.y+this.cellHeight
		};

		this.mousePressed = false; // mouse is no longer pressed
		this.workingSlider = null;
		this.sliderList.push([c1,c2]);

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
			// set up left click coords
			this.leftClickEnd = this.screenToWorldCoords(this.coord);

			this.clickHelper();
	
			let c1 = { // top left coord of rectangle
				x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   				y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
			};
			let c2 = { // bottom right coord of rectangle
				x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   				y: c1.y+this.cellHeight
			};
			// if mouse is pressed and held there is stuff to draw
			if (this.mousePressed && this.workingSlider != null)
			{
				this.workingSlider[0] = c1;
				this.workingSlider[1] = c2;
				this.draw();
			}
		}

	}

	/**
	* Draws the lollipop specified by the points c1 and c2.
	*/
	lollipopStyle(c1,c2)
	{
		// Draw vertical lollipop line
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.localHeight);
		this.ctx.lineWidth = 6;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();

		// Draw horizontal lollipop line
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.lineWidth = 6;
		this.ctx.strokeStyle = 'green';
		this.ctx.stroke();

		// Draw lollipop circle
		this.circleCoord(c1);
	}
	/**
	* Draws the rectangle specified by the points c1 and c2.
	*/
	solidStyle(c1,c2)
	{
		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 255 0)";
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.localHeight);
		this.ctx.lineTo(c2.x,this.localHeight);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.fill();

		// Draw rectangle outlines
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.localHeight);
		this.ctx.lineTo(c2.x,this.localHeight);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.lineTo(c1.x,c1.y);
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
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
		this.ctx.strokeStyle = "black";
		for (var i = 0; i < this.verticalCells; i++)
		{
			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.localWidth/this.verticalCells),0);
			this.ctx.lineTo(i*(this.localWidth/this.verticalCells),this.localHeight);
			this.ctx.stroke();
		}

		//draw horizontal divisions
		for (var i = 0; i < this.horizontalCells; i++)
		{
			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(0,i*(this.localHeight/this.horizontalCells));
			this.ctx.lineTo(this.localWidth,i*(this.localHeight/this.horizontalCells));
			this.ctx.stroke();
		}
		
		// draw the sliders
		for (let i = 0; i < this.sliderList.length; i++) this.drawSlider(this.sliderList[i]);
		if (this.workingSlider != null) this.drawSlider(this.workingSlider);
	
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
	* Draw the input slider.
	* @param {object} slider - The input slider to draw.
	*/
	drawSlider(slider)
	{
		let c1 = slider[0];
		let c2 = slider[1];
		if (this.rectangleStyle == "solid") this.solidStyle(c1,c2);
		else if (this.rectangleStyle == "lollipop") this.lollipopStyle(c1,c2);
		else throw("Unknown draw style");
	}	
	/**
	* Checks for collision between the input point and the input slider in lollipop mode.
	* @param {object} c - The point to check for collision against.
	* @param {object} slider - The slider to check for collision against.
	* @returns True if collision occured false otherwise.
	*/
	lollipopCollision(c,slider)
	{
		return this.distance(c,slider[0]) < this.radius
	}
	/**
	* Checks for collision between the input point and the input slider in solid mode.
	* @param {object} c - The point to check for collision against.
	* @param {object} slider - The slider to check for collision against.
	* @returns True if collision occured false otherwise.
	*/
	solidCollision(c,slider)
	{
		let horiz = slider[0].x <= c.x && c.x <= slider[1].x;
		let vert = c.x >= slider[0].y;
		return horiz && vert;
	}
	/**
	* Calculates the distance between the input points.
	* @param {object} a - The first input point.
	* @param {object} b - The second input point.
	* @returns The distance between the two input points.
	*/
	distance(a,b)
	{
		return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
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
		text = "translate amount: " +this.translateAmt +", snap amount: " + this.snapAmount;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,3*textHeight);
		text = "max output: " + this.maxOut.toFixed(2);
		text += ", min output: " + this.minOut.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,4*textHeight);
		text = "instrument name: " + this.name;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,5*textHeight);

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
	* Helper that sets up leftClickEnd and leftClickStarts coordinates.
	*/
	clickHelper()
	{
		// snap to the grid
		this.leftClickStart = this.snapToGrid(this.leftClickStart);

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
	* Add rectangle to the rectangle list of this object.
	* @param {object} rect - The rectangle to add to the list.
	*/
	addRectangle(rect)
	{
		//let c1 = {x:rect[0].x,y:rect[0].y};
		//let c2 = {x:rect[1].x,y:rect[1].y};
		let height = 0.25*this.localHeight// this is 75% of the canvas height since the origin is top left
		let c1 = {x:rect[0].x,y:height};
		let c2 = {x:rect[1].x,y:height};
		this.sliderList.push([c1,c2]);
	}
	/**
	* Check if input pt lies in division/snapAmount of left point of rectangle along x axis.
	* @param {object} pt - The point to check collisions against.
	* @param {object} rect- The rectangle to check collisions against.
	* @returns True if pt collides with rectangle false otherwise.
	*/
	rectangleXAxisCollision1(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[0].x+this.cellWidth/this.snapAmount);
	}
	// Check if pt lies in x bounds of the given rectangle
	/**
	* Check if pt lies in x bounds of the given rectangle.
	* @param {object} pt - The point to check collisions against.
	* @param {object} rect- The rectangle to check collisions against.
	* @returns True if pt collides with rectangle false otherwise.
	*/
	rectangleXAxisCollision2(pt,rect)
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
		this.sliderList.splice(i,j);
	}
	/**
	* Setter for maxOut parameter.
	* @param {number} n - The new value for maxOut.
	*/
	setMax(n)
	{
		this.maxOut = Number(n);
	}
	/**
	* Setter for maxIn parameter.
	* @param {number} n - The new value for maxIn.
	*/
	setMin(n)
	{
		this.minOut = Number(n);
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
		// Translate and scale the output value to the appropriate range
		let val = (this.maxOut - this.minOut) * (this.localHeight - rect[0].y)/this.localHeight+ this.minOut;
		// Convert raw cell values to values in seconds
		start = this.cellsToSeconds(start,bpm);
		dur = this.cellsToSeconds(dur,bpm);
		return [start,dur,val];
	}
	/**
	* Creates array of note quadruples in [start, time, duration, note] format from rectangle list.
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @returns Array containing list of tuples in the above form.
	*/
	getNoteOutput(bpm)
	{
		let out = new Array();
		for (let i = 0; i < this.sliderList.length; i++)
		{
			let note = this.convertRectToNote(this.sliderList[i],bpm);
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
		// Conversion cell number * (beats / minute) * (cells / beat) * (minutes / second)
		// = cells per second
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
		this.sliderList = state.sliderList;

		this.triggerMode = state.triggerMode;

		this.translateAmt = state.translateAmt;
		this.scaleAmtX = state.scaleAmtX;
		this.scaleAmtY = state.scaleAmtY;

		this.instrument = null;
		this.name = state.name;
		this.trackName = state.trackName;

		this.beatsPerCell = state.beatsPerCell

		this.snapAmount = state.snapAmount;

		this.maxOut = state.maxOut;
		this.minOut = state.minOut;

		this.verticalCells = state.verticalCells;
		this.horizontalCells = state.horizontalCells;

		this.localHeight = state.localHeight;
		this.localWidth = state.localWidth;

		// The cell width is determined here
		this.cellWidth = state.cellWidth;
		this.cellHeight = state.cellHeight;

		this.radius = state.radius;

		this.rectangleStyle = state.rectangleStyle;
		this.draw();
	}
}

//let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"lollipop");
//let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"solid");
