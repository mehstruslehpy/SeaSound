//TODO: Add a double parameter matrix widget
//TODO: Add a spreadsheet widget for manual input
//TODO: Add code to change the name of the instrument associated to this widget (needs to iterate across this.instrument)
class PianoRollCanvas
{
	widgetType = "PianoRollCanvas"; // On file save/load denotes the type of widget this widget is
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	workingRectangle = null; // The rectangle being created this mouse click
	rectangleList = new Array(); // The list of rectangles created so far
	mousePressed = false; // For tracking if the mouse has been pressed or not
	controlPressed = false; // for tracking if control has been pressed or not

	lineWidth = 0.5; // Used for setting width of lines

	// Controls whether the widget triggers notes or controls parameters
	triggerMode = false;

	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmtX = 1.15;
	scaleAmtY = 1.15;

	// The instrument this widget is a parameter for (as a list of widgets)
	instrument = null;

	// The name of the instrument this widget is a parameter for
	name = "";

	// For unit conversion
	beatsPerCell = 1;

	// For snapping to grid
	snapAmount = 1;

	// Initial set up
	constructor(query,horizontalCells,verticalCells,beatsPerCell)
	{
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		//document.getElementById("TrackEditor").style.display="inline"; // by default TrackEditor is hidden
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);

		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;

		// The cell width is determined here
		this.cellWidth = this.width/this.verticalCells;
		this.cellHeight = this.height/this.horizontalCells;

