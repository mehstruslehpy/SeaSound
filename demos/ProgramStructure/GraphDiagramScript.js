//TODO: Test node deletion functionality more. Kind of a mess.
//TODO: Add canvas zoom in/out and translation
//TODO: Set up i/o so that outputs are forced to connect to inputs
//TODO: Add code to render instruments
class GraphDiagramCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	//nodeMode = true; // node mode for drawing nodes, edge mode for drawing edges
	inputModes = ["NODE","DELETE","EDGE"]; // the possible input modes for the canvas
	inputMode = "NODE"; // stores the current input mode of the canvas
	nodeList = new Array(); // we maintain a list of nodes
	edgeList = new Array(); // we maintain a list of edges
	workingEdge = null;
	curInputs = 2; // number of inputs for next node
	curOutputs = 3; // number of outputs for next node
	curName = "Default"; // the name of the next node

	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmt = 1.15;

	// Initial set up
	constructor(query,size)
	{
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");
		this.width = (this.canvas.width = window.innerWidth);

		// for some reason 2*tab-container height works but not using master-tab-container directly
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		//document.getElementById("InstrumentEditor").style.display="inline"; // by default PlaylistEditor is hidden
		tabsHeight += document.getElementById("instrument-controls").offsetHeight;
		//document.getElementById("InstrumentEditor").style.display="none";

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
		let controlText = "";
			// Maybe add explanation of mouse click controls too
			controlText += "1: enter node mode\n"
			controlText += "2: enter edge mode\n"
			controlText += "3: enter delete mode\n"
			controlText += "n: change rectangle name\n"
			controlText += "4: increment input count\n"
			controlText += "5: decrement input count\n"
			controlText += "6: increment output count\n"
			controlText += "7: decrement output count\n"
			controlText += "h: display keybinds\n";
			controlText += "wasd: scroll viewport\n";
			controlText += "qe: scale viewport\n";
			controlText += "rf: change amount to translate by\n";
			controlText += "tg: change amount to zoom by\n";
	
		if (ev.key == "1")
		{
			this.inputMode = "NODE";
			this.workingEdge = null; // reset the working edge
			this.draw();	
		}
		else if (ev.key == "2")
		{
			this.inputMode = "EDGE";
			this.workingEdge = null; // reset the working edge
			this.draw();	
		}
		else if (ev.key == "3")
		{
			this.inputMode = "DELETE";
			this.workingEdge = null; // reset the working edge
			this.draw();	
		}
		else if (ev.key == "n") 
		{
			let out = prompt("Enter rectangle name");
			if (out != null) this.curName = out;
			else this.curName = "empty";
		}
		else if (ev.key == "4") this.curInputs++;
		else if (ev.key == "5" && this.curInputs > 0) this.curInputs--;
		else if (ev.key == "6") this.curOutputs++;
		else if (ev.key == "7" && this.curOutputs > 0) this.curOutputs--;
		else if (ev.key == "h") alert(controlText);
		else if (ev.key == "q") this.ctx.scale(this.scaleAmt,this.scaleAmt);
		else if (ev.key == "e") this.ctx.scale(1/this.scaleAmt,1/this.scaleAmt);
		else if (ev.key == "a") this.ctx.translate(-this.translateAmt,0);
		else if (ev.key == "d") this.ctx.translate(this.translateAmt,0);
		else if (ev.key == "s") this.ctx.translate(0,this.translateAmt);
		else if (ev.key == "w") this.ctx.translate(0,-this.translateAmt);
		else if (ev.key == "r") this.translateAmt += 10;
		else if (ev.key == "f") this.translateAmt -= 10;
		else if (ev.key == "t") this.scaleAmt *= (1+1/(2**4));
		else if (ev.key == "g") this.scaleAmt /= (1+1/(2**4));
		this.draw();	
	}

	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		if (this.inputMode == "NODE")
		{
			// add node to nodeList
			let val = {x: this.coord.x, y: this.coord.y};
			this.nodeList.push(new Node(val,this.curName,this.curInputs,this.curOutputs,this.ctx));
		}
		else if (this.inputMode == "DELETE")
		{
			this.nodeDelete();
			this.inputMode = "NODE";
		}
		else // otherwise we are in edge mode
		{
			// on first click if clicking node add start point to edge structure
			// else do return.
			if (this.workingEdge == null)
			{
				this.workingEdge = new Edge();
				let intersectNode = false;
				for (let i = 0; i < this.nodeList.length; i++)
				{
					let intersectPoint = this.nodeList[i].collision(this.coord);
					if (intersectPoint != null)
					{
						intersectNode = true;
						this.workingEdge.setFrom(intersectPoint);
						this.workingEdge.addSegment(intersectPoint);
						// no need to draw in this case
						break;
					}
				}
				if (!intersectNode) 
				{
					// if no intersection, then reset and return to node mode
					//this.nodeMode = !this.nodeMode;
					this.inputMode = "NODE";
					this.workingEdge = null;
					this.draw();
					return;
				}
				else return;
			}

			// on later clicks add segments to edge structure
			let intersectNode = false;
			for (let i = 0; i < this.nodeList.length; i++)
			{
				let intersectPoint = this.nodeList[i].collision(this.coord);
				if (intersectPoint != null)
				{
					intersectNode = true;
					this.workingEdge.setTo(intersectPoint);
					this.workingEdge.addSegment(intersectPoint);
					this.edgeList.push(this.workingEdge);
					// The edge is complete so exit edge mode
					this.workingEdge = null;
					//this.nodeMode = !this.nodeMode; 
					this.inputMode = "NODE";
					this.draw();
					return;
				}
			}

			// add the segment to the edges list also
			this.workingEdge.addSegment(this.coord);
		}
		//draw
		this.draw();
	}

	// Delete the currently selected node
	nodeDelete()
	{
		for (let i = 0; i < this.nodeList.length; i++)
			if (this.nodeList[i].boundingCollision(this.coord))
			{
				for (let j = 0; j < this.edgeList.length; j++)
				{
					
					let fromCollision = this.nodeList[i].boundingCollision(this.edgeList[j].getFrom());
					let toCollision = this.nodeList[i].boundingCollision(this.edgeList[j].getTo());
					if (fromCollision || toCollision)
					{
						this.edgeList.splice(j,1);
						j--;
					}
				}
				this.nodeList.splice(i,1);
				break;
			}
	}
	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 
		if (this.inputMode != "NODE" && this.workingEdge != null) // draw the work in progress edge if needed
		{
			this.draw();
			// drawing working edge
			let index = this.workingEdge.polyLineList.length - 1; // this is not very good encapsulation
    		let from = this.workingEdge.polyLineList[index]; // this is not very good encapsulation
    		let to = {x:this.coord.x, y:this.coord.y};
		
    		this.ctx.lineWidth = 6;
    		this.ctx.strokeStyle = 'black';

    		this.ctx.beginPath();
    		this.ctx.moveTo(from.x,from.y);
           	this.ctx.lineTo(to.x,to.y);
    		this.ctx.stroke();
		}
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
		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.width, this.height);

		// Restore the transform
		this.ctx.restore();

		// draw all the nodes
		for (let i = 0; i < this.nodeList.length; i++) this.nodeList[i].draw(this.ctx);
	
		// draw the working edge if it exists
		if (this.workingEdge != null) this.workingEdge.draw(this.ctx);
		// draw all the edges
		for (let i = 0; i < this.edgeList.length; i++) this.edgeList[i].draw(this.ctx);
	
		// Draw text showing the mode
		let text = "";
		/*
		if (this.nodeMode) text = "Node mode. Press h for keybinds ";
		else text = "Edge mode. Press h for keybinds ";
		*/
		if (this.inputMode == "NODE") text = "Node mode. Press h for keybinds ";
		else if (this.inputMode == "EDGE") text = "Edge mode. Press h for keybinds ";
		else if (this.inputMode == "DELETE") text = "Delete mode. Press h for keybinds ";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,textHeight);
		text = "inputs: " + this.curInputs + ", outputs: " + this.curOutputs + ", name: "+this.curName+" ";
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,2*textHeight);
		text = "translate amount: " +this.translateAmt +", zoom amount: " + this.scaleAmt.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.width-textWidth,3*textHeight);

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

		//this.ctx.scale(this.xScale,this.yScale);
		//this.ctx.resetTransform();
		//this.ctx.translate(this.xTranslate,this.yTranslate);
		//this.ctx.restore();
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
	getFrom() { return this.from; }
	getTo() { return this.to; }
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
			
			// draw direction arrow at midpoint
			let midpt = {x: (from.x+to.x)/2, y: (from.y+to.y)/2};
			this.arrow_helper(ctx,from,midpt);
		}
	}
	// helper to draw arrows on segments based on SO code
	arrow_helper(ctx,from,to)
	{
  		var headlen = 20; // length of arrow head in pixels
  		var dx = to.x - from.x;
  		var dy = to.y - from.y;
  		var angle = Math.atan2(dy, dx);
  		ctx.lineWidth = 4;
   		ctx.strokeStyle = 'black';
    	ctx.beginPath();
  		ctx.moveTo(from.x, from.y);
  		ctx.lineTo(to.x, to.y);
  		ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI / 6), to.y - headlen * Math.sin(angle - Math.PI / 6));
  		ctx.moveTo(to.x, to.y);
  		ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI / 6), to.y - headlen * Math.sin(angle + Math.PI / 6));
    	ctx.stroke();
	}
}

