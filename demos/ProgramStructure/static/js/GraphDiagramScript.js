// TODO: Need to add code to render graph diagram to csound instrument code
// TODO: Need to add code to name the instrument too
// TODO: Need to control output variable prefixes better, the current output won't work in csound
// TODO: Add a nice text area for textual instrument input
// TODO: Need to fix node deletion order to be like pianoroll
// TODO: Cannot redraw edges after they have been deleted
class GraphDiagramCanvas
{
	coord = {x:0, y:0}; // the coords of the mouse
	//nodeMode = true; // node mode for drawing nodes, edge mode for drawing edges
	inputModes = ["NODE","DELETE","EDGE"]; // the possible input modes for the canvas
	inputMode = "NODE"; // stores the current input mode of the canvas
	nodeList = new Array(); // we maintain a list of nodes
	edgeList = new Array(); // we maintain a list of edges
	workingEdge = null; // the edge we are currently building
	workingStartNode = null; // the first node we clicked while building an edge
	startEdgeNodeType = null; // indicates whether the edge starts from an input or output node
	curInputs = 2; // number of inputs for next node
	curOutputs = ""; // number of outputs for next node
	curName = "Default"; // the name of the next node

	instrumentName = ""; // The name of this instrument

	// values for changing the scale and translate amount
	translateAmt = 10;
	scaleAmt = 1.15;

	// Initial set up
	constructor(query,name,size)
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

