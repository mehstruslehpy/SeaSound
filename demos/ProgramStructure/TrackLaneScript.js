class TrackLaneCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	mousePressed = false; //record whether the mouse has been pressed
	trackList = new Array(); // tracks are arrays of rectangles specified by their top left and bottom right coords
	workingRectangle = null; // A rectangle not yet saved in the tracklist
	existingCollision = false; // flag tracking whether the user has clicked an existing rectangle
	moveIndex = -1; // the index that the collision occurred at 
	controlPressed = false; // tracks whether control has been pressed
	blockSize = 1; // length of the rectangle to draw
	
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

		// Set up the canvas size
		let tabsHeight = document.getElementById('master-tab-container').offsetHeight;
		console.log(tabsHeight);
		document.getElementById("PlaylistEditor").style.display="inline"; // by default TrackEditor is hidden
		tabsHeight += document.getElementById("playlist-controls").offsetHeight;
		document.getElementById("PlaylistEditor").style.display="none";
		console.log(tabsHeight);
		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		
		// Set up cell sizes
		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;
	
		// Compute widths and heights of cells
		this.cellWidth = this.width/this.verticalCells; // the number of vertical cell divisions controls cell widths
		this.cellHeight = this.height/this.horizontalCells; // the number of horizontal cell divisions controls cell heights

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
			controlText += "ctrl: toggle block/delete modes\n";

    	if (ev.key == "Control") this.controlPressed = true;
    	else if (ev.key == "=") this.incrementBlockSize();
    	else if (ev.key == "-") this.decrementBlockSize();
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
		this.mousePressed = true;

		// run the delete handler if control is pressed
		if (this.controlPressed) 
		{
			this.controlLeftClickDown();
			return;
		}

		this.leftClickStart = this.snapToGrid(this.screenToWorldCoords(this.coord));

		// check if a collision has occurred
		let c = {x:this.leftClickStart.x+this.cellWidth/2, 
					y:this.leftClickStart.y+this.cellHeight/2};
		for (let i = 0; i < this.trackList.length; i++)
		{
			// The test point needs to be partially inside the cell to avoid edge case problems
			let c = {x:this.leftClickStart.x+this.cellWidth/2, 
						y:this.leftClickStart.y+this.cellHeight/2};
			if (this.rectangleCollision(c,this.trackList[i]))
			{
				this.existingCollision = true;
				this.moveIndex = i;
				return;
			}
		}

		// calculate the dimensions of the block to be inserted
		this.leftClickEnd.x = this.leftClickStart.x + (this.cellWidth * this.blockSize);
		this.leftClickEnd.y = this.leftClickStart.y + this.cellHeight;

		// the working rectangle
		this.workingRectangle = new Array(this.leftClickStart,this.leftClickEnd);
		this.draw();
	}

	controlLeftClickDown()
	{
		this.mousePressed = false;
		let c = this.screenToWorldCoords(this.coord);
		for (let i = 0; i < this.trackList.length; i++)
    		if (this.rectangleCollision(c,this.trackList[i])) // if cursor lies inside a rectangle
    		{
        		this.trackList.splice(i,1); // remove the rectangle
        		break;
    		}
		this.draw();
	}

	// Runs on release of left click of mouse
	leftClickUp()
	{
		this.mousePressed = false;
	
		// check if control was pressed
		if (this.controlPressed) 
		{
    		this.controlPressed = false; // untoggle controlPressed var and return
			this.draw();
    		return;
		}

		if (this.existingCollision)
		{
			let i = this.moveIndex;

			// Save the entry of the track list that we are attempting to move
			let tempLeft  = {x:this.trackList[i][0].x, y:this.trackList[i][0].y};
			let tempRight  = {x:this.trackList[i][1].x, y:this.trackList[i][1].y};
			
			// remove it from the current track list
			this.trackList.splice(i,1);

			// check if its new position collides with any of the other trackList entries
			let collision = this.rectCollisionCheck(tempLeft,tempRight);

			// if no collision occurred we can readd it, otherwise it will be deleted
			if (!collision) this.trackList.push([tempLeft,tempRight]);

			// We are done moving the track
			this.existingCollision = false;
			this.moveIndex = -1;
			this.draw();
			return;
		}

		// Check if the new rectangle is colliding with any of the existing ones
		let collision = this.rectCollisionCheck(this.leftClickStart,this.leftClickEnd);

		// The coords of the new rectangle to insert in the list
		let newLeft = {x:this.leftClickStart.x, y:this.leftClickStart.y};
		let newRight = {x:this.leftClickEnd.x, y:this.leftClickEnd.y};
		// If no collisions occur we can insert the finished rectangle
		if (!collision) this.trackList.push([newLeft,newRight]);
		this.workingRectangle = null;
		this.draw();
	}
	
	// Check if pt lies inside the rectangle given by track
	rectangleCollision(pt,track)
	{
		return (track[0].x <= pt.x && pt.x <= track[1].x && track[0].y <= pt.y && pt.y <= track[1].y);
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 


		// If the click is to move a block
		if (this.existingCollision)
		{
			let i = this.moveIndex;
			let length = this.trackList[i][1].x - this.trackList[i][0].x
			this.leftClickStart = this.snapToGrid(this.screenToWorldCoords(this.coord));
			this.trackList[i][0].x = this.leftClickStart.x;
			this.trackList[i][0].y = this.leftClickStart.y;
			this.trackList[i][1].x = this.leftClickStart.x + length;
			this.trackList[i][1].y = this.leftClickStart.y+this.cellHeight;
			this.draw();
			return;
		}

		if (this.mousePressed)
		{	
			// set up left click coords
			//this.rectangleHelper();
			
			// Calculate the new mouse coordinates
			this.leftClickStart = this.snapToGrid(this.screenToWorldCoords(this.coord));
			this.leftClickEnd.x = this.leftClickStart.x + (this.cellWidth * this.blockSize);
			this.leftClickEnd.y = this.leftClickStart.y + this.cellHeight;

			// If the mouse is pressed and held there is stuff to draw
			if (this.mousePressed && this.workingRectangle != null) 
			{
				this.workingRectangle[0] = this.leftClickStart;
				this.workingRectangle[1] = this.leftClickEnd;
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

		// draw rectangles
		for (let i = 0; i < this.trackList.length; i++)
		{
			let c1 = this.trackList[i][0];
			let c2 = this.trackList[i][1];
			this.drawRectangle(c1,c2);
		}
		if (this.workingRectangle != null)
			this.drawRectangle(this.workingRectangle[0],this.workingRectangle[1]);

		// Draw the outlines for the canvas too
		this.viewportOutline();
	}
	drawRectangle(topLeft,bottomRight)
	{
		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 0 255)";
		this.ctx.beginPath();
		this.ctx.moveTo(topLeft.x,topLeft.y);
		this.ctx.lineTo(topLeft.x,bottomRight.y);
		this.ctx.lineTo(bottomRight.x,bottomRight.y);
		this.ctx.lineTo(bottomRight.x,topLeft.y);
		this.ctx.fill();
	
		// Draw rectangle outlines
		this.ctx.beginPath();
		this.ctx.moveTo(topLeft.x,topLeft.y);
		this.ctx.lineTo(topLeft.x,bottomRight.y);
		this.ctx.lineTo(bottomRight.x,bottomRight.y);
		this.ctx.lineTo(bottomRight.x,topLeft.y);
		this.ctx.lineTo(topLeft.x,topLeft.y);
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
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

	// Set up left click start and end coords to be at rectangle boundary points
	rectangleHelper()
	{
		// set up left click coords
		this.leftClickEnd = this.screenToWorldCoords(this.coord);

		// snap to the grid
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

	incrementBlockSize()
	{
		this.blockSize++;
		this.draw();
	}
	decrementBlockSize()
	{
		if (this.blockSize > 1) this.blockSize--;
		this.draw();
	}

	rectCollisionCheck(left,right)
	{
		// the return value
		let collision = false;

		// check left endpoint collisions
		for (let i = 0; i < this.trackList.length; i++)
		{
			// The test point needs to be partially inside the cell to avoid edge case problems
			let c = {x:left.x+this.cellWidth/2, y:left.y+this.cellHeight/2};
			if (this.rectangleCollision(c,this.trackList[i])) collision = true;
		}

		// Check the following types of collisions at the right end point:
		// 1: Right end point of working rectangle in previous rectangle
		// 2: Left end point of previous rectangle in working rectangle
		for (let i = 0; i < this.trackList.length; i++)
		{
			// The test point needs to be partially inside the cell to avoid edge case problems
			let cTest = {x:right.x-this.cellwidth/2, y:right.y-this.cellHeight/2};
			// same idea for the track list point
			let tTest = {x:this.trackList[i][0].x+this.cellWidth/2, 
							y:(this.trackList[i][0].y+this.trackList[i][1].y)/2};
			if (this.rectangleCollision(cTest,this.trackList[i]))
				collision = true;
			else if (this.rectangleCollision(tTest,[left,right]))
				collision = true;
		}
		return collision;
	}

	// Converts p a point on the screen (usually a mouse click) to a point in world coords
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
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
		else text = "Block mode. ";
		text += "Press h for keybinds.";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);
		text = "block size: " + this.blockSize;
		text += " translate amount: " +this.translateAmt 
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,3*textHeight);
	}
}