class Node
{
	height = 100; // height of the rectangle
	fontSize = 25; // the size of the font for our rectangle
	width = 100; // width of the rectangle
	inputList = Array(); // the list of input rectangles
	outputList = Array(); // the list of output rectangles
	name = ""; // the name of this node
	pt = {x:0, y:0}; // the location of this node
	
	constructor(pt,name,inputs,outputs,ctx)
	{	
		this.pt.x = pt.x;
		this.pt.y = pt.y;
		//if (inputs == 0 && outputs == 0) throw "Node must have at least one input or output"
		let rHeight = this.height/3; // Height of rectangle is divided into thirds based on inputs, name, outputs
		let rinWidth = this.width/inputs;
		let routWidth = this.width/outputs;
		for (let i = 0; i < inputs; i++) // build the list of input rectangles
		{
			let topLeft = {x:rinWidth*i, y:0};
			let bottomRight = {x:rinWidth*(i+1), y:rHeight};
			this.inputList.push([topLeft,bottomRight]);
		}
		for (let i = 0; i < outputs; i++) // build the list of output rectangles
		{
			let topLeft = {x:routWidth*i, y:2*rHeight};
			let bottomRight = {x:routWidth*(i+1), y:3*rHeight};
			this.outputList.push([topLeft,bottomRight]);
		}
		// we also need to pick a font height that will fit our box correctly
		ctx.font = "bold "+this.fontSize+"px Arial";
		while (ctx.measureText('M').width > rHeight) // the width of a capital M approximates height
		{
			this.fontSize--;
			ctx.font = "bold "+this.fontSize+"px Arial";
		}
		this.name = name;
	}

