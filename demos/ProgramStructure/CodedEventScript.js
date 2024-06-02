//TODO: Need to fix bug where helper text is drawn under canvas items when there are rectangles to draw.
//TODO: Need to fix the above on all widgets.
//TODO: Should be able to add it to end of draw() with suitable coord xforms applied
class CodedEventCanvas
{
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

	// Tracks whether control has been pressed or not
	controlPressed = false;

	// For unit conversion
	cellsPerBeat = 1;

	// Snap amount
	snapAmount = 1;
	// Initial set up
	constructor(query,cells,cellsPerBeat)
	{
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		this.cells = cells;
		this.cellWidth = this.width/this.cells;

		// For unit conversion later
		this.cellsPerBeat = cellsPerBeat;

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
			controlText += "i: change input text\n";
			controlText += "x: change snap to grid amount\n";
			controlText += "ctrl: toggle note/delete modes\n";

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
		else if (ev.key == "i") this.workingText = prompt("Please enter event text.");
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
		this.ctx.clearRect(0, 0, this.width, this.height);

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.viewportOutline();

		// Restore the transform
		this.ctx.restore();

		// Now we can actually start drawing

		//draw vertical divisions
		for (var i = 0; i < this.cells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.width/this.cells),0);
			this.ctx.lineTo(i*(this.width/this.cells),this.height);
			this.ctx.stroke();
		}

		// draw the rectangles
		for (let i = 0; i < this.rectangleList.length; i++) this.drawRectangle(this.rectangleList[i]);
		if (this.workingRectangle != null) 
			this.drawRectangle([this.workingRectangle[0],this.workingRectangle[1],"..."]);
		
		// Draw the outlines for the canvas too
		this.viewportOutline();
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
		text = "translate amount: " +this.translateAmt + ", snap amount: "+this.snapAmount;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,3*textHeight);
		text = "input text: " + this.workingText;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,4*textHeight);
	}


	registerInstrument(inst)
	{
		this.instrument = inst;
	}
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
		this.ctx.lineTo(c1.x,this.height);
		this.ctx.lineTo(c2.x,this.height);
		this.ctx.lineTo(c2.x,0);
		this.ctx.lineTo(c1.x,0);
		this.ctx.fill();

		// Draw rectangle outlines
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,0);
		this.ctx.lineTo(c1.x,this.height);
		this.ctx.lineTo(c2.x,this.height);
		this.ctx.lineTo(c2.x,0);
		this.ctx.lineTo(c1.x,0);
	
		// draw the text
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
		this.ctx.font = "bold 50px Arial";
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(value,c1.x,this.height/2,Math.abs(c1.x-c2.x));
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
}
// Draw the divisions
//let codedEventObject= new CodedEventCanvas(".codedEventCanvas",40);
