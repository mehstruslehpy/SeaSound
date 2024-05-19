class PianoRollCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	workingRectangle = null; // The rectangle being created this mouse click
	rectangleList = new Array(); // The list of rectangles created so far
	mousePressed = false; // For tracking if the mouse has been pressed or not
	controlPressed = false; // for tracking if control has been pressed or not
	
	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmtX = 1.15;
	scaleAmtY = 1.15;

	// Initial set up
	constructor(query,horizontalCells,verticalCells)
	{
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		document.getElementById("TrackEditor").style.display="inline"; // by default TrackEditor is hidden
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);

		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;

		// The cell width is determined here
		this.cellWidth = this.width/this.verticalCells;
		this.cellHeight = this.height/this.horizontalCells;

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
			controlText += "ctrl: toggle note/delete modes\n";

		if (ev.key == "Control") this.controlPressed = true;
		else if (ev.key == "h") alert(controlText);
		else if (ev.key == "q") this.ctx.scale(this.scaleAmtX,1);
		else if (ev.key == "e") this.ctx.scale(1/this.scaleAmtX,1);
		else if (ev.key == "z") this.ctx.scale(1,this.scaleAmtY);
		else if (ev.key == "c") this.ctx.scale(1,1/this.scaleAmtY);
		else if (ev.key == "a") this.ctx.translate(this.translateAmt,0);
		else if (ev.key == "d") this.ctx.translate(-this.translateAmt,0);
		else if (ev.key == "s") this.ctx.translate(0,-this.translateAmt);
		else if (ev.key == "w") this.ctx.translate(0,this.translateAmt);
		else if (ev.key == "r") this.translateAmt += 10;
		else if (ev.key == "f") this.translateAmt -= 10;
		else if (ev.key == "t") this.scaleAmtX *= (1+1/(2**4));
		else if (ev.key == "g") this.scaleAmtX /= (1+1/(2**4));
		else if (ev.key == "y") this.scaleAmtY *= (1+1/(2**4));
		else if (ev.key == "h") this.scaleAmtY /= (1+1/(2**4));
	
		this.draw();	
	}

	// Snap input coordinates to grid and return the resulting coord
	snapToGrid(c)
	{
		var out = {
			x: this.cellWidth * Math.floor(c.x/this.cellWidth),
   			y: this.cellHeight * Math.floor(c.y/this.cellHeight)
		};
		return out;
	}

	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		if (this.controlPressed) this.controlLeftClickDown();
		else
		{
			let val = this.screenToWorldCoords(this.coord);
			this.leftClickStart = this.snapToGrid(val);
			this.workingRectangle = new Array(this.leftClickStart,this.leftClickStart);
			this.mousePressed = true;
		}
	}
	controlLeftClickDown()
	{
		let c = {x:this.coord.x, y:this.coord.y};
		c = this.screenToWorldCoords(c);
		for (let i = 0; i < this.rectangleList.length; i++)
			if (this.rectangleCollision(c,this.rectangleList[i])) // if cursor lies inside a rectangle
			{
				this.rectangleList.splice(i,1); // remove the rectangle
				break;
			}
		//this.controlPressed = false;
		this.draw();
	}	

	// Runs on release of left click of mouse
	leftClickUp()
	{
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

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.viewportOutline();

		// Restore the transform
		this.ctx.restore();

		// Now we can actually start drawing

		//draw vertical divisions
		for (var i = 0; i < this.verticalCells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.width/this.verticalCells),0);
			this.ctx.lineTo(i*(this.width/this.verticalCells),this.height);
			this.ctx.stroke();
		}

		//draw horizontal divisions
		for (var i = 0; i < this.horizontalCells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(0,i*(this.height/this.horizontalCells));
			this.ctx.lineTo(this.width,i*(this.height/this.horizontalCells));
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
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}
	// Check if pt lies inside the rectangle 
	rectangleCollision(pt,rect)
	{
		return (rect[0].x <= pt.x && pt.x <= rect[1].x && rect[0].y <= pt.y && pt.y <= rect[1].y);
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
		else text = "Note mode. ";
		text += "Press h for keybinds.";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);
		text = "translate amount: " +this.translateAmt 
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

		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x += this.cellWidth;
		else 
			this.leftClickEnd.x = this.leftClickStart.x+this.cellWidth;

		// Line the two y coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.y <= this.leftClickEnd.y)
			this.leftClickEnd.y += this.cellHeight;
		else
			this.leftClickStart.y += this.cellHeight;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);
	}
}
