/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.
*/

// TODO: Fix draw error on empty project. Empty project throws an error while doing first draw on project loading.
/**
* The track lane class is used to create and edit arrangements of tracks created by the track editor.
* This allows the construction of larger scale pieces of music with tracks in the track editor as building blocks.
* @class
* @public
*/
class TrackLaneCanvas
{
	/**
	* The coords of the mouse.
	*/
	coord = {x:0, y:0};
	/**
	* the coords of the mouse at the start of a click.
	*/
	leftClickStart = {x:0, y:0};
	/**
	* The coords of the mouse at the release of a click.
	*/
	leftClickEnd = {x:0, y:0};
	/**
	* Tracks if mouse has been pressed or not.
	*/
	mousePressed = false;
	/**
	* The list of tracks created so far.
	* Tracks are stored as a triple containing their top left and bottom right coords as well as the name of the track.
	*/
	trackList = new Array();
	/**
	* The rectangle (track) being created this mouse click.
	*/
	workingRectangle = null;
	/**
	* Flag tracking whether the user has clicked an existing rectangle.
	*/
	existingCollision = false;
	/**
	* The index the collision occured at.
	*/
	moveIndex = -1;
	/**
	* The length of the rectangle/track to draw.
	*/
	blockSize = 1;
	/**
	* The name of the rectangle to draw.
	*/
	blockName = "EMPTY";
	/**
	* Stores the size of the rectangle font. This is initialized here but computed at reset() and on running the constructor.
	*/
	rectangleFontSize = 1;
	/**
	* The line width for rectangles and cell divisions.
	*/
	lineWidth = 0.5;
	/**
	* The width of the seek line.
	*/
	seekLineWidth = 2;
	
	/**
	* Amount translate changes by.
	*/
	translateAmt = 10;
	/**
	* Amount X scaling changes by.
	*/
	scaleAmtX = 1.15;
	/**
	* Amount Y scaling changes by.
	*/
	scaleAmtY = 1.15;

	/**
	* The position of the seek line.
	*/
	seekPos = {x:0, y:0}; 

	/**
	* The various modes a tracklane widget can be in.
	* Seek mode is used for changing the position of the seek line on mouse click.
	* Block mode is used for entering blocks to the widget via mouse click.
	* Delete mode is used for deleting blocks from the widget via mouse click.
	*/
	inputModes = ["SEEK","BLOCK","DELETE"];
	/**
	* The mode that the widget is currently in.
	*/
	inputMode = "BLOCK";

	/**
	* Width of a cell in local, i.e., not screen coords.
	*/
	localWidth = 0;
	/**
	* Height of a cell in local, i.e., not screen coords.
	*/
	localHeight = 0;

	// TODO: We should factor common code from this into reset and just call reset here instead.
	/**
	* Construct a tracklane canvas widget instance and draw it to the screen.
	* @param {string} query - String containing html id of the canvas we are constructing for.
	* @param {number} horizontalCells - The number of horizontal cells to draw.
	* @param {number} verticalCells - The number of vertical cells to draw.
	*/
	constructor(query,horizontalCells,verticalCells)
	{
		// Set Up the canvas
		this.canvas = document.getElementById(query);
		this.ctx = this.canvas.getContext("2d");

		// The height offset for the buttons and tabs of our gui
		let tabsHeight = 2*document.getElementById('tab-container').offsetHeight;
		tabsHeight += document.getElementById("track-controls").offsetHeight;

		// set up canvas and local coord dimensions
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight - tabsHeight;
		this.localWidth = 500;
		this.localHeight = 500;
		
		// Set up cell sizes
		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;
	
		// Compute widths and heights of cells
		this.cellWidth = this.localWidth/this.verticalCells; // the number of vertical cell divisions controls cell widths
		this.cellHeight = this.localHeight/this.horizontalCells; // the number of horizontal cell divisions controls cell heights

		// set up font height
		this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
		while (this.ctx.measureText('@').width < this.cellHeight) // The width of @ approximates height
		{
			this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
			this.rectangleFontSize++;
		}
		this.rectangleFontSize = 0.75*this.rectangleFontSize; // We scale by a padding factor of 75% for vertical fitting

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mouseup', function(ev) { that.leftClickUp(); }); 
		this.canvas.addEventListener('keydown', function(ev) { that.buttonClick(ev); });
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 

		// this displays the track area nicely on my screen
		this.ctx.scale(this.scaleAmtX,1);
		this.ctx.scale(this.scaleAmtX,1);
		this.ctx.scale(this.scaleAmtX,1);
		this.ctx.scale(this.scaleAmtX,1);
		this.ctx.scale(1,1/this.scaleAmtY);
		this.ctx.translate(this.translateAmt,0);
		this.ctx.translate(0,this.translateAmt);
		// do the first draw
		this.draw();
	}

