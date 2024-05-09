//TODO: Add nice animations
class SliderCanvas 
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	styles = ["rectangle","lollipop"]; //implemented display styles
	
	// Initial set up
	constructor(query,horizontalCells,verticalCells,rectangleStyle)
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

		if (!this.styles.includes(rectangleStyle)) throw "Unknown draw style";
		this.rectangleStyle = rectangleStyle;

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
   			//y: this.cellHeight * Math.floor(c.y/this.cellHeight)
   			y: c.y 
		};
		return out;
	}
	// Draw a circle around the input coord
	circleCoord(c)
	{
		let radius = this.cellWidth/6;
		this.ctx.beginPath();
		this.ctx.arc(c.x, c.y, radius, 0, 2 * Math.PI, false);
		this.ctx.fillStyle = 'green';
		this.ctx.fill();
		this.ctx.lineWidth = 2;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}
	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		this.leftClickStart.x = this.coord.x;
		this.leftClickStart.y = this.coord.y;
		//leftClickStart = snapToGrid(coord);
		//console.log("Start: " + this.leftClickStart.x + " " + this.leftClickStart.y);
	}

	// Runs on release of left click of mouse
	leftClickUp()
	{
		// set up left click coords
		this.leftClickEnd.x = this.coord.x;
		this.leftClickEnd.y = this.coord.y;
		// snap to the grid
		this.leftClickStart = this.snapToGrid(this.leftClickStart);
		// Line the two x coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.x <= this.leftClickEnd.x) 
			this.leftClickEnd.x = this.coord.x+this.cellWidth;
		else 
			this.leftClickStart.x += this.cellWidth;
		// Line the two y coords up to snap to the appropriate rectangle edges
		if (this.leftClickStart.y <= this.leftClickEnd.y)
			this.leftClickEnd.y = this.coord.y+this.cellHeight;
		else
			this.leftClickStart.y += this.cellHeight;

		// snap to the grid
		this.leftClickEnd = this.snapToGrid(this.leftClickEnd);

		// Debugging 
		//console.log("Start: " + this.leftClickStart.x + " " + this.leftClickStart.y);
		//console.log("Stop: " + this.leftClickEnd.x + " " + this.leftClickEnd.y);
		//circleCoord(leftClickStart);
		//circleCoord(leftClickEnd);

		let c1 = { // top left coord of rectangle
			x: Math.min(this.leftClickStart.x,this.leftClickEnd.x),
   			y: Math.min(this.leftClickStart.y,this.leftClickEnd.y)
		};
		let c2 = { // bottom right coord of rectangle
			x: Math.max(this.leftClickStart.x,this.leftClickEnd.x),
   			//y: Math.max(leftClickStart.y,leftClickEnd.y)
   			// for a piano roll we force the height of the rectangles to be a single unit 
   			y: c1.y+this.cellHeight
		};

		if (this.rectangleStyle == "solid") this.solidStyle(c1,c2);
		else if (this.rectangleStyle == "lollipop") this.lollipopStyle(c1,c2);
		else throw("Unknown draw style");
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 
		//console.log(coord.x + " " + coord.y);
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
	drawDivisions()
	{
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
let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"lollipop");
//let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"solid");
