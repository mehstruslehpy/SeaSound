//TODO: Need to check that deletion works as expected with this one. It might be kind of weird
//TODO: Scaling looks really weird on this one since it stretches the little lollipop circles
class SliderCanvas 
{
	widgetType = "SliderCanvas"; // On file save/load denotes the type of widget this widget is
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	styles = ["solid","lollipop"]; //implemented display styles
	//deleteMode = false;
	controlPressed = false; //indicates whether we area in delete mode or not
	mousePressed = false; //indicates whether or not we are in the middle of a mouse click
	workingSlider = null; //the in progrerss slider
	sliderList = new Array(); //the array of sliders to draw

	// Controls whether the widget triggers notes or controls parameters
	triggerMode = false;

	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmtX = 1.15;
	scaleAmtY = 1.15;

	// The instrument this widget is a parameter for
	instrument = null;
	name = "";
	trackName = "";

	// For unit conversion
	beatsPerCell = 1;

	// Snap amount
	snapAmount = 1;

	// max and min values for output, output values are scaled to this range
	maxOut = 1;
	minOut = -1;

	// Initial set up
	constructor(query,trackName,horizontalCells,verticalCells,beatsPerCell,rectangleStyle)
	{
		this.trackName = trackName;
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		
		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;

		// The cell width is determined here
		this.cellWidth = this.width/this.verticalCells;
		this.cellHeight = this.height/this.horizontalCells;

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

	// Snap input coordinates to grid and return the resulting coord
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
	// Draw a circle around the input coord
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
	// Runs on pressing down left click of mouse
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

	// Handle clicks when not in trigger mode
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

	// Runs on release of left click of mouse
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

	// Update the current coordinates of the mouse
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

	lollipopStyle(c1,c2)
	{
		// Draw vertical lollipop line
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.height);
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
	solidStyle(c1,c2)
	{
		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 255 0)";
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.height);
		this.ctx.lineTo(c2.x,this.height);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.fill();