		// For unit conversion later
		this.beatsPerCell = beatsPerCell;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.buttonClick(ev); });
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
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
			controlText += "x: change snap to grid amount\n";
			controlText += "ctrl: toggle note/delete modes\n";

		if (ev.key == "Control" && this.triggerMode) this.controlPressed = true;
		else if (ev.key == "h") alert(controlText);
		else if (ev.key == "x") 
		{
			let n = prompt("Input snap to grid amount:");
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].setSnapAmount(n);
			for (let i = 0; i < this.instrument.length; i++) this.instrument[i].draw();
		}
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
	
		this.draw();	
	}

	// Snap input coordinates to grid and return the resulting coord
	// TODO: Make this snap amount configurable
	snapToGrid(c)
	{
		let division = 1/this.snapAmount;
		var out = {
			// For no snapping we can do the following
			//x: this.cellWidth * Math.floor(c.x/this.cellWidth),
			// Snapping X value to grid
			x: division * this.cellWidth * Math.floor(c.x/(division*this.cellWidth)),
   			y: this.cellHeight * Math.floor(c.y/this.cellHeight)
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
			this.leftClickStart = this.snapToGrid(val);
			this.workingRectangle = new Array(this.leftClickStart,this.leftClickStart);
			this.mousePressed = true;
		}
	}

	nonTriggerModeClick()
	{
		let c = {x:this.coord.x, y:this.coord.y};
		c = this.screenToWorldCoords(c);
		c = this.snapToGrid(c);
		for (let i = 0; i < this.rectangleList.length; i++)
			if (this.rectangleXAxisCollision(c,this.rectangleList[i])) // if cursor lies inside a rectangle
			{
				this.rectangleList[i][0].y = c.y; // then adjust the y axis coord of the collision rectangle
				this.rectangleList[i][1].y = c.y+this.cellHeight;
			}
		this.draw(); // redraw
	}

	// Runs on pressing control left click
	controlLeftClickDown()
	{
		if (!this.triggerMode) return;
		let c = {x:this.coord.x, y:this.coord.y};
		c = this.screenToWorldCoords(c);
		// Delete the selected note if any exists
		// Iterating backwards ensures we delete the note at the front of the display
		for (let i = this.rectangleList.length - 1; i >= 0; i--)
			if (this.rectangleCollision(c,this.rectangleList[i])) // if cursor lies inside a rectangle
			{
				this.rectangleList.splice(i,1); // remove the rectangle
				// Update the non-triggering widgets too
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
   			y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			y: c1.y+this.cellHeight
		};

		this.mousePressed = false; // the mouse is no longer pressed
		this.workingRectangle = null; // The working rectangle is null again
		this.rectangleList.push([c1,c2]);
		//this.rectangleList.unshift([c1,c2]);

		// Update the non-triggering widgets
		for (let i = 0; i < this.instrument.length; i++)
			if (this.instrument[i] != this)
			{
				this.instrument[i].addRectangle([c1,c2]); 
				this.instrument[i].draw();
			}
		this.draw();
	
		// Send data to backend in post request here
		/*
		fetch("http://localhost:4242/pianoroll", {
  			method: "POST",
  			headers: {'Content-Type': 'application/json'}, 
  			body: JSON.stringify({p1:c1,p2:c2})
		}).then(res => {
  			console.log("Request complete! response:", res);
		});
		*/
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 

		if (this.mousePressed)
		{
			this.clickHelper();

			let c1 = { // top left coord of rectangle
				x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   				y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
			};
			let c2 = { // bottom right coord of rectangle
				x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   				y: c1.y+this.cellHeight
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
		this.ctx.clearRect(0, 0, this.width, this.height);

		// Restore the transform
		this.ctx.restore();

		// Now we can actually start drawing

		//draw horizontal divisions
		for (var i = 0; i < this.horizontalCells; i++)
		{
			// The first rectangle per octave is marked gray
			if ((this.horizontalCells - i - 1)%12 == 0)
			{
				let y = i*this.height/this.horizontalCells;
				this.ctx.fillStyle = "gray";
				this.ctx.fillRect(0,y,this.width,this.cellHeight);
			}
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.beginPath();
			this.ctx.moveTo(0,i*(this.height/this.horizontalCells));
			this.ctx.lineTo(this.width,i*(this.height/this.horizontalCells));
			this.ctx.stroke();
		}

		//draw vertical divisions
		for (var i = 0; i < this.verticalCells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.width/this.verticalCells),0);
			this.ctx.lineTo(i*(this.width/this.verticalCells),this.height);
			this.ctx.stroke();
		}

		// draw all the rectangles
		if (this.workingRectangle!=null) 
			this.drawRectangle(this.workingRectangle[0],this.workingRectangle[1]);
		for (let i = 0; i < this.rectangleList.length; i++)
		{
			let c1 = this.rectangleList[i][0];
			let c2 = this.rectangleList[i][1];
			this.drawRectangle(c1,c2);
		}
		
		// Draw the outlines for the canvas too
		this.viewportOutline();

		// Now we want to draw the outlines for the helper text on top of the canvas
		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.viewportOutline();

		// Restore the transform
		this.ctx.restore();
	}

	drawRectangle(c1,c2)
	{
		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 255 0)";
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,c2.y);
		this.ctx.lineTo(c2.x,c2.y);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.fill();

		// Draw rectangle outlines
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
	// Check if pt lies inside the rectangle 
	rectangleCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x && rect[0].y <= pt.y && pt.y <= rect[1].y);
	}

	// Check if pt lies between the rectangles x axis bounds
	rectangleXAxisCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x);
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
		this.ctx.lineWidth = 3;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}

	// print the on screen helper text
	helperText()
	{
		// Draw text showing the mode
		let text = "";
		if (this.controlPressed) text = "Delete mode. ";
		else text = "Note mode. ";
		text += "Press h for keybinds.";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);
		text = "translate amount: " +this.translateAmt +", snap amount: "+this.snapAmount;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,3*textHeight);
	
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

	// Store the instrument array for the current parameter
	registerInstrument(inst,name)
	{
		this.instrument = inst;
		this.name = name;
	}
	setInstrument(inst)
	{
		this.instrument = inst;
	}

	getName()
	{
		return this.name;
	}

	// Getter for trigger mode variable
	getTriggerMode()
	{
		return this.triggerMode;
	}

	// Setter for trigger mode variable
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
		let c1 = {x:rect[0].x,y:0};
		let c2 = {x:rect[1].x,y:this.cellHeight};
		this.rectangleList.push([c1,c2]);
		//this.rectangleList.unshift([c1,c2]);
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
		// Get the pitch with respect to the bottom left corner of the canvas scaled relative to the cell height
		let pitch = (this.height - rect[0].y)/this.cellHeight;
		pitch = pitch - 1; // the very bottom note of the canvas is zero rather than 1
		pitch = Math.round(pitch);
		// Convert raw cell values to values in seconds
		start = this.cellsToSeconds(start,bpm);
		dur = this.cellsToSeconds(dur,bpm);
		return [start,dur,this.noteToPitchClass(pitch)];
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
	// Converts a note to a pitch class value
	noteToPitchClass(n)
	{
		let octave = Math.floor(n/12);
		let remainder = n % 12;
		remainder = ('00'+remainder).slice(-2); // forces remainder to be two digits with zero padding
		return String(octave)+"."+String(remainder);
	}

	// Getter for the number of cells per beat
	getBeatsPerCell()
	{
		return this.beatsPerCell;
	}
	// Getter for the number of notes
	getNotes()
	{
		return this.verticalCells;
	}
	reconfigure(state)
	{
		this.rectangleList = state.rectangleList;
		this.instrument = null;
		this.name = state.name
		this.snapAmount = state.snapAmount;

		this.triggerMode = state.triggerMode;

		this.verticalCells = state.verticalCells;
		this.horizontalCells = state.horizontalCells;

		// The cell width is determined here
		this.cellWidth = state.cellWidth;
		this.cellHeight = state.cellHeight;

		// For unit conversion later
		this.beatsPerCell = state.beatsPerCell;
		this.draw();
	}
}