	/**
	* Resets the state of the canvas.
	* Most often this function is used to change the number of horizontal and vertical cells.
	* @param {number} horizontalCells - The number of horizontal cells to draw.
	* @param {number} verticalCells - The number of vertical cells to draw.
	*/
	reset(horizontalCells,verticalCells)
	{
		this.coord = {x:0, y:0}; // the coords of the mouse
		this.leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
		this.leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
		this.mousePressed = false; //record whether the mouse has been pressed
		this.trackList = new Array(); // tracks are arrays of rectangles specified by their top left and bottom right coords
		this.workingRectangle = null; // A rectangle not yet saved in the tracklist
		this.existingCollision = false; // flag tracking whether the user has clicked an existing rectangle
		this.moveIndex = -1; // the index that the collision occurred at 
		this.inputMode = "BLOCK";
		this.blockSize = 1; // length of the rectangle to draw
		this.rectangleFontSize = 1;

		// Set up cell sizes
		this.verticalCells = verticalCells;
		this.horizontalCells = horizontalCells;
	
		// Compute widths and heights of cells
		this.cellWidth = this.localWidth/this.verticalCells; // the number of vertical cell divisions controls cell widths
		this.cellHeight = this.localHeight/this.horizontalCells; // the number of horizontal cell divisions controls cell heights

		// set up font height
		this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
		while (this.ctx.measureText('@').width < this.cellHeight) // The width of @ approximates height
		{
			this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
			this.rectangleFontSize++;
		}
		this.rectangleFontSize = 0.75*this.rectangleFontSize; // We scale by a padding factor of 75% for vertical fitting

		// do the first draw
		this.draw();
	}

	/**
	* Handles button clicks from the user.
	* @param {event} ev - The event containing the button click we are handling.
	*/
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
			controlText += "=-: increment/decrement block sizes\n";
			//controlText += "ctrl: toggle block/delete modes\n";
			controlText += "1/2/3: switch between block/seek/delete mode\n";
			controlText += "4: reset the seek line position\n";

		if (ev.key == "1") 
		{
			this.inputMode = "BLOCK";
			this.workingRectangle = null;
			this.draw();
		}
		else if (ev.key == "2") 
		{
			this.inputMode = "SEEK";
			this.workingRectangle = null;
			this.draw();
		}
		else if (ev.key == "3") 
		{
			this.inputMode = "DELETE";
			this.workingRectangle = null;
			this.draw();
		}
		else if (ev.key == "4")
		{
			this.seekPos = {x:0, y:0};
			this.draw();
		}
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

	/**
	* Snap input coordinates to grid and return the resulting coord
	* @param {number} c - the coordinate to snap to the grid.
	* @returns The coordinate resulting from snapping c to the grid.
	*/
	snapToGrid(c)
	{
		var out = {
			x: this.cellWidth * Math.floor(c.x/this.cellWidth),
   			y: this.cellHeight * Math.floor(c.y/this.cellHeight)
		};
		return out;
	}