		// Draw rectangle outlines
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,this.height);
		this.ctx.lineTo(c2.x,this.height);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.lineTo(c1.x,c1.y);
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}
	// Compute+draw the cell divisions of the display
	draw()
	{
		// First we need to clear the old background 

		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.width, this.height);

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.viewportOutline();

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
			this.ctx.moveTo(i*(this.width/this.verticalCells),0);
			this.ctx.lineTo(i*(this.width/this.verticalCells),this.height);
			this.ctx.stroke();
		}

		//draw horizontal divisions
		for (var i = 0; i < this.horizontalCells; i++)
		{
			this.ctx.strokeStyle = "black";
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(0,i*(this.height/this.horizontalCells));
			this.ctx.lineTo(this.width,i*(this.height/this.horizontalCells));
			this.ctx.stroke();
		}
		
		// draw the sliders
		for (let i = 0; i < this.sliderList.length; i++) this.drawSlider(this.sliderList[i]);
		if (this.workingSlider != null) this.drawSlider(this.workingSlider);

		// Draw the outlines for the canvas too
		this.ctx.beginPath();
		this.ctx.moveTo(0,0);
		this.ctx.lineTo(0,this.height);
		this.ctx.lineTo(this.width,this.height);
		this.ctx.lineTo(this.width,0);
		this.ctx.lineTo(0,0);
		this.ctx.lineWidth = 6;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}

	drawSlider(slider)
	{
		let c1 = slider[0];
		let c2 = slider[1];
		if (this.rectangleStyle == "solid") this.solidStyle(c1,c2);
		else if (this.rectangleStyle == "lollipop") this.lollipopStyle(c1,c2);
		else throw("Unknown draw style");
	}	
	lollipopCollision(c,slider)
	{
		return this.distance(c,slider[0]) < this.radius
	}
	solidCollision(c,slider)
	{
		let horiz = slider[0].x <= c.x && c.x <= slider[1].x;
		let vert = c.x >= slider[0].y;
		return horiz && vert;
	}
	distance(a,b)
	{
		return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
	}

	// print the on screen helper text
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
		this.ctx.fillText(text,this.width-textWidth,textHeight);
		text = "translate amount: " +this.translateAmt +", snap amount: " + this.snapAmount;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,3*textHeight);
		text = "max output: " + this.maxOut.toFixed(2);
		text += ", min output: " + this.minOut.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,4*textHeight);
		text = "instrument name: " + this.name;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,5*textHeight);

	}

	// draw outlines around the viewport
	viewportOutline()
	{
		// Draw the outlines for the canvas too
		this.ctx.beginPath();
		this.ctx.moveTo(0,0);
		this.ctx.lineTo(0,this.height);
		this.ctx.lineTo(this.width,this.height);
		this.ctx.lineTo(this.width,0);
		this.ctx.lineTo(0,0);
		this.ctx.lineWidth = 6;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}

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
	// Converts p a point on the screen (usually a mouse click) to a point in world coords
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
	}

	registerInstrument(inst,name)
	{
		this.instrument = inst;
		this.name = name;
	}	
	setInstrument(inst)
	{ this.instrument = inst; }


	getName()
	{
		return this.name;
	}
	getTrack()
	{
		return this.trackName;
	}
	setName(name)
	{ this.name = name; }
	getTriggerMode()
	{
		return this.triggerMode;
	}
	setTriggerMode(t)
	{
		this.triggerMode = t;
	}

	// Scale all params in the instrument array (including this one)
	scaleAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].applyScale(x,y);
	}

	// Translate all params in the instrument array (including this one)
	translateAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].applyTranslate(x,y);
	}

	// Set scale amount for all params in the instrument array (including this one)
	scaleAmountAll()
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].setScaleAmount(x,y);
	}
	// Set translate amount for all params in the instrument array (including this one)
	translateAmountAll(x,y)
	{
		for (let i = 0; i < this.instrument.length; i++)
			this.instrument[i].setTranslateAmount(x,y);
	}

	// Apply a scaling to the current instrument
	applyScale(x,y)
	{
		this.ctx.scale(x,y);
		this.draw();
	}
	// Apply a translation to the current instrument
	applyTranslate(x,y)
	{
		this.ctx.translate(x,y);
		this.draw();
	}
	// Set the scaling amount for the current instrument
	setScaleAmount(x,y)
	{
		this.scaleAmtX = x;
		this.scaleAmtY = y;	
		this.draw();
	}
	// Set the translation amount for the current instrument
	setTranslateAmount(x)
	{
		this.translateAmount = x;	
		this.draw();
	}
	addRectangle(rect)
	{
		let c1 = {x:rect[0].x,y:rect[0].y};
		let c2 = {x:rect[1].x,y:rect[1].y};
		this.sliderList.push([c1,c2]);
	}
	// Check if pt lies in division/snapAmount of left point of rectangle along x axis
	rectangleXAxisCollision1(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[0].x+this.cellWidth/this.snapAmount);
	}
	// Check if pt lies in x bounds of the given rectangle
	rectangleXAxisCollision2(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x);
	}
	// Setter for the snap to grid amount
	setSnapAmount(n)
	{
		if (n>=1) this.snapAmount = Math.trunc(n);
		else this.snapAmount = 1;
		// sometimes our snap code skips drawing so force a draw
		//this.draw();
	}
	splice(i,j)
	{
		this.sliderList.splice(i,j);
	}
	setMax(n)
	{
		this.maxOut = Number(n);
	}
	setMin(n)
	{
		this.minOut = Number(n);
	}
	// Convert the input rectangle to a triple [start time, duration, note]
	convertRectToNote(rect,bpm)
	{
		// Get the start time relative to the cell scaling of the left point
		let start = rect[0].x/this.cellWidth; 
		start = Math.round(start * this.snapAmount) / this.snapAmount; // mult/div here preserves snapping
		// Get the note duration relative to the same cell scaling
		let dur = (rect[1].x - rect[0].x)/this.cellWidth; 
		dur = Math.round(dur * this.snapAmount) / this.snapAmount; // mult/div here preserves snapping
		// Translate and scale the output value to the appropriate range
		let val = (this.maxOut - this.minOut) * (this.height - rect[0].y)/this.height + this.minOut;
		// Convert raw cell values to values in seconds
		start = this.cellsToSeconds(start,bpm);
		dur = this.cellsToSeconds(dur,bpm);
		return [start,dur,val];
	}
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
	cellsToSeconds(c,bpm)
	{
		// Conversion cell number * (beats / minute) * (cells / beat) * (minutes / second)
		// = cells per second
		let cellsPerSecond = bpm * (1/this.beatsPerCell) * (1/60);
		return c/cellsPerSecond;
	}
	getBeatsPerCell()
	{
		return this.beatsPerCell;
	}
	// Getter for the number of notes
	getNotes()
	{
		return this.horizontalCells;
	}
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
