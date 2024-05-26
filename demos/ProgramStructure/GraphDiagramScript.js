//TODO: Set up i/o so that outputs are forced to connect to inputs
//TODO: Add way to delete edges
class GraphDiagramCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	//nodeMode = true; // node mode for drawing nodes, edge mode for drawing edges
	inputModes = ["NODE","DELETE","EDGE"]; // the possible input modes for the canvas
	inputMode = "NODE"; // stores the current input mode of the canvas
	nodeList = new Array(); // we maintain a list of nodes
	edgeList = new Array(); // we maintain a list of edges
	workingEdge = null; // the edge we are currently building
	startEdgeNodeType = null; // indicates whether the edge starts from an input or output node
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
		tabsHeight += document.getElementById("instrument-controls").offsetHeight;

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
		else if (ev.key == "a") this.ctx.translate(this.translateAmt,0);
		else if (ev.key == "d") this.ctx.translate(-this.translateAmt,0);
		else if (ev.key == "s") this.ctx.translate(0,-this.translateAmt);
		else if (ev.key == "w") this.ctx.translate(0,this.translateAmt);
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
			let val = this.screenToWorldCoords(this.coord);
			this.nodeList.push(new Node(val,this.curName,this.curInputs,this.curOutputs,this.ctx));
		}
		else if (this.inputMode == "DELETE")
		{
			this.nodeDelete();
			this.edgeDelete();
			this.inputMode = "NODE";
		}
		else // otherwise we are in edge mode
		{
			let point = this.screenToWorldCoords(this.coord); // convert mouse input to world coords
			// on first click if clicking node add start point to edge structure
			// else do return.
			if (this.workingEdge == null)
			{
				this.workingEdge = new Edge();
				let intersectNode = false;
				for (let i = 0; i < this.nodeList.length; i++)
				{
					let intersectPoint = this.nodeList[i].collision(point);
					if (intersectPoint != null)
					{
						intersectNode = true;
						this.workingEdge.setFrom(intersectPoint);
						this.workingEdge.addSegment(intersectPoint);
						this.startEdgeNodeType = this.nodeList[i].collisionType(intersectPoint);
						console.log(this.startEdgeNodeType);
						// no need to draw in this case
						break;
					}
				}
				if (!intersectNode) 
				{
					// if no intersection, then reset and return to node mode
					this.inputMode = "NODE";
					this.workingEdge = null;
					this.draw();
					return;
				}
				else return;
			}

			// on later clicks add segments to edge structure
			let intersectNode = false; //TODO: Is this still needed here?
			for (let i = 0; i < this.nodeList.length; i++)
			{
				let intersectPoint = this.nodeList[i].collision(point);
				let intersectType = intersectPoint!=null ? this.nodeList[i].collisionType(intersectPoint) : null;

				console.log(intersectType);
				// If the node types at either end of the edge match we should exit immediately
				if (intersectPoint != null && intersectType == this.startEdgeNodeType) return;
				else if (intersectPoint != null)
				{
					intersectNode = true;
					this.workingEdge.setTo(intersectPoint);
					this.workingEdge.addSegment(intersectPoint);
					// edges need to flow from outputs to inputs
					if (this.startEdgeNodeType != "OUTPUT") this.workingEdge.reverse();
					this.edgeList.push(this.workingEdge);
					// The edge is complete so exit edge mode
					this.workingEdge = null;
					this.inputMode = "NODE";
					this.startEdgeNodeType = null;
					this.draw();
					return;
				}
			}

			// add the segment to the edges list also
			this.workingEdge.addSegment(point);
		}
		//draw
		this.draw();
	}

	// Delete the currently selected node
	nodeDelete()
	{
		let point = this.screenToWorldCoords(this.coord);
		for (let i = 0; i < this.nodeList.length; i++)
			if (this.nodeList[i].boundingCollision(point))
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

	// Delete the currently selected edge
	edgeDelete()
	{
		let point = this.screenToWorldCoords(this.coord);
		for (let i = 0; i < this.edgeList.length; i++)
			if (this.edgeList[i].collision(point))
			{
				this.edgeList.splice(i,1);
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
    		let to = {x:this.coord.x, y:this.coord.y}; // the to point in screen coords
			to = this.screenToWorldCoords(to); // convert the to point to world coords
		
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

		// draw all the nodes
		for (let i = 0; i < this.nodeList.length; i++) this.nodeList[i].draw(this.ctx);
	
		// draw the working edge if it exists
		if (this.workingEdge != null) this.workingEdge.draw(this.ctx);
		// draw all the edges
		for (let i = 0; i < this.edgeList.length; i++) this.edgeList[i].draw(this.ctx);
	}

	// print the on screen helper text
	helperText()
	{
		// Draw text showing the mode
		let text = "";
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

	// Converts p a point on the screen (usually a mouse click) to a point in world coords
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
	}

}
class Edge
{
	from = null;
	to = null;
	polyLineList = null;
	collisionRadius = 10.0; // Used for determining radius at which collisions can occur
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

	// Reverse the direction of this edge
	reverse()
	{
		this.polyLineList.reverse(); // reverse the poly line list for this edge
		// swap from and to entries
		let temp = {x:this.from.x, y:this.from.y};
		this.from = {x:this.to.x, y:this.to.y};
		this.to = temp;
	}

	// Detect if the input point collides with this edge
	collision(pt)
	{
		for (let i = 1; i < this.polyLineList.length; i++)
			if (this.intersectSegment(this.polyLineList[i-1],this.polyLineList[i],pt,this.collisionRadius))
				return true
		return false;
	}

	// From: https://codereview.stackexchange.com/questions/192477/circle-line-segment-collision?rq=1
	// return true if line segment thru AB intercepts the circle of given radius at C	
    intersectSegment(A, B, C, radius) 
	{
        var dist;
        const v1x = B.x - A.x;
        const v1y = B.y - A.y;
        const v2x = C.x - A.x;
        const v2y = C.y - A.y;
        // get the unit distance along the line of the closest point to
        // circle center
        const u = (v2x * v1x + v2y * v1y) / (v1y * v1y + v1x * v1x);
        
        // if the point is on the line segment get the distance squared
        // from that point to the circle center
        if(u >= 0 && u <= 1)
		{
            dist  = (A.x + v1x * u - C.x) ** 2 + (A.y + v1y * u - C.y) ** 2;
        } 
		else 
		{
            // if closest point not on the line segment
            // use the unit distance to determine which end is closest
            // and get dist square to circle
            dist = u < 0 ?
                  (A.x - C.x) ** 2 + (A.y - C.y) ** 2 :
                  (B.x - C.x) ** 2 + (B.y - C.y) ** 2;
        }
        return dist < radius * radius;
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
	// Return which type of collision occurred if any else return null
	collisionType(pt)
	{
		// convert input point to local coords
		pt.x -= this.pt.x;
		pt.y -= this.pt.y;

		// check for collisions
		for (let i = 0; i < this.inputList.length; i++)
			if (this.pointInRectangle(pt,this.inputList[i]))
			{
				pt.x += this.pt.x; // convert input point back to global coords
				pt.y += this.pt.y;
				return "INPUT";
			}

		for (let i = 0; i < this.outputList.length; i++)
			if (this.pointInRectangle(pt,this.outputList[i]))
			{
				pt.x += this.pt.x; // convert input point back to global coords
				pt.y += this.pt.y;
				return "OUTPUT";
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
