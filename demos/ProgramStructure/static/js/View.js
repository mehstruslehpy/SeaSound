// TODO: Add load and save code for instruments, widgets, project, etc
// TODO: We might also be able to add a marker on playback to show playback
// TODO: Note sorting seems wrong, need to fix for correct output
// TODO: Node config not working when we have two instruments and change instruments
class View
{
	// There is only one track lane object for the whole program
	trackLaneObject = new TrackLaneCanvas("trackLaneCanvas",10,20);

	// An array to store the list of parameters for the in progress instrument
	paramList = new Array();

	// Contains all instruments indexed by name
	instrumentMap = new Map();
	// Contains all tracks indexed by name
	trackMap = new Map();

	// The default number of cells for a pianoroll widget, there are 88 keys on a piano
	pianoRollVCellDefault = 88;

	//The default number of vertical divisions for slider type widgets
	sliderVCellDefault = 50;

	snapAmount = 1;

	// Opens the corresponding tab
	OpenTab(tabName, btnID) 
	{
		var i;
		var x = document.getElementsByClassName("tab");

		// Hide all the tabs
		for (i = 0; i < x.length; i++) x[i].style.display = "none";

		// Color all the tab buttons 
		var x = document.getElementsByClassName("tab-button");
		for (i = 0; i < x.length; i++) x[i].style.background = "black";

		// Display the selected tab and color in its corresponding button
		document.getElementById(tabName).style.display = "block";
		document.getElementById(btnID).style.background = "green";

		// Reset the parameters on the track editor tab for consistency
		this.ResetParameter();
	}

	// Updates display when drop down is changed
	// This is mainly used for switching tracks/instruments in the track and instrument
	// editor tabs.
	SelectDropDown(divId,value)
	{
		// Get the children canvases
		let children = document.getElementById(divId).children;
		// Hide whichever canvases are not currently selected and display the one that is
		for (let i = 0; i < children.length; i++)
			if (children[i].id == value) children[i].style.display = "inline";
			else children[i].style.display = "none";
		// Changes track editor tab parameter back to 0 regardless of which tab we call this from
		this.ResetParameter();
	}

	// For the pattern selector
	PatternSelect()
	{
		let sel = document.getElementById('pattern-select'); // get the select tag
		let instrument = sel.options[sel.selectedIndex].text; // the text of the selected option
		// get the number of notes
		let notes = this.trackMap.get(instrument)[0].getNotes();
		// get the number of cells per beat
		let beatsPerCell = this.trackMap.get(instrument)[0].getBeatsPerCell();
		// Get the number of beats per block
		let beatsPerBlock = document.getElementById('playlist-bpb').value;
		if (beatsPerBlock == "") beatsPerBlock = document.getElementById('playlist-bpb').placeholder;
		beatsPerBlock = Number(beatsPerBlock);
		// Convert to the number of blocks rounded to the nearest integer
		// TODO: Should this be ceiling, round or floor?
		// TODO: I think this unit conversion is wrong
		let blocks = Math.ceil(beatsPerCell*notes/(beatsPerBlock));
		this.trackLaneObject.setBlockSize(blocks);
		this.trackLaneObject.setBlockName(instrument);
	}

	// Hides all canvases attached to the canvas div
	HideAllCanvases(divId)
	{
		// Get the children canvases
		let children = document.getElementById(divId).children;
		// Hide all canvases
		for (let i = 0; i < children.length; i++) children[i].style.display = "none";
		// Changes track editor tab parameter back to 0 regardless of which tab we call this from
		this.ResetParameter();
	}

	// Add canvas to either the instrument editor or track editor
	AddCanvas(canvasDiv,prefix,name)
	{
		// if the canvasDiv or name is the empty string end early
		if (canvasDiv == "" || name == "") return;

		// Only add new options that don't already exist
		let optionCount = document.getElementById(canvasDiv+"-select").options.length;
		for (let i = 0; i < optionCount; i++)
			if (prefix+"-"+name == document.getElementById(canvasDiv+"-select").options[i].value)
				return;

		// load the display based on which type of canvas we are dealing with
		switch (canvasDiv)
		{
			case "instrument-canvases":
				this.InstrumentCanvasHelper(canvasDiv,name);
				break;
			case "track-canvases": 
				this.TrackCanvasHelper(canvasDiv,name);
				break;
			default:
				break;
		}
	}

