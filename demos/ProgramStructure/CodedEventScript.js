class CodedEventCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	
	// Initial set up
	constructor(query,cells)
	{
		// Set Up the canvas
		this.canvas = document.querySelector(query);
		this.ctx = this.canvas.getContext("2d");
		let tabsHeight = document.getElementById('tab-container').offsetHeight;
		this.width = (this.canvas.width = window.innerWidth);
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		this.cells = cells;
		this.cellWidth = this.width/this.cells;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.drawDivisions();
	}

	// Snap input coordinates to grid and return the resulting coord
	snapToGrid(c)
	{
		var out = {
			x: this.cellWidth * Math.floor(c.x/this.cellWidth),
			y: 0
		};
		return out;
	}
	
	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		this.leftClickStart.x = this.coord.x;
		this.leftClickStart.y = 0;
	}

	// Runs on release of left click of mouse
	leftClickUp()
	{
		// set up left click coords
		this.leftClickEnd.x = this.coord.x;
		this.leftClickEnd.y = 0;
		// snap to the grid
		this.leftClickStart = this.snapToGrid(this.leftClickStart);
		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x = this.coord.x+this.cellWidth;
		else 
			this.leftClickStart.x += this.cellWidth;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);

		let c1 = { // top left coord of rectangle
			x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   			y: 0
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			// for a piano roll we force the height of the rectangles to be a single unit 
   			y: 0
		};

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
	
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();

		// The value to display in the rectangles
		let value = prompt("Please enter a value.");
		this.ctx.font = "bold 50px Arial";
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(value,c1.x,this.height/2,Math.abs(c1.x-c2.x));
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 
	}

	// Compute+draw the cell divisions of the display
	drawDivisions()
	{
		//draw vertical divisions
		for (var i = 0; i < this.cells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = 1;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.width/this.cells),0);
			this.ctx.lineTo(i*(this.width/this.cells),this.height);
			this.ctx.stroke();
		}

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
}
// Draw the divisions
//let codedEventObject= new CodedEventCanvas(".codedEventCanvas",40);
