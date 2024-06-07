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
}