	/**
	* Handle when mouse left click is pressed down.
	*/
	leftClickDown()
	{
		this.mousePressed = true;

		// run the delete handler if in delete mode
		if (this.inputMode == "DELETE") 
		{
			this.deleteModeLeftClickDown();
			this.draw();
			return;
		}
		else if (this.inputMode == "SEEK") // if in seek mode we only need to change the seek line position
		{
			this.seekPos.x = this.screenToWorldCoords(this.coord).x;
			this.draw();
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
	/**
	* Handle left click presses while in delete mode.
	*/
	deleteModeLeftClickDown()
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

	/**
	* Handle release of mouse left click.
	*/
	leftClickUp()
	{
		this.mousePressed = false;

		if (this.inputMode == "SEEK" || this.inputMode == "DELETE") return;

		if (this.existingCollision)
		{
			let i = this.moveIndex;

			// Save the entry of the track list that we are attempting to move
			let tempLeft  = {x:this.trackList[i][0].x, y:this.trackList[i][0].y};
			let tempRight  = {x:this.trackList[i][1].x, y:this.trackList[i][1].y};
			let tempName = this.trackList[i][2];
			
			// remove it from the current track list
			this.trackList.splice(i,1);

			// check if its new position collides with any of the other trackList entries
			let collision = this.rectCollisionCheck(tempLeft,tempRight);

			// if no collision occurred we can readd it, otherwise it will be deleted
			if (!collision) this.trackList.push([tempLeft,tempRight,tempName]);

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
		if (!collision) this.trackList.push([newLeft,newRight,this.blockName]);
		this.workingRectangle = null;
		this.draw();
	}
	
	/**
	* Checks if point pt lies inside rectangle rect.
	* @param {object} pt - Point to test for inclusion.
	* @param {object} track - Rectangle/track (array containing topleft/bottom right coords) to test inclusion of pt against.
	* @returns true or false depending on if pt lies in rect.
	*/
	rectangleCollision(pt,track)
	{
		return (track[0].x <= pt.x && pt.x <= track[1].x && track[0].y <= pt.y && pt.y <= track[1].y);
	}

	/**
	* Update the current coordinates of the mouse.
	*/
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

	/**
	* Draw the current state of the widget to the screen.
	*/
	draw()
	{
		// First we need to clear the old background 

		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		// Restore the transform
		this.ctx.restore();

		// Now we can actually start drawing

		//draw vertical divisions
		for (var i = 0; i < this.verticalCells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.beginPath();
			this.ctx.moveTo(i*(this.localWidth/this.verticalCells),0);
			this.ctx.lineTo(i*(this.localWidth/this.verticalCells),this.localHeight);
			this.ctx.stroke();
		}

		//draw horizontal divisions
		for (var i = 0; i < this.horizontalCells; i++)
		{
			this.ctx.strokeStyle = 'black';
			this.ctx.lineWidth = this.lineWidth;
			this.ctx.beginPath();
			this.ctx.moveTo(0,i*(this.localHeight/this.horizontalCells));
			this.ctx.lineTo(this.localWidth,i*(this.localHeight/this.horizontalCells));
			this.ctx.stroke();
		}

		// draw rectangles
		for (let i = 0; i < this.trackList.length; i++)
		{
			let c1 = this.trackList[i][0];
			let c2 = this.trackList[i][1];
			let name = this.trackList[i][2];
			this.drawRectangle(c1,c2,name);
		}
		if (this.workingRectangle != null)
			this.drawRectangle(this.workingRectangle[0],this.workingRectangle[1],this.blockName);

		// draw seek line
		this.ctx.strokeStyle = 'red';
		this.ctx.lineWidth = this.seekLineWidth;
		this.ctx.beginPath();
		this.ctx.moveTo(this.seekPos.x,0);
		this.ctx.lineTo(this.seekPos.x,this.localHeight);
		this.ctx.stroke();

		// Draw the outlines for the canvas too
		this.drawRectangleOutline({x:0,y:0},{x:this.localWidth,y:this.localHeight});

		// Now we want to draw the outlines for the helper text on top of the canvas
		// Store the current transformation matrix
		this.ctx.save();

		// Use the identity matrix while clearing the canvas
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);

		// Draw outline and helper text to fixed positions in viewport
		this.helperText();
		this.drawRectangleOutline({x:0,y:0},{x:this.canvas.width,y:this.canvas.height});

		// Restore the transform
		this.ctx.restore();

	}
	/**
	* Draw a rectangle with the given points and color.
	* @param {object} c1 - Object denoting top left coord of rectangle.
	* @param {object} c2 - Object denoting bottom right coord of rectangle.
	* @param {string} name - String containing the name of the rectangle.
	*/
	drawRectangle(topLeft,bottomRight,name)
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
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();

		// draw the text
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();

		// get the correct height
		this.ctx.textBaseline = "bottom";
		this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
		this.ctx.fillStyle = 'black';
		this.ctx.fillText(name,topLeft.x,topLeft.y+this.cellHeight,Math.abs(topLeft.x-bottomRight.x)*0.90);
		this.ctx.textBaseline = "alphabetic";
	}
	/**
	* Draw a rectangle outline with the given points.
	* @param {object} c1 - Object denoting top left coord of rectangle.
	* @param {object} c2 - Object denoting bottom right coord of rectangle.
	*/
	drawRectangleOutline(c1,c2)
	{
		this.ctx.beginPath();
		this.ctx.moveTo(c1.x,c1.y);
		this.ctx.lineTo(c1.x,c2.y);
		this.ctx.lineTo(c2.x,c2.y);
		this.ctx.lineTo(c2.x,c1.y);
		this.ctx.lineTo(c1.x,c1.y);
		this.ctx.lineWidth = this.lineWidth;
		this.ctx.strokeStyle = 'black';
		this.ctx.stroke();
	}

	// TODO: This should probably be renamed to match the other widgets.
	/**
	* Helper that sets up leftClickEnd and leftClickStarts coordinates.
	*/
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

	/**
	* Used for incrementing blocksize variable.
	*/
	incrementBlockSize()
	{
		this.blockSize++;
		this.draw();
	}
	/**
	* Used for incrementing blocksize variable.
	*/
	decrementBlockSize()
	{
		if (this.blockSize > 1) this.blockSize--;
		this.draw();
	}

	/**
	* This function is used to check if the rectangle specified by [left,right]
	* collides with (i.e. intersects) any other rectangles in our list of rectangles.
	* This function returns true if so and false otherwise.
	* @param {object} left - The left endpoint of the rectangle.
	* @param {object} right - The right endpoint of the rectangle.
	* @returns True or false depending on if the input rectangle intersects any of the rectangles in our track list so far.
	*/
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


	/**
	* Converts the coordinates of the input point in screen coordinates to local/world coordinates.
	* @param {object} p - Point to convert.
	* @returns A new point with transformed x and y coords.
	*/
	screenToWorldCoords(p)
	{
		// get and invert the canvas xform coords, then apply them to the input point
		return this.ctx.getTransform().invertSelf().transformPoint(p);
	}


	/**
	* Prints helper text to the top right corner of the widget.
	*/
	helperText()
	{
		// Draw text showing the mode
		let text = ""
		if (this.inputMode == "SEEK") text = "Seek mode. ";
		else if (this.inputMode == "BLOCK") text = "Block mode. ";
		else if (this.inputMode == "DELETE") text = "Delete mode. ";
		else text = "Unknown mode. ";
		text += "Press h for keybinds.";
	
		this.ctx.font = "bold 25px Arial";
		this.ctx.fillStyle = 'black';
		let textHeight = this.ctx.measureText('M').width; // The width of capital M approximates height
		let textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,textHeight);
		text = "block size: " + this.blockSize + ", block name: "+this.blockName;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,2*textHeight);
		text = "x zoom amount: " + this.scaleAmtX.toFixed(2);
		text += ", y zoom amount: " + this.scaleAmtY.toFixed(2);
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,3*textHeight);
		text = "translate amount: " +this.translateAmt;
		textWidth = this.ctx.measureText(text).width;
		this.ctx.fillText(text,this.canvas.width-textWidth,4*textHeight);
	}
	/**
	* Used for setting the block size variable.
	* @param {number} sz - The new block size.
	*/
	setBlockSize(sz)
	{
		this.blockSize = sz;
		this.draw();
	}
	/**
	* Used for setting the block name variable.
	* @param {number} sz - The new block name.
	*/
	setBlockName(name)
	{
		this.blockName = name;
		this.draw();
	}

	// TODO: I think the paramList can be deleted here.
	/**
	* Creates an array containing the name of each block and its start offset in seconds.
	* @param {number} bpm - The beats per minute value to use for time conversion.
	* @param {number} bpb - The beats per block value to use for time conversion.
	* @param {number} paramList - This parameter is deprecated and will be removed in later versions
	* @returns An array of tuples containing each track name and its start offset time in seconds.
	*/
	getOffsetsAndNames(bpm,bpb,paramList)
	{
		// The array we will output to
		let outArr = new Array();
		// Convert start time to offset cell time
		for (let i = 0; i < this.trackList.length; i++)
		{
			let offsetCell = this.coordToCell(this.trackList[i][0].x);
			let offsetTime = this.cellsToSeconds(offsetCell,bpm,bpb);
			let name = this.trackList[i][2];
			outArr.push([name,offsetTime]);
		}

		return outArr;
	}
	/**
	* Round an x coord to its cell value.
	* @param {number} n - x coord to round.
	* @returns the corresponding cell value of n.
	*/
	coordToCell(n)
	{
		return Math.round(n/this.cellWidth);
	}
	/**
	* Convert a raw cell number to a value in seconds.
	* @param {number} c - The cell number to convert.
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @param {number} bpb - Beats per block, required to do unit conversion of times.
	* @returns Converted value described above.
	*/
	cellsToSeconds(c,bpm,bpb)
	{
		// the start time in seconds
		let cellsPerSecond = bpm * (1/60);
		return bpb * c / cellsPerSecond;
	}
	// Get the horizontal position of the seek bar in seconds
	/**
	* Get the horizontal position of the seek bar in seconds
	* @param {number} bpm - Beats per minute, required to do unit conversion of times.
	* @param {number} bpb - Beats per block, required to do unit conversion of times.
	* @returns The position of the seekbar in seconds.
	*/
	seekToSeconds(bpm,bpb)
	{
		//return this.cellsToSeconds(this.seekPos.x,bpm,bpb);
		let val = this.coordToCell(this.seekPos.x);
		return this.cellsToSeconds(val,bpm,bpb);
	}
	/**
	* Set up the state of the widget based on the input argument.
	* @param {object} state - The state used to configure the widget.
	*/
	reconfigure(state)
	{
		//coord = {x:0, y:0}; // the coords of the mouse
		//leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
		//leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
		//mousePressed = false; //record whether the mouse has been pressed
		this.trackList = state.trackList;
		this.workingRectangle = state.trackList;
		//existingCollision = false; // flag tracking whether the user has clicked an existing rectangle
		//moveIndex = -1; // the index that the collision occurred at 
		//this.inputMode = state.inputMode;
		this.blockSize = state.blockSize;
		this.blockName = state.blockName;
	
		// values for changing the scale and translate amount
		this.translateAmt = state.translateAmt;
		this.scaleAmtX = state.scaleAmtX;
		this.scaleAmtY = state.scaleAmtY;
		
		// Set up cell sizes
		this.localHeight = state.localHeight;
		this.localWidth = state.localWidth;
		this.verticalCells = state.verticalCells;
		this.horizontalCells = state.horizontalCells;
	
		// Compute widths and heights of cells
		this.cellWidth = this.localWidth/this.verticalCells; // the number of vertical cell divisions controls cell widths
		this.cellHeight = this.localHeight/this.horizontalCells; // the number of horizontal cell divisions controls cell heights

		// set up font height
		this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
		while (this.ctx.measureText('@').width < this.cellHeight) // The width of @ approximates height
		{
			this.ctx.font = "bold "+this.rectangleFontSize+"px Arial";
			this.rectangleFontSize++;
		}
		this.rectangleFontSize = 0.75*this.rectangleFontSize; // We scale by a padding factor of 75% for vertical fitting
		this.draw();
	}
}