	// Hack to catch enter button presses on form inputs for adding canvases
	EnterHandler(e,div,prefix,name)
	{
		if (e && e.keyCode == 13) this.AddCanvas(div,prefix,name);
	}

	// Deletes value from select tag
	DeleteSelectOptionHelper(select,value)
	{
		let selectTag = document.getElementById(select);
		for (var i=0; i<selectTag.length; i++)
			if (selectTag.options[i].value == value)
				selectTag.remove(i);
	}

	// Delete the currently selected track
	DeleteTrackSelection()
	{
		let sel = document.getElementById('track-canvases-select'); // get the select tag
		let value = sel.value; // get the value selected
		let name = sel.options[sel.selectedIndex].text; // the text of the selected option
		this.DeleteSelectOptionHelper('track-canvases-select',value); // delete the options from the select tag
		this.DeleteSelectOptionHelper('pattern-select',value); // same
		document.getElementById('track-canvases-select').value = ""; // reset select value
		document.getElementById('pattern-select').value = ""; // same
		this.HideAllCanvases('track-canvases'); // hide canvases
		this.trackMap.delete(name); // delete selection from track map
	}

	// Delete the currently sselected instrument
	DeleteInstrumentSelection()
	{
		let sel = document.getElementById('instrument-canvases-select'); // get the select tag
		let value = sel.value; // the value selected
		let name = sel.options[sel.selectedIndex].text; // the text of the selected option
		this.DeleteSelectOptionHelper('instrument-canvases-select',value); // delete options from select tag
		document.getElementById('instrument-canvases-select').value = ""; // reset select value
		this.HideAllCanvases('instrument-canvases'); // hide canvases
		this.instrumentMap.delete(name); // delete selection from instrument map

		// Remove the corresponding entry in the track modal dropdown
		let instList = document.getElementById("instruments-datalist");
		for (var i=0; i<instList.options.length; i++)
			if (instList.options[i].value == name)
				instList.children[i].remove();
	}

	// Increase the blocksize for the playlist editor
	IncrementPlaylistBlockSize()
	{
		this.trackLaneObject.incrementBlockSize();
	}

	// decrease the blocksize for the playlist editor
	DecrementPlaylistBlockSize()
	{
		this.trackLaneObject.decrementBlockSize();
	}
	
	// Reset the playlist object
	ResetPlaylist()
	{
		let vCells = document.getElementById("playlist-vertical-cells").value;
		let hCells = document.getElementById("playlist-horizontal-cells").value;
		if (vCells == "") vCells = 20;
		else vCells = Number(vCells);
		if (hCells == "") hCells = 40;
		else hCells = Number(hCells);
		this.trackLaneObject.reset(hCells,vCells);
	}

	// Switch instrument parameter
	NextParameter()
	{
		let name = document.getElementById("track-canvases-select").value;
		name = name.split("-")[1];
		let children = document.getElementById("instrument-"+name).children;
		for (let i = 0; i < children.length; i++)
		{
			if (children[i].style.display == "inline")
			{
				children[i].style.display = "none";
				children[(i+1)%children.length].style.display = "inline";
				document.getElementById("param-num").innerText = "Current Parameter: "+(i+1)%children.length;
				break;
			}
		}
	}

	// Switch instrument parameter
	PrevParameter()
	{
		let name = document.getElementById("track-canvases-select").value;
		name = name.split("-")[1];
		let children = document.getElementById("instrument-"+name).children;
		for (let i = 0; i < children.length; i++)
		{
			if (children[i].style.display == "inline")
			{
				children[i].style.display = "none";
				children[(i-1+children.length)%children.length].style.display = "inline";
				document.getElementById("param-num").innerText = "Current Parameter: "+(i+1)%children.length;
				break;
			}
		}
	}

	// Reset instrument parameters
	ResetParameter()
	{
		let name = document.getElementById("track-canvases-select").value;
		name = name.split("-")[1];
		let ele = document.getElementById("instrument-"+name);
		if (ele == null) return;
		let children = ele.children;
		for (let i = 0; i < children.length; i++)
		{
			children[i].style.display = "none";
		}
		children[0].style.display = "inline";
		document.getElementById("param-num").innerText = "Current Parameter: "+0;
	}