		// Set up the instrument name
		this.instrumentName = name;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.mButtonClick(ev); }); 
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.draw();
	}


	// Configure the nodes that are created on left click in node mode
	configureNode(name,inputs,outputs)
	{
		this.curName = name;
		this.curInputs = inputs;
		this.curOutputs = outputs;
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
			//controlText += "4: increment input count\n"
			//controlText += "5: decrement input count\n"
			//controlText += "6: increment output count\n"
			//controlText += "7: decrement output count\n"
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
		//else if (ev.key == "4") this.curInputs++;
		//else if (ev.key == "5" && this.curInputs > 0) this.curInputs--;
		//else if (ev.key == "6") this.curOutputs++;
		//else if (ev.key == "7" && this.curOutputs > 0) this.curOutputs--;
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
						this.workingStartNode = this.nodeList[i];
						this.startEdgeNodeType = this.nodeList[i].collisionType(intersectPoint);
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

				// If the node types at either end of the edge match we should exit immediately
				if (intersectPoint != null && intersectType == this.startEdgeNodeType) return;
				else if (intersectPoint != null)
				{
					intersectNode = true;
					this.workingEdge.setTo(intersectPoint);
					this.workingEdge.addSegment(intersectPoint);
					// edges need to flow from outputs to inputs
					if (this.startEdgeNodeType != "OUTPUT") this.workingEdge.reverse();
					// Register the inputs and outputs of the two nodes
					if (this.startEdgeNodeType != "OUTPUT")
					{
						// Get the to/from parameter number where the collision occured
						// In this case recall the working edge has been reversed
						let fromParam = this.nodeList[i].collisionOutputParam(this.workingEdge.getFrom());
						let toParam = this.workingStartNode.collisionInputParam(this.workingEdge.getTo());
						// We can only have one input per input rectangle of any given node
						// So the node and edge is set up correctly only if adding the input succeeds
						if (this.workingStartNode.addInputNode(this.nodeList[i],fromParam,toParam))
						{
							this.nodeList[i].addOutputNode(this.workingStartNode,fromParam,toParam);
							this.edgeList.push(this.workingEdge);
						}
					}
					else
					{
						// Get the to/from parameter number where the collision occured
						let toParam = this.nodeList[i].collisionInputParam(this.workingEdge.getTo());
						let fromParam = this.workingStartNode.collisionOutputParam(this.workingEdge.getFrom());
						// We can only have one input per input rectangle of any given node
						// So the node and edge is set up correctly only if adding the input succeeds
						if (this.nodeList[i].addInputNode(this.workingStartNode,fromParam,toParam))
						{
							this.workingStartNode.addOutputNode(this.nodeList[i],fromParam,toParam);
							this.edgeList.push(this.workingEdge);
						}
					}
					// The edge is complete so exit edge mode
					this.workingStartNode = null;
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

	renderToText()
	{
		// Get all of the nodes with no outputs first
		let startNodes = Array();
		for (let i = 0; i < this.nodeList.length; i++)
			if (this.nodeList[i].outputNodeCount() == 0) 
			{
				startNodes.push(this.nodeList[i]);
			}

		// If there are no nodes with outputs then the instrument is not in a printable state
		if (startNodes.length == 0) 
		{
			console.log("Error: Instrument has no well defined outputs");
			return;
		}


		// The string we will output
		let outString = "";
	
		// Print the instrument name using csound instrument name syntax
		outString = "instr "+this.instrumentName+"\n";

		// Print the instrument nodes
		for (let i = 0; i < startNodes.length; i++) 
			if (!startNodes[i].getPrintFlag())
				outString += startNodes[i].renderToText();

		// Print endin to signify end of instrument block
		outString += "endin\n";

		// Reset all the printflags for later prints
		for (let i = 0; i < this.nodeList.length; i++) this.nodeList[i].setPrintFlag(false);

		// Return the string containing our instrument code
		return outString;
	}
	getName()
	{
		return this.instrumentName;
	}
}

class Edge
{
	from = null; // The coord this edge starts from
	to = null; // The coord this edge ends to
	polyLineList = null; // Polyline list of segments connecting from point to to point
	collisionRadius = 10.0; // Used for determining radius at which collisions can occur

	// Construct this edge
	constructor()
	{	
		this.polyLineList = new Array();
	}
	// Return true if this edge has an empty polyline
	empty()
	{
		return (this.polyLineList.length == 0);
	}
	// Get the from coord of this edge
	getFrom() { return this.from; }
	// Get the to coord of this edge
	getTo() { return this.to; }
	// Set the from coord of this edge
	setFrom(n)
	{
		this.from = n;
	}
	// Set the to coord of this edge
	setTo(n)
	{
		this.to = n;
	}
	// Add a segment to the end of our polyline 
	addSegment(n)
	{
		let val = {x: n.x, y:n.y};
		this.polyLineList.push(val);
	}
	// Draw this edge
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

// TODO: Want to make this a static variable in Node class, but kept get NaN errors
nodeCount = 0; // Tracks the number of nodes we have created so far
class Node
{
	height = 100; // height of the rectangle
	fontSize = 25; // the size of the font for our rectangle
	width = 100; // width of the rectangle
	inputList = Array(); // the list of input rectangles
	outputList = Array(); // the list of output rectangles
	name = ""; // the name of this node
	pt = {x:0, y:0}; // the location of this node

	inputNodes = Array(); // The list of nodes hooked up to be inputs to this node
	outputNodes = Array(); // The list of nodes hooked up to be outputs from this node
	outTypes = ""; // string containing the types corresponding to each output
	// Mapping of output type to colors for drawing
	// Color palette generated from here: https://mokole.com/palette.html
	outputColorMap = new Map([["a","#006400"],
								["k","#00008b"],
								["i","#b03060"],
								["ga","#ff0000"],
								["gk","#ffff00"],
								["gi","#00ff00"],
								["p","#00ffff"],
								["S","#ff00ff"],
								["pvs","#6495ed"],
								["w","#ffdead"]]);

	printedFlag = false; // a flag used to determine if the current node has been printed

	id = -1; // an identifier for the current node

	constructor(pt,name,inputs,outputs,ctx)
	{	
		// Generate and assign an id for the current node
		this.id = nodeCount++;
		this.pt.x = pt.x;
		this.pt.y = pt.y;
		let rHeight = this.height/3; // Height of rectangle is divided into thirds based on inputs, name, outputs
		let rinWidth = this.width/inputs;
		let routWidth = this.width/outputs.length;
		for (let i = 0; i < inputs; i++) // build the list of input rectangles
		{
			let topLeft = {x:rinWidth*i, y:0};
			let bottomRight = {x:rinWidth*(i+1), y:rHeight};
			this.inputList.push([topLeft,bottomRight]);
			this.inputNodes.push(null);
		}
		this.outTypes = outputs;
		for (let i = 0; i < outputs.length; i++) // build the list of output rectangles
		{
			let topLeft = {x:routWidth*i, y:2*rHeight};
			let bottomRight = {x:routWidth*(i+1), y:3*rHeight};
			this.outputList.push([topLeft,bottomRight]);
			this.outputNodes.push(null);
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
	// Return which input parameter number the input point collides with or -1 if no collision
	collisionInputParam(pt)
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
				return i;
			}

		// convert input point back to global coords
		pt.x += this.pt.x;
		pt.y += this.pt.y;
		return -1;
	}
	// Return which output parameter number the output collides with or -1 if no collision
	collisionOutputParam(pt)
	{
		// convert input point to local coords
		pt.x -= this.pt.x;
		pt.y -= this.pt.y;

		for (let i = 0; i < this.outputList.length; i++)
			if (this.pointInRectangle(pt,this.outputList[i]))
			{
				pt.x += this.pt.x; // convert input point back to global coords
				pt.y += this.pt.y;
				return i;
			}

		// convert input point back to global coords
		pt.x += this.pt.x;
		pt.y += this.pt.y;
		return -1;
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
			let outColor = this.outputColorMap.get(this.outTypes[i]);
			this.drawRectangle(this.outputList[i],ctx,"black",outColor);
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

	// Return the number of input nodes for this node
	inputNodeCount()
	{
		return this.inputNodes.length;
	}

	// Return the number of input nodes for this node
	outputNodeCount()
	{
		return this.outputNodes.length;
	}

	// Add an input node to the list of input nodes
	// We cannot have multiple outputs connect to the same input
	// So return true if the adding the new node is successful
	// return false otherwise
	addInputNode(node,fromParam,toParam)
	{
		if (this.inputNodes[toParam]!=null) return false;
		this.inputNodes[toParam] = [node,fromParam,toParam];
		return true;
	}

	// Add an output node to the list of output nodes
	// We can have arbitrarily many output nodes
	addOutputNode(node,fromParam,toParam)
	{
		this.outputNodes[fromParam] = [node,fromParam,toParam];
	}

	getName()
	{ return this.name; }

	renderToText()
	{
		// We recursively build the following string
		let outString = "";

		// Print the inputs to this node if they have not already been printed
		for (let i = 0; i < this.inputNodeCount(); i++) 
			if (this.inputNodes[i]!=null && !this.inputNodes[i][0].getPrintFlag())
				outString += this.inputNodes[i][0].renderToText();

		// We can now print the current node
		this.printedFlag = true;

		// Build the list of input parameters to this opcode
		let params = Array();
		for (let i = 0; i < this.inputNodeCount(); i++)
			if(this.inputNodes[i]!=null)
			{
				let str = this.inputNodes[i][0].getOutputType(this.inputNodes[i][1]);
					str += this.inputNodes[i][0].getName();
					str += "_";
					str += this.inputNodes[i][0].getId();
					str += "_";
					str += this.inputNodes[i][1];
				params.push(str);
			}
			else params.push("NULL");
		let paramStr = "";
		for (let i = 0; i < params.length; i++)
			if (i==params.length-1) paramStr += params[i]; // last param has no comma
			else paramStr += params[i]+", ";	

		// Set up parentheses for function notation
		if (params.length > 0) paramStr = "("+paramStr+")";
		else paramStr = "";

		// Build the list of outputs
		let outputs = "";
		for (let i = 0; i < this.outputNodeCount(); i++)
			if (i==this.outputNodeCount()-1) 
				outputs += this.outTypes[i]+this.getName()+"_"+this.getId()+"_"+i+" = "; // last output is to left of =
			else 
				outputs += this.outTypes[i]+this.getName()+"_"+this.getId()+"_"+i+", ";	
	
		outString += "\t"+outputs+this.getName()+paramStr+"\n";
		return outString;	
	}
	

	// Some basic getters and setters
	getOutputType(n)
	{ return this.outTypes[n]; }
	getId()
	{ return this.id; }
	getPrintFlag()
	{ return this.printedFlag; }
	setPrintFlag(flag)
	{ this.printedFlag = flag; }
}
// Draw the divisions
//let graphDiagramObject = new GraphDiagramCanvas(".graphDiagramCanvas",20);
