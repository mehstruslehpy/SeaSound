class TrackLaneCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	mousePressed = false; //record whether the mouse has been pressed
	trackList = new Array(); // tracks are arrays of rectangles specified by their top left and bottom right coords
	workingRectangle = null; // A rectangle not yet saved in the tracklist
	collision = false; // flag tracking whether working rectangle has a collision with a rectangle in trackList
	moveExisting = false;
	controlPressed = false;
	
	// Initial set up
	constructor(query,horizontalCells,verticalCells)
	{
		// Set Up the canvas
		this.canvas = document.querySelector(query);
		this.ctx = this.canvas.getContext("2d");
		let tabsHeight = document.getElementById('tab-container').offsetHeight;
		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		this.verticalCells = 20;
		this.horizontalCells = 20;
		this.cellWidth = this.width/this.horizontalCells;
		this.cellHeight = this.height/this.verticalCells;

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
		console.log("Control press");
    	if (ev.key == "Control") this.controlPressed = true;
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
		console.log("DOWN");
		if (this.controlPressed) this.controlLeftClickDown();
		else
		{
			this.leftClickStart = this.snapToGrid(this.coord);
			this.mousePressed = true;
			this.workingRectangle = new Array(this.leftClickStart,this.leftClickStart);
	
			// check for collisions
			for (let i = 0; i < this.trackList.length; i++)
			{
				// The test point needs to be partially inside the cell to avoid edge case problems
				let c = {x:this.leftClickStart.x+this.cellWidth/2, 
							y:this.leftClickStart.y+this.cellHeight/2};
				if (this.rectangleCollision(c,this.trackList[i])) // working in previous
					this.collision = true;
			}
		}
	}

	controlLeftClickDown()
	{
		console.log("Control left click down");
		let c = {x:this.coord.x, y:this.coord.y};
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
		if (this.controlPressed) // if it was a control press
		{
    		this.controlPressed = false; // untoggle controlPressed var and return
    		return;
		}

		// set up left click coords
		this.leftClickEnd.x = this.coord.x;
		this.leftClickEnd.y = this.coord.y;

		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x = this.coord.x+this.cellWidth;
		else 
			this.leftClickEnd.x = this.leftClickStart.x+this.cellWidth;

		// Line the two y coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.y <= this.leftClickEnd.y)
			this.leftClickEnd.y = this.coord.y+this.cellHeight;
		else
			this.leftClickStart.y += this.cellHeight;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);

		let c1 = { // top left coord of rectangle
			x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   			y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			y: c1.y+this.cellHeight
		};

		// Check the following types of collisions:
		// 1: Right end point of working rectangle in previous rectangle
		// 2: Left end point of previous rectangle in working rectangle
		for (let i = 0; i < this.trackList.length; i++)
		{
			// The test point needs to be partially inside the cell to avoid edge case problems
			let cTest = {x:c2.x-this.cellwidth/2, 
							y:(c1.y+c2.y)/2};
			// same idea for the track list point
			let tTest = {x:this.trackList[i][0].x+this.cellWidth/2, 
							y:(this.trackList[i][0].y+this.trackList[i][1].y)/2};
			if (this.rectangleCollision(cTest,this.trackList[i])) // working in previous
				this.collision = true;
			else if (this.rectangleCollision(tTest,[c1,c2])) // left end of previous in working
				this.collision = true;
		}

		// don't save the rectangle if a collision has happened
		if (!this.collision) this.trackList.push([c1,c2]);
		this.workingRectangle = null;
		this.collision = false;
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

		//TODO: Should the next bit of code only run mousePressed true?
	
		// set up left click coords
		this.leftClickEnd.x = this.coord.x;
		this.leftClickEnd.y = this.coord.y;

		// snap to the grid
		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x = this.coord.x+this.cellWidth;
		else 
			this.leftClickEnd.x = this.leftClickStart.x+this.cellWidth;

		// Line the two y coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.y <= this.leftClickEnd.y)
			this.leftClickEnd.y = this.coord.y+this.cellHeight;
		else
			this.leftClickStart.y += this.cellHeight;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);

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

	// Compute+draw the cell divisions of the display
	draw()
	{
		//clear the screen
		this.ctx.clearRect(0, 0, this.width, this.height);

		//draw vertical divisions
		//this.ctx.fillStyle = "rgb(255 255 255)";
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

		// Draw text showing the mode
		let text = "Press control to switch to delete mode.";
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);

		for (let i = 0; i < this.trackList.length; i++)
		{
			let c1 = this.trackList[i][0];
			let c2 = this.trackList[i][1];
			this.drawRectangle(c1,c2);
		}
		if (this.workingRectangle != null)
			this.drawRectangle(this.workingRectangle[0],this.workingRectangle[1]);

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
	drawRectangle(topLeft,bottomRight)
	{
		// Now we can draw the rectangle 
		this.ctx.fillStyle = "rgb(0 255 0)";
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

}
// Draw the divisions
let trackLaneObject = new TrackLaneCanvas(".trackLaneCanvas",20,40);

