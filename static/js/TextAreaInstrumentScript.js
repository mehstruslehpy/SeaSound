/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.
*/

/**
* The text area class is the main class for dealing with text area instrument widgets.
* @class
* @public
*/
class TextAreaInstrumentCanvas
{
	/**
	* The name of this instrument.
	*/
	instrumentName = "";
	/**
	* The html id attribute for the text area for this instrument
	*/
	instrumentId = "";

	/**
	* Construct a text area.
	* @param {string} id - String containing html id of the textarea we are constructing for.
	* @param {string} name - String containing the instrument name that this widget corresponds to.
	*/
	constructor(id,name)
	{
		this.instrumentName = name;
		this.instrumentId = id;
		document.getElementById(this.instrumentId).value = "instr "+name +"\n\t// INSTRUMENT CODE GOES HERE\nendin";
	}


	/**
	* This is a dummy method for graph diagram canvas class compatibility. This method does nothing.
	*/
	configureNode(name,inputs,outputs)
	{
		// Dummy function for compatibility with graph diagram canvas class. Does nothing.
	}
	/**
	* Get the text from the textarea element corresponding to this instrument on the page.
	* @returns The text of the instrument.
	*/
	renderToText()
	{
		// Get the text from the textarea on the page.
		return document.getElementById(this.instrumentId).value;
	}
	/**
	* Get the name of this instrument.
	* @returns The name of the instrument.
	*/
	getName()
	{
		return this.instrumentName;
	}
	/**
	* Get the text from the textarea element corresponding to this instrument on the page in a format
	* which matches that of the graph diagrams toText() for saving the instrument to a file.
	* @returns The textual representation of the instrument described above.
	*/
	toText()
	{
		let out = "#".repeat(64) + "\n"; // delimiter
		out += "TextAreaInstrumentCanvas\n";
		out += "\"" + this.instrumentName + "\"\n"; // this should be consistent with the graph canvas file format
		out += this.instrumentId + "\n";
		out += document.getElementById(this.instrumentId).value.replace(/\n/g,"\\n") + "\n";
		return out;
	}
	/**
	* Set up the state of the widget based on the input file.
	* Takes in a 2d array file[i][j] where i indexes across the # delimited sections specified 
	* in toText() and j indexes across the individual lines per section.
	* @param {object} file - The file as a double array of strings to load the graph from.
	*/
	reconfigure(file)
	{
		this.instrumentName = file[0][1].slice(1,-1);
		this.instrumentId = file[0][2];
		document.getElementById(this.instrumentId).value = file[0][3].replace(/\\n/g,"\n");
		//this.draw();
	}
}
