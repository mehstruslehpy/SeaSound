class TextAreaInstrumentCanvas
{
	instrumentName = ""; // The name of this instrument
	instrumentId = ""; // The html id attribute for the text area for this instrument

	// Initial set up
	constructor(id,name)
	{
		this.instrumentName = name;
		this.instrumentId = id;
		document.getElementById(this.instrumentId).value = "instr "+name +"\n\t// INSTRUMENT CODE GOES HERE\nendin";
	}


	configureNode(name,inputs,outputs)
	{
		// Dummy function for compatibility with graph diagram canvas class. Does nothing.
	}

	renderToText()
	{
		// Get the text from the textarea on the page.
		return document.getElementById(this.instrumentId).value;
	}
	getName()
	{
		return this.instrumentName;
	}
	toText()
	{
		let out = "#".repeat(64) + "\n"; // delimiter
		out += "TextAreaInstrumentCanvas\n";
		out += this.instrumentId + "\n";
		out += "\"" + this.instrumentName + "\"\n"; // this should be consistent with the graph canvas file format
		out += document.getElementById(this.instrumentId).value.replace(/\n/g,"\\n") + "\n";
		return out;
	}
	reconfigure(file)
	{
		//this.instrumentName = file[0][2].slice(1,-1);
		//this.instrumentId = file[0][1];
		console.log(this.instrumentName);
		console.log(this.instrumentId);
		document.getElementById(this.instrumentId).value = file[0][3].replace(/\\n/g,"\n");
		//this.draw();
	}
}
