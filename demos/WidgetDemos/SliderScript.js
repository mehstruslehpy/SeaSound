//TODO: Add nice animations
//TODO: Add more draw styles
class SliderCanvas 
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	styles = ["solid","lollipop"]; //implemented display styles
	//deleteMode = false;
	controlPressed = false; //indicates whether we area in delete mode or not
	mousePressed = false; //indicates whether or not we are in the middle of a mouse click
	workingSlider = null; //the in progrerss slider
	sliderList = new Array(); //the array of sliders to draw
	
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
		this.radius = this.cellWidth/6; // the radius for lollipop style

		if (!this.styles.includes(rectangleStyle)) throw "Unknown draw style";
		this.rectangleStyle = rectangleStyle;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.buttonClick(ev); });
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.draw();
	}

	buttonClick(ev)
	{
		console.log("Control pressed");
		if (ev.key == "Control") this.controlPressed = true;
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
		if (this.controlPressed) this.controlLeftClickDown();
		else
		{
			this.leftClickStart.x = this.coord.x;
			this.leftClickStart.y = this.coord.y;
			this.workingSlider = Array(this.leftClickStart,this.leftClickStart);
			this.mousePressed = true;
		}
	}

	controlLeftClickDown()
	{
		let c = {x:this.coord.x, y:this.coord.y};
		for (let i = 0; i < this.sliderList.length; i++)
			switch (this.rectangleStyle)
			{
				case "lollipop":
					if (this.lollipopCollision(c,this.sliderList[i]))
					{
						this.sliderList.splice(i,1);
						break;
					}
				case "solid":
					if (this.solidCollision(c,this.sliderList[i]))
					{
						this.sliderList.splice(i,1);
						break;
					}
			}
		this.draw();
	}

	// Runs on release of left click of mouse
	leftClickUp()
	{
		if (this.controlPressed) // control clicks end here
		{
			this.controlPressed = false;
			return;
		}

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

		this.mousePressed = false; // mouse is no longer pressed
		this.workingSlider = null;
		this.sliderList.push([c1,c2]);
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
		// clear the screen
		this.ctx.clearRect(0, 0, this.width, this.height);

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
		
		// Draw text showing the mode
		let text = "Press control to switch to delete mode.";
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);

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
		console.log("Draw slider");
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
		console.log("Slider collision");
		let horiz = slider[0].x <= c.x && c.x <= slider[1].x;
		let vert = c.x >= slider[0].y;
		return horiz && vert;
	}
	distance(a,b)
	{
		return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
	}
}
// Draw the divisions
let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"lollipop");
//let sliderObject = new SliderCanvas(".sliderCanvas",20,20,"solid");