	// if collision with input rectangle occurs return its midpoint, else return null
	collision(pt)
	{
		// convert input point to local coords
		pt.x -= this.pt.x;
		pt.y -= this.pt.y;
		// check for collisions
		for (let i = 0; i < this.inputList.length; i++)
			if (this.pointInRectangle(pt,this.inputList[i]))
			{
				// Take midpoint of collision rectangle
				let midx = (this.inputList[i][0].x+this.inputList[i][1].x)/2;
				let midy = (this.inputList[i][0].y+this.inputList[i][1].y)/2;
				// Convert output point to global coords	
				midx += this.pt.x;
				midy += this.pt.y;
				return {x: midx, y: midy};
			}
		for (let i = 0; i < this.outputList.length; i++)
			if (this.pointInRectangle(pt,this.outputList[i]))
			{
				let midx = (this.outputList[i][0].x+this.outputList[i][1].x)/2;
				let midy = (this.outputList[i][0].y+this.outputList[i][1].y)/2;
				midx += this.pt.x;
				midy += this.pt.y;
				return {x: midx, y: midy};
			}
		// convert input point back to global coords
		pt.x += this.pt.x;
		pt.y += this.pt.y;
		
		return null;
	}
	// return true if point collides inside the bounds of the rectangle
	boundingCollision(pt)
	{
		let collision = false
		// convert input point to local coords
		pt.x -= this.pt.x;
		pt.y -= this.pt.y;

		let origin = {x:0,y:0};
		let boundary = {x:this.width,y:this.height};
		if (this.pointInRectangle(pt,[origin,boundary])) collision = true;

		// convert input point back to global coords
		pt.x += this.pt.x;
		pt.y += this.pt.y;
	
		return collision;
	}
	draw(ctx)
	{	
		// switch to local coords
		ctx.translate(this.pt.x,this.pt.y);
	
		// draw outline
		let origin = {x:0,y:0};
		let boundary = {x:this.width,y:this.height};
		this.drawRectangle([origin,boundary],ctx,"black","white");
	
		for (let i = 0; i < this.inputList.length; i++)
		{
			this.drawRectangle(this.inputList[i],ctx,"black","blue");
		}
		
		for (let i = 0; i < this.outputList.length; i++)
		{
			this.drawRectangle(this.outputList[i],ctx,"black","green");
		}
		//draw name next
		let midPt = this.height/2;
		let pad = 5;
		ctx.font = "bold "+this.fontSize+"px Arial";
		ctx.fillStyle = 'black';
		ctx.fillText(this.name,0,midPt+pad,this.width);

		// switch back to regular coords
		ctx.translate(-this.pt.x,-this.pt.y);
	}
	drawRectangle(pt,ctx,outlineColor,fillColor)
	{
    	// Now we can draw the rectangle 
    	ctx.beginPath();
    	ctx.moveTo(pt[0].x,pt[0].y);
    	ctx.lineTo(pt[0].x,pt[1].y);
    	ctx.lineTo(pt[1].x,pt[1].y);
    	ctx.lineTo(pt[1].x,pt[0].y);
    	ctx.lineTo(pt[0].x,pt[0].y);
    	ctx.fillStyle = fillColor;
    	ctx.fill();
	
    	// Draw rectangle outlines
    	ctx.beginPath();
    	ctx.moveTo(pt[0].x,pt[0].y);
    	ctx.lineTo(pt[0].x,pt[1].y);
    	ctx.lineTo(pt[1].x,pt[1].y);
    	ctx.lineTo(pt[1].x,pt[0].y);
    	ctx.lineTo(pt[0].x,pt[0].y);
    	ctx.lineWidth = 2;
    	ctx.strokeStyle = outlineColor;
    	ctx.stroke();
	}
	pointInRectangle(pt,rect)
	{
		let xBound = rect[0].x <= pt.x && pt.x <= rect[1].x;
		let yBound = rect[0].y <= pt.y && pt.y <= rect[1].y;
		return xBound && yBound;
	}

}
// Draw the divisions
//let graphDiagramObject = new GraphDiagramCanvas(".graphDiagramCanvas",20);