	// This is a hack for reopening the dialog on adding new parameters
	// Our AddParameter() and RemoveParameter() functions below toggle dialogShouldReopen
	// We check dialogShouldReopen on closing our dialog to determine whether we should reshow the dialog
	dialogShouldReopen = false;
	CheckDialogReopen()
	{
		if (!this.dialogShouldReopen) return;
		document.getElementById("track-dialog").showModal();
		this.dialogShouldReopen = false;
	}

	// Add a a parameter to the new instrument modal dialog
	AddParameter()
	{
		//get the selected value
		let selectedValue = document.getElementById("parameter-type-select").value;

		//get the tag to add parameters to
		let pListTag = document.getElementById("param-list");

		//create the tags
		let newRow = document.createElement("tr");
		let content = document.createElement("td");

		// The first "starred" parameter widget is in charge of triggering notes
		// the remaining widgets control parameters for the trigger widget
		if (pListTag.childElementCount == 0) content.innerText = selectedValue + " *";
		else content.innerText = selectedValue;

		//build the new element
		newRow.appendChild(content);
		pListTag.appendChild(newRow);

		//add to our list of parameters
		this.paramList.push(selectedValue);

		// The dialog needs to reopen when we add parameters
		this.dialogShouldReopen = true;
	}

	// Remove a a parameter to the new instrument modal dialog
	RemoveParameter()
	{
		if (this.paramList.length == 0) return;
		this.paramList.splice(0,1); // remove the first item in the list
		let params = document.getElementById("param-list"); // get the params tag
		let elements = params.getElementsByTagName("tr"); // get the elements of params tag
		params.removeChild(elements[0]); // remove the first child of the params tag
		if (elements[0] != null) elements[0].innerText += " *"; // readd the star to first element
		this.dialogShouldReopen = true; // dialog should reopen when we remove params
	}

	// Helper to build all instrument canvases
	InstrumentCanvasHelper(canvasDiv,name)
	{
		// Figure out what type of instrument input we are doing
		let type = document.getElementById("new-instrument-input-type").value;

		// add the associated select entry
		let selectEle = document.getElementById(canvasDiv+"-select");
		let newOption = document.createElement("option");
		newOption.innerText = name;
		selectEle.append(newOption);

		// add to the instrument data list in the track modal
		let dataList = document.getElementById("instruments-datalist");
		let listOption = document.createElement("option");
		listOption.value = name;
		dataList.append(listOption);

		if (type=="graph")
		{
			// add the associated canvas tag
			let ele = document.getElementById(canvasDiv);
			let newCanvas = document.createElement("canvas");
			newCanvas.setAttribute("tabindex","1");
			ele.appendChild(newCanvas);

			newCanvas.setAttribute("id","instrument-"+name);
			newOption.setAttribute("value","instrument-"+name);
			newCanvas.setAttribute("class","trackLaneCanvas");
			let instrumentCanvasObject = new GraphDiagramCanvas("instrument-"+name,name,20);

			// Add the instrument canvas to our map of all instruments
			this.instrumentMap.set(this.CleanName(name),instrumentCanvasObject);
		}
		else
		{
			// add the associated text area tag
			let ele = document.getElementById(canvasDiv);
			let newTextArea = document.createElement("textarea");
			newTextArea.setAttribute("tabindex","1");
			ele.appendChild(newTextArea);

			newTextArea.setAttribute("id","instrument-"+name);
			newTextArea.setAttribute("cols","160");
			newTextArea.setAttribute("rows","20");
			newOption.setAttribute("value","instrument-"+name);
			newTextArea.setAttribute("class","trackLaneCanvas");
			let instrumentCanvasObject = new TextAreaInstrumentCanvas("instrument-"+name,name);

			// Add the instrument canvas to our map of all instruments
			this.instrumentMap.set(this.CleanName(name),instrumentCanvasObject);
		}

		// Clear out old instrument name
		document.getElementById("instrument-name").value = "";
	}

