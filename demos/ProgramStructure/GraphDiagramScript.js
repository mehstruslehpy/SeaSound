class GraphDiagramCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	nodeMode = true; // node mode for drawing nodes, edge mode for drawing edges
	nodeList = new Array(); // we maintain a list of nodes
	edgeList = new Array(); // we maintain a list of edges
	workingEdge = null;
	
	// Initial set up
	constructor(query,size)
	{
		// Set Up the canvas
		this.canvas = document.querySelector(query);
		this.ctx = this.canvas.getContext("2d");
		this.width = (this.canvas.width = window.innerWidth);
		let tabsHeight = document.getElementById('tab-container').offsetHeight;
		this.height = (this.canvas.height = window.innerHeight - tabsHeight);
		this.nodeRadius = size;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.mButtonClick(ev); }); 
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.draw();
	}

	mButtonClick(ev)
	{
		this.nodeMode = !this.nodeMode;
		this.workingEdge = null; // reset the working edge
		this.draw();
	}

	// returns distance between points a and b
	distance(a,b)
	{
		return Math.sqrt( (a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y) );
	}
	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		if (this.nodeMode)
		{
			// add node to nodeList
			let val = {x: this.coord.x, y: this.coord.y};
			this.nodeList.push(val);
		}
		else
		{
			// on first click if clicking node add start point to edge structure
			// else do return.
			if (this.workingEdge == null)
			{
				this.workingEdge = new Edge();
				let intersectNode = false;
				for (let i = 0; i < this.nodeList.length; i++)
					if (this.distance(this.coord,this.nodeList[i]) < this.nodeRadius)
					{
						intersectNode = true;
						this.workingEdge.setFrom(this.nodeList[i]);
						this.workingEdge.addSegment(this.nodeList[i]);
						// no need to draw in this case
						break;
					}
				if (!intersectNode) 
				{
					// if no intersection, then reset and return to node mode
					this.nodeMode = !this.nodeMode;
					this.workingEdge = null;
					this.draw();
					return;
				}
				else return;
			}

			// on later clicks add segments to edge structure
			let intersectNode = false;
			for (let i = 0; i < this.nodeList.length; i++)
				if (this.distance(this.coord,this.nodeList[i]) < this.nodeRadius)
				{
					intersectNode = true;
					// The edge is complete so exit edge mode
					this.workingEdge.setTo(this.nodeList[i]);
					this.workingEdge.addSegment(this.nodeList[i]);
					this.edgeList.push(this.workingEdge);
					this.workingEdge = null;
					this.nodeMode = !this.nodeMode; 
					this.draw();
					return;
				}

			// add the segment to the edges list also
			this.workingEdge.addSegment(this.coord);
		}
		//draw
		this.draw();
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 
	}

	// Draw a circle around the input coord (usually for debugging)
	circleCoord(c)
	{
		let radius = this.nodeRadius;
		this.ctx.beginPath();
		this.ctx.arc(c.x, c.y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = 5;
		this.ctx.strokeStyle = 'black';
		this.ctx.fillStyle= 'green';
		this.ctx.fill();
		this.ctx.stroke();
	}

	// Compute draw the display
	draw()
	{
		// clear the screen
		this.ctx.clearRect(0, 0, this.width, this.height);
		// draw the working edge if it exists
		if (this.workingEdge != null) this.workingEdge.draw(this.ctx);
		// draw all the edges
		for (let i = 0; i < this.edgeList.length; i++) this.edgeList[i].draw(this.ctx);
		// draw all the nodes
		for (let i = 0; i < this.nodeList.length; i++) this.circleCoord(this.nodeList[i]);
	
		// Draw text showing the mode
		let text = "";
		if (this.nodeMode) text = "Node mode, press m to change mode.";
		else text = "Edge mode, press m to change mode.";
	
		this.ctx.font = "bold 50px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);
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
class Edge
{
	from = null;
	to = null;
	polyLineList = null;
	constructor()
	{	
		this.polyLineList = new Array();
	}
	empty()
	{
		return (this.polyLineList.length == 0);
	}
	setFrom(n)
	{
		this.from = n;
	}
	setTo(n)
	{
		this.to = n;
	}
	addSegment(n)
	{
		let val = {x: n.x, y:n.y};
		this.polyLineList.push(val);
	}
	draw(ctx)
	{	
		for (let i = 1; i < this.polyLineList.length; i++)
		{
			// drawing edge
    		let from = this.polyLineList[i-1];
    		let to = this.polyLineList[i];
		
    		ctx.lineWidth = 6;
    		ctx.strokeStyle = 'black';

    		ctx.beginPath();
    		ctx.moveTo(from.x,from.y);
           	ctx.lineTo(to.x,to.y);
    		ctx.stroke();
		}
	}
}
