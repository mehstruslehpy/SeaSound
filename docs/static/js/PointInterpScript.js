/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.
*/
//TODO: Add sharp angle dropoffs
//TODO: Need to bring this code in line with other widgets and find a way to integrate it with the
//		other parameter widgets elegantly
class PointInterpolationCanvas 
{
	coord = {x:0, y:0}; // the coords of the mouse
	leftClickStart = {x:0, y:0}; // the coords of the mouse at the start of a click
	leftClickEnd = {x:0, y:0}; // the coords of the mouse at the release of a click
	pointList = new Array();
	
	// Initial set up
	constructor(query,horizontalCells,verticalCells,curveStyle)
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
		this.curveStyle = curveStyle;

		var that = this;
		this.canvas.addEventListener('mousedown', function(ev) { that.leftClickDown(); }); 
		this.canvas.addEventListener('mousemove', function(ev) { that.updateMouseCoordinates(); }); 
		this.draw();
	}
	// Draw a circile around the input coord (usually for debugging)
	circleCoord(c)
	{
		let radius = this.cellWidth/4;
		this.ctx.beginPath();
		this.ctx.arc(c.x, c.y, radius, 0, 2 * Math.PI, false);
		this.ctx.lineWidth = 5;
		this.ctx.strokeStyle = 'green';
		this.ctx.stroke();
	}
	// Snap input coordinates to grid and return the resulting coord
	snapToGrid(c)
	{
		var out = {
			x: this.cellWidth * Math.round(c.x/this.cellWidth),
   			y: this.cellHeight * Math.round(c.y/this.cellHeight)
		};
		return out;
	}

	// Runs on pressing down left click of mouse
	leftClickDown()
	{
		this.leftClickStart = this.snapToGrid(this.coord);
		// If two points in the point list have dupe x values update the value in the list and return
		for (let i = 0; i < this.pointList.length; i++)
			if (this.pointList[i].x == this.leftClickStart.x)
			{
				this.pointList[i].y = this.leftClickStart.y
				this.pointList.sort(function(a,b){return a.x < b.x;});
				this.draw();
				return;
			}

		// If not, then just insert the value into the list
		this.pointList.push(this.leftClickStart);
		this.pointList.sort(function(a,b){return a.x < b.x;});
		this.draw();
	}

	// Update the current coordinates of the mouse
	updateMouseCoordinates()
	{
		this.coord.x = event.clientX - this.canvas.offsetLeft; 
		this.coord.y = event.clientY - this.canvas.offsetTop; 
	}


	// Compute+draw the cell divisions of the display
	draw()
	{
		// clear the screen
		this.ctx.clearRect(0, 0, this.width, this.height);
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

		for (let i = 1; i < this.pointList.length; i++)
		{
			let from = this.pointList[i-1];
			let to = this.pointList[i];

			this.ctx.lineWidth = 6;
			this.ctx.strokeStyle = 'black';
			
			this.ctx.beginPath();
			this.ctx.moveTo(from.x,from.y);
			switch (this.curveStyle)
			{
				case "quadratic":
					this.ctx.quadraticCurveTo((from.x+to.x)/2,(from.y+to.y+50),to.x,to.y);
				case "line":
				default:
					this.ctx.lineTo(to.x,to.y);
			}
			this.ctx.stroke();
		}
		for (let i = 0; i < this.pointList.length; i++) this.circleCoord(this.pointList[i]);

	}

}
// Draw the divisions
//let pointInterpolationObject = new PointInterpolationCanvas(".pointInterpCanvas",100,100,"line");