	// Helper to build all track canvases
	TrackCanvasHelper(canvasDiv,name)
	{
		// Exit early if no parameters are specified on confirm button press
		if (this.paramList.length == 0) return;

		// Read in input arguments 
		let hCells = document.getElementById("track-horizontal-cells").value;
		if (hCells == "") hCells = Number(document.getElementById("track-horizontal-cells").placeholder);
		else hCells = Number(hCells);
		let beatsPerCell = document.getElementById("track-beats-per-cell").value;
		if (beatsPerCell == "") beatsPerCell = Number(document.getElementById("track-beats-per-cell").placeholder);
		else beatsPerCell = Number(beatsPerCell);

		// add a div to contain all our parameter canvases
		let ele = document.getElementById(canvasDiv);
		let instDiv  = document.createElement("div");
		instDiv.setAttribute("id","instrument-"+name);
		ele.appendChild(instDiv);

		// add the associated select entry
		let selectEle = document.getElementById(canvasDiv+"-select");
		let newOption = document.createElement("option");
		newOption.value = "instrument-"+name;
		newOption.innerText = name;
		selectEle.append(newOption);

		// Display the currently selected parameter
		document.getElementById("param-num").innerText = "Current Parameter: 0";

		// Collect the canvas objects in a list
		let tempCanv = Array();
		// create one canvas per parameter
		for (let i = 0; i < this.paramList.length; i++)
		{
			// create the canvas
			let newCanvas = document.createElement("canvas");
			newCanvas.setAttribute("tabindex","1");
			newCanvas.setAttribute("id","track-p"+i+"-"+name);
			//newCanvas.setAttribute("class","pianoRollCanvas");
			if (i==0) newCanvas.style.display = "inline";
			else newCanvas.style.display = "none";
			instDiv.appendChild(newCanvas);
			let canvObj = null;
			//if (this.paramList[i]=="Pianoroll")canvObj=new PianoRollCanvas("track-p"+i+"-"+name,vCells,hCells);
			if (this.paramList[i] == "Pianoroll")
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,this.pianoRollVCellDefault,hCells,beatsPerCell);
			else if (this.paramList[i] == "Lollipop")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,this.sliderVCellDefault,hCells,beatsPerCell,"lollipop");
			else if (this.paramList[i] == "Bars")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,this.sliderVCellDefault,hCells,beatsPerCell,"solid");
			else if (this.paramList[i] == "Event")
				canvObj=new CodedEventCanvas("track-p"+i+"-"+name,hCells,beatsPerCell);
			else 
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,this.pianoRollVCellDefault,hCells,beatsPerCell);
			tempCanv.push(canvObj);
		}

		// Add the new track to our map of all tracks
		this.trackMap.set(this.CleanName(name),tempCanv);

		// Register the instruments with each other
		let instname = document.getElementById("instrument-for-track").value
		if (instname == "") instname = "EMPTY-INSTRUMENT";
		for (let i = 0; i < tempCanv.length; i++)
			tempCanv[i].registerInstrument(tempCanv,instname);

		// Set up the canvas trigger modes
		tempCanv[0].setTriggerMode(true);
		for (let i = 1; i < tempCanv.length; i++) tempCanv[i].setTriggerMode(false);

		// Playlist editor needs an associated pattern entry too
		let newPat = document.getElementById("pattern-select");
		let newOpt = document.createElement("option");
		newOpt.innerText = name;
		newOpt.setAttribute("value","instrument-"+name);
		newPat.append(newOpt);

		// Reset the parameter list array here and the parameter list tag in our modal dialog
		this.paramList = new Array();
		let paramListTag = document.getElementById("param-list");
		while (paramListTag.firstChild) paramListTag.removeChild(paramListTag.lastChild);

		// Reset the input boxes
		document.getElementById("track-name").value = "";
		document.getElementById("track-horizontal-cells").value = "";
		//document.getElementById("track-vertical-cells").value = "";
	}

	// Delete whitespace from the input name string
	CleanName(name)
	{
		return name.replace(/\s+/g, '');
	}
	// Configures the currently selected node based on the node dialog
	configureNode()
	{
		let name = document.getElementById("node-name").value;
		let inputs = document.getElementById("node-inputs").value;
		let outputs = document.getElementById("node-outputs").value;
		outputs = this.CleanName(outputs); // clear whitespace
		outputs = outputs.toLowerCase(); // convert to lower case
		outputs = outputs.split(','); // split on commas
		let allowedCases = new Set(["a","k","i","ga","gk","gi","p","S","pvs","w"]); // Collection of allowed values
		outputs = outputs.filter((s) => { return allowedCases.has(s); }); // Filter array using collection
		let sel = document.getElementById('instrument-canvases-select'); // get the select tag
		let instrument = sel.options[sel.selectedIndex].text; // the text of the selected option
		instrument = this.CleanName(instrument);
		if (instrument == "") return;
		this.instrumentMap.get(instrument).configureNode(name,inputs,outputs);
	}
	// Render the currently selected instrument to text
	renderInstrument()
	{
		// Get the instrument text name
		let sel = document.getElementById('instrument-canvases-select'); // get the select tag
		let instrument = sel.options[sel.selectedIndex].text; // the text of the selected option
		instrument = this.CleanName(instrument);
		if (instrument == "") return;
		// Get a string with the instrument code
		let outString = this.instrumentMap.get(instrument).renderToText();
		// Print the instrument code to modal in browser
		document.getElementById("instr-code-dialog").showModal();
		document.getElementById("instrument-code-dialog-output").textContent = outString;
	}
	// Render the currently selected track
	renderTrack(offset,displayModal)
	{
		// Get the track text name
		// TODO: This line with track seems unneeded
		let track = document.getElementById('track-canvases-select').textContent; // get the select tag
		let sel = document.getElementById('track-canvases-select'); // get the select tag
		track = sel.options[sel.selectedIndex].text; // the text of the selected option
		track = this.CleanName(track);
		// Get the beats per minute of the project
		let bpmText = document.getElementById('playlist-bpm').value; // get the select tag
		if (bpmText == "") bpmText = document.getElementById('playlist-bpm').placeholder;
		// Get the track
		let params = this.trackMap.get(track)
		// Geet the note output for the triggering parameter, this includes the start and duration times
		let paramList = params[0].getNoteOutput(Number(bpmText));
		// Prefix each paramList element with the name of the selected instrument
		for (let i = 0; i < paramList.length; i++) paramList[i].unshift(params[0].getName());
		// Add offset times to start times
		for (let i = 0; i < paramList.length; i++) paramList[i][1] += offset;
		// Get the remaining parameters
		for (let i = 1; i < params.length; i++)
		{
			let out = params[i].getNoteOutput(Number(bpmText));
			for (let j = 0; j < out.length; j++) paramList[j].push(out[j][2]);
		}
		// For convenience sort the notes by their start times, csound does this anyway, so this is for easy reading
		params.sort(function(a,b){ return a[1] > b[1]; });
		// Convert the track to a string
		let outStr = "";
		for (let i = 0; i < paramList.length; i++) // for every note 
		{
			outStr += "i \""+paramList[i][0]+"\""; // instrument name, named instruments are surrounded in quotes
			for (let j = 1; j < paramList[i].length; j++) // for every parameter of the note
			{
				outStr += " "+String(paramList[i][j]); // add the parameter to the current line
			}
			outStr += "\n";
		}

		// Print the instrument code to modal in browser
		if (displayModal)
		{
			document.getElementById("track-code-dialog").showModal();
			document.getElementById("track-code-dialog-output").textContent = outStr;
		}
		return outStr;
	}

	renderScore(displayModal)
	{
		// Get the beats per minute of the project
		let bpmText = document.getElementById('playlist-bpm').value; // get the select tag
		if (bpmText == "") bpmText = document.getElementById('playlist-bpm').placeholder;
		// Get the beats per minute of the project
		let bpbText = document.getElementById('playlist-bpb').value; // get the select tag
		if (bpbText == "") bpbText = document.getElementById('playlist-bpb').placeholder;
	
		// get the events we intend to output
		let outEvents = this.trackLaneObject.getOffsetsAndNames(Number(bpmText),Number(bpbText));
		// For convenience sort all of the events
		outEvents.sort(function(a,b){ return a[1] > b[1]; });
		// We will store the score in this string
		let score = "";
		// Get all of the track blocks
		for (let i = 0; i < outEvents.length; i++)
		{
			score += "// track="+outEvents[i][0] + ", offset="+outEvents[i][1]+"\n";
			score += this.renderTrackByName(Number(bpmText),outEvents[i][0],outEvents[i][1]);
			score += "\n"; // add a trailing newline
		}
		// Print the score code to modal in browser
		if (displayModal)
		{
			document.getElementById("score-code-dialog").showModal();
			document.getElementById("score-code-dialog-output").textContent = score;
		}
		return score;
	}	
	// Render a track given the bpm, name and an offset
	renderTrackByName(bpm,name,offset)
	{
		// Get the track
		let params = this.trackMap.get(name);
		// Geet the note output for the triggering parameter, this includes the start and duration times
		let paramList = params[0].getNoteOutput(bpm);
		// Prefix each paramList element with the name of the selected instrument
		for (let i = 0; i < paramList.length; i++) paramList[i].unshift(params[0].getName());
		// Add offset times to start times
		for (let i = 0; i < paramList.length; i++) paramList[i][1] += offset;
		// Get the remaining parameters
		for (let i = 1; i < params.length; i++)
		{
			let out = params[i].getNoteOutput(bpm);
			for (let j = 0; j < out.length; j++) paramList[j].push(out[j][2]);
		}
		// For convenience sort the notes by their start times, csound does this anyway, so this is for easy reading
		params.sort(function(a,b){ return a[1] > b[1]; });
		// Convert the track to a string
		let outStr = "";
		for (let i = 0; i < paramList.length; i++) // for every note 
		{
			outStr += "i \""+paramList[i][0]+"\""; // instrument name, named instruments are surrounded in quotes
			for (let j = 1; j < paramList[i].length; j++) // for every parameter of the note
			{
				outStr += " "+String(paramList[i][j]); // add the parameter to the current line
			}
			outStr += "\n";
		}
		return outStr;
	}
	renderOrchestra(displayModal)
	{
		// Get the instrument text name
		let instrument = document.getElementById('instrument-canvases-select').textContent; // get the select tag
		instrument = this.CleanName(instrument);
		// Get a string with the instrument code
		//let outString = this.instrumentMap.get(instrument).renderToText();
		let outString = "";
		for (const [key,value] of this.instrumentMap)
		{
			outString += "// instrument="+value.getName()+"\n";
			outString += value.renderToText();
			outString += "\n";
		}
		// Print the instrument code to modal in browser
		if (displayModal)
		{
			document.getElementById("instr-code-dialog").showModal();
			document.getElementById("instrument-code-dialog-output").textContent = outString;
		}
		return outString;
	}

	playTrack()
	{
		// get the score and the orchestra strings
		let csd = this.renderCSD(false);
		playCode(csd);
	}
	playPattern()
	{
		let csd = this.renderPatternCSD();
		playCode(csd);
	}
	renderCSD(displayModal)
	{
		let outStr = "<CsoundSynthesizer>\n<CsOptions>\n-odac\n</CsOptions>\n<CsInstruments>\n";
			//outStr += "sr = 44100\nksmps = 32\nnchnls = 2\n0dbfs  = 1\n\n";
		// get the orchestra string
		outStr += this.getOrchestraHeader()+"\n";
		outStr += "//orchestra:\n";
		outStr += this.renderOrchestra(false);
		outStr += this.getOrchestraFooter()+"\n";
		// get the score string
		outStr += "</CsInstruments>\n<CsScore>\n";
		outStr += this.getScoreHeader() +"\n";
		outStr += "//score:\n";
		outStr += this.renderScore(false);
		outStr += this.getScoreFooter()+"\n";
		outStr += "e\n</CsScore>\n</CsoundSynthesizer>\n";
		// Print the score code to modal in browser
		if (displayModal)
		{
			document.getElementById("score-code-dialog").showModal();
			document.getElementById("score-code-dialog-output").textContent = outStr;
		}
		return outStr;
	}
	renderPatternCSD()
	{
		let outStr = "<CsoundSynthesizer>\n<CsOptions>\n-odac\n</CsOptions>\n<CsInstruments>\n";
		// get the orchestra string
		outStr += this.getOrchestraHeader();
		outStr += "//orchestra:\n";
		outStr += this.renderOrchestra(false);
		outStr += this.getOrchestraFooter();
		// get the score string
		outStr += "</CsInstruments>\n<CsScore>\n";
		outStr += this.getScoreHeader() +"\n";
		outStr += "//score:\n";
		outStr += this.renderTrack(false);
		outStr += this.getScoreFooter() +"\n";
		outStr += "e\n</CsScore>\n</CsoundSynthesizer>\n";
		return outStr;
	}
	stopPlayBack()
	{
		stopCsound();
	}
	getOrchestraHeader()
	{
		return "//orchestra header:\n"+document.getElementById("orchestra-header").value;
	}
	getOrchestraFooter()
	{
		return "//orchestra footer:\n"+document.getElementById("orchestra-footer").value;
	}
	getScoreHeader()
	{
		return "//score header:\n"+document.getElementById("score-header").value;
	}
	getScoreFooter()
	{
		return "//score footer:\n"+document.getElementById("score-footer").value;
	}
}

let viewObj = new View();
