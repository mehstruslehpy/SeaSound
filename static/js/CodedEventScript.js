class CodedEventCanvas
{
	widgetType = "CodedEventCanvas"; // On file save/load denotes the type of widget this widget is
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	rectangleList = Array(); // The list of rectangles created so far
	workingRectangle = null; // The in progress rectangle
	workingText = "..."; // the input text for the event
	mousePressed = false; // Tracks whether the mouse is pressed

	// width of lines for drawing
	lineWidth = 1;

	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmtX = 1.15;
	scaleAmtY = 1.15;

	// Controls whether the widget triggers notes or controls parameters
	triggerMode = false;

	// The instrument this widget is a parameter for
	instrument = null;
	name = "";
	trackName = "";

	// Tracks whether control has been pressed or not
	controlPressed = false;

	// For unit conversion
	beatsPerCell = 1;

	// Snap amount
	snapAmount = 1;

	// For note area dimensions in local coords
	localWidth = 0;
	localHeight = 0;

	// Initial set up
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

	// Keyboard button handler
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

	
	// Snap input coordinates to grid and return the resulting coord
	snapToGrid(c)
	{
		let division = 1/this.snapAmount;
		var out = {
			x: division * this.cellWidth * Math.floor(c.x/(division * this.cellWidth)),
   			y: 0
		};
		return out;
	}

	// Runs on pressing down left click of mouse
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

	// Handle clicks when not in trigger mode
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

	// Runs on pressing control left click
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
	// Runs on release of left click of mouse
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

	// Update the current coordinates of the mouse
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

	// Compute+draw the cell divisions of the display
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

	// draw the outline of a rectangle
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

	// Draw the input rectangle
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

	// Converts p a point on the screen (usually a mouse click) to a point in world coords
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
	}

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

	// Check if pt lies inside the rectangle 
	rectangleCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x && rect[0].y <= pt.y && pt.y <= rect[1].y);
	}
	addRectangle(rect)
	{
		let c1 = {x:rect[0].x,y:0};
		let c2 = {x:rect[1].x,y:0};
		this.rectangleList.push([c1,c2,this.workingText]);
	}
	// Check if pt lies between the rectangles x axis bounds
	rectangleXAxisCollision(pt,rect)
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
		this.rectangleList.splice(i,j);
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
		// Convert raw cell values to values in seconds
		start = this.cellsToSeconds(start,bpm);
		dur = this.cellsToSeconds(dur,bpm);
		return [start,dur,rect[2]]; // rect[2] contains the text output of this rectangle
	}
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
	cellsToSeconds(c,bpm)
	{
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
