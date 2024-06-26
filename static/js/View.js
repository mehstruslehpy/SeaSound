// TODO: Add seekbars to widgets
// TODO: renderCSD should emit a statements rather than B statements for seek time, need to fix this.
//			for some reason a statements don't work in my version of csound.
// TODO: Tracklane section requires clicking to redraw
// TODO: All coords in widgets need to be modified to be screen agnostic. I.e., we need a real global/local coord split.
// TODO: Make all widget interfaces modal like graph and tracklane, then add note highlighting+copy/paste/delete functionality.
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
	pianoRollVCellDefault = 176;

	//The default number of vertical divisions for slider type widgets
	sliderVCellDefault = 50;

	snapAmount = 1;

	// Array containing [name, data] pairs corresponding to all loaded audio files
	audioFiles = new Array();

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
		name = name.replace(/instrument-/g,"");
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
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,name,this.pianoRollVCellDefault,hCells,beatsPerCell);
			else if (this.paramList[i] == "Lollipop")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,name,this.sliderVCellDefault,hCells,beatsPerCell,"lollipop");
			else if (this.paramList[i] == "Bars")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,name,this.sliderVCellDefault,hCells,beatsPerCell,"solid");
			else if (this.paramList[i] == "Event")
				canvObj=new CodedEventCanvas("track-p"+i+"-"+name,name,hCells,beatsPerCell);
			else 
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,name,this.pianoRollVCellDefault,hCells,beatsPerCell);
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
		let type = document.getElementById("node-output-type").value;
		outputs = this.CleanName(outputs); // clear whitespace
		outputs = outputs.toLowerCase(); // convert to lower case
		outputs = outputs.split(','); // split on commas
		let allowedCases = new Set(["a","k","i","ga","gk","gi","p","S","pvs","w"]); // Collection of allowed values
		outputs = outputs.filter((s) => { return allowedCases.has(s); }); // Filter array using collection
		let sel = document.getElementById('instrument-canvases-select'); // get the select tag
		let instrument = sel.options[sel.selectedIndex].text; // the text of the selected option
		instrument = this.CleanName(instrument);
		if (instrument == "") return;
		this.instrumentMap.get(instrument).configureNode(name,inputs,outputs,type);
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
		// Get the note output for the triggering parameter, this includes the start and duration times
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
		// TODO: Is this line needed?
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
		/*
		// Get the beats per min and beats per block of the track
		let bpm = document.getElementById('playlist-bpm').value;
		if (bpm == "") bpm = document.getElementById('playlist-bpm').placeholder;
		let bpb = document.getElementById('playlist-bpb').value;
		if (bpb == "") bpb = document.getElementById('playlist-bpb').placeholder;
		bpm = Number(bpm);
		bpb = Number(bpb);
		let seekPos = this.trackLaneObject.seekToSeconds(bpm,bpb)
		*/

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
		// Get the beats per min and beats per block of the track
		let bpm = document.getElementById('playlist-bpm').value;
		if (bpm == "") bpm = document.getElementById('playlist-bpm').placeholder;
		let bpb = document.getElementById('playlist-bpb').value;
		if (bpb == "") bpb = document.getElementById('playlist-bpb').placeholder;
		bpm = Number(bpm);
		bpb = Number(bpb);
		let seekPos = this.trackLaneObject.seekToSeconds(bpm,bpb)

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
		//outStr += "//advance time:\n";
		//outStr += "a 0 0 "+seekPos+"\n"; // skip to seekPos seconds into track
		outStr += "B -"+seekPos+"\n"; // a statements do not work for me for some reason
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
		outStr += this.getOrchestraHeader() + "\n";
		outStr += "//orchestra:\n";
		outStr += this.renderOrchestra(false);
		outStr += this.getOrchestraFooter() + "\n";
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
	saveInstrument()
	{
		// Get the instrument text name
		let sel = document.getElementById('instrument-canvases-select'); // get the select tag
		let instrument = sel.options[sel.selectedIndex].text; // the text of the selected option
		instrument = this.CleanName(instrument);
		if (instrument == "") return;

		// the filename and contents of the file to be downloaded
		let filename = instrument+".synth";
		let text = this.instrumentMap.get(instrument).toText();

		// create and click an invisible link to the file we intend to download, then remove the link.
		// Comes from SO
		let element = document.createElement('a');
		element.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(text))
		element.setAttribute('download',filename);
		element.style.display = 'none'
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	loadInstrument()
	{
		// This is mostly from SO

		// Open a file picker
		let input = document.createElement('input');
		input.type = 'file';

		input.onchange = e => { 
			// getting a hold of the file reference
			let file = e.target.files[0]; 

			// setting up the reader
			let reader = new FileReader();
			reader.readAsText(file,'UTF-8');

			// When the reader is done reading we can load/setup the instrument
			reader.onload = readerEvent => {
				let text = readerEvent.target.result; // this is the content!
				let instrument = this.buildInstrument(text);
			}

		}

		input.click();
	}
	// Build instrument given instrument state
	buildInstrument(text)
	{
		// break file down into an array of arrays of lines
		let file = text.split("#".repeat(64)+"\n");
		file.shift(); // remove the empty starting line
		for (let i = 0; i < file.length; i++)
		{
			file[i] = file[i].split("\n");
			file[i].pop(); // remove empty ending line
		}

		// Build the page elements for the canvas
		let canvasDiv = "instrument-canvases";
		let name = "";
		if (file[0][0] == "GraphDiagramCanvas")
			name = JSON.parse(file[0][1]).instrumentName; // This is slow and probably unnecessary
		else if (file[0][0] == "TextAreaInstrumentCanvas")
		{
			name = file[0][1].slice(1,-1);
		}

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

		newOption.setAttribute("value","instrument-"+name);

		// Figure out which type of canvas we are loading
		let instrumentCanvasObject = null;
		if (file[0][0] == "GraphDiagramCanvas")
		{
			// add the associated canvas tag
			let ele = document.getElementById(canvasDiv);
			let newCanvas = document.createElement("canvas");
			newCanvas.setAttribute("tabindex","1");
			ele.appendChild(newCanvas);

			newCanvas.setAttribute("id","instrument-"+name);
			newCanvas.setAttribute("class","trackLaneCanvas");

			instrumentCanvasObject = new GraphDiagramCanvas("instrument-"+name,name,20);
		}
		else if (file[0][0] == "TextAreaInstrumentCanvas")
		{
			// add the associated textarea tag
			let ele = document.getElementById(canvasDiv);
			let newTextArea = document.createElement("textarea");
			newTextArea.setAttribute("tabindex","1");
			ele.appendChild(newTextArea);

			newTextArea.setAttribute("id","instrument-"+name);
			newTextArea.setAttribute("cols","160");
			newTextArea.setAttribute("rows","20");
			newTextArea.setAttribute("class","trackLaneCanvas");
	
			instrumentCanvasObject = new TextAreaInstrumentCanvas("instrument-"+name,name);
		}
		else console.log("ERROR: file type read error");

		// Add the instrument canvas to our map of all instruments
		this.instrumentMap.set(this.CleanName(name),instrumentCanvasObject);
		// reconfigure the widget using our file data
		instrumentCanvasObject.reconfigure(file);	
	
	}
	saveTrack()
	{
		// Get the track text name
		let sel = document.getElementById('track-canvases-select'); // get the select tag
		let track = sel.options[sel.selectedIndex].text; // the text of the selected option
		track = this.CleanName(track);
		if (track== "") return;

		// the filename and contents of the file to be downloaded
		let filename = track+".track";
		track = this.trackMap.get(track);

		// Convert the track to text, but ignore the instruments value to avoid circularity
		let text = JSON.stringify(track, (key,value) => {
			if(key == "instrument")
			{
				return new Array();
			}
			else return value;
		});

		// create and click an invisible link to the file we intend to download, then remove the link.
		// Comes from SO
		let element = document.createElement('a');
		element.setAttribute('href','data:text/plain;charset=utf-8,'+encodeURIComponent(text))
		element.setAttribute('download',filename);
		element.style.display = 'none'
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	}
	loadTrack()
	{
		// This is mostly from SO

		// Open a file picker
		let input = document.createElement('input');
		input.type = 'file';

		input.onchange = e => { 
			// getting a hold of the file reference
			let file = e.target.files[0]; 

			// setting up the reader
			let reader = new FileReader();
			reader.readAsText(file,'UTF-8');

			// When the reader is done reading we can load/setup the instrument
			reader.onload = readerEvent => {
				let text = readerEvent.target.result; // this is the content!
				let instrument = this.buildTrack(text,file.name);
			}
		}

		input.click();
	}

	// TODO: The naming here for the constructors "track-p blah blah" should probably be changed
	buildTrack(text,filename)
	{
		filename = filename.split(".track")[0];
		// Parse the text from our file
		let trackName = JSON.parse(text)[0].trackName;
		let temp = JSON.parse(text);

		// Build the corresponding html tags for this instrument
		// add a div to contain all our parameter canvases
		let ele = document.getElementById("track-canvases");
		let instDiv  = document.createElement("div");
		instDiv.setAttribute("id","instrument-"+filename);
		ele.appendChild(instDiv);

		// add the associated select entry
		let selectEle = document.getElementById("track-canvases-select");
		let newOption = document.createElement("option");
		newOption.value = "instrument-"+filename;
		newOption.innerText = filename;
		selectEle.append(newOption);

		// Display the currently selected parameter
		document.getElementById("param-num").innerText = "Current Parameter: 0";

		// Playlist editor needs an associated pattern entry too
		let newPat = document.getElementById("pattern-select");
		let newOpt = document.createElement("option");
		newOpt.innerText = filename;
		newOpt.setAttribute("value","instrument-"+filename);
		newPat.append(newOpt);

		// Build the actual instrument from the file i.e. an array of parameter widgets
		let instr = new Array();
		for (let i = 0; i < temp.length; i++)
		{
		// create the canvas
			let newCanvas = document.createElement("canvas");
			newCanvas.setAttribute("tabindex","1");
			newCanvas.setAttribute("id","track-p"+i+"-"+filename);
			if (i==0) newCanvas.style.display = "inline";
			else newCanvas.style.display = "none";
			instDiv.appendChild(newCanvas);
		
			let workingWidget = null;
			if (temp[i].widgetType == "PianoRollCanvas") 
				workingWidget = new PianoRollCanvas("track-p"+i+"-"+filename,trackName,0,0,0);
			else if (temp[i].widgetType == "SliderCanvas")
				workingWidget = new SliderCanvas("track-p"+i+"-"+filename,trackName,0,0,0,"lollipop");
			else if (temp[i].widgetType == "CodedEventCanvas")
				workingWidget = new CodedEventCanvas("track-p"+i+"-"+filename,trackName,0,0);
			else console.log("ERROR: invalid parameter type on track load.");
			//temp[i].name = filename;
			workingWidget.reconfigure(temp[i]);
			workingWidget.setInstrument(instr);
			instr.push(workingWidget);
		}
		
		this.trackMap.set(this.CleanName(filename),instr);
	}
	saveProject()
	{
		let projName = prompt("Input the project name.");
		var zip = new JSZip();

		// Add the instruments to the zip file
		for (const val of this.instrumentMap.values())
			zip.file(projName+"/instruments/"+val.getName()+".synth", val.toText());

		// Add the tracks to the zipfile
		for (const val of this.trackMap.values())
		{
			// Convert the track to text, but ignore the instruments value to avoid circularity
			let text = JSON.stringify(val, (key,value) => {
				if(key == "instrument")
				{
					return new Array();
				}
				else return value;
			});

			zip.file(projName+"/tracks/"+val[0].getTrack()+".track", text);
		}
		
		// Add the track lane object to the zipfile
		zip.file(projName+"/tracklane.score", JSON.stringify(this.trackLaneObject));

		// Add the score and orchestra headers and footers to the file
		zip.file(projName+"/orchestra_section.header", document.getElementById("orchestra-header").value);
		zip.file(projName+"/orchestra_section.footer", document.getElementById("orchestra-footer").value);
		zip.file(projName+"/score_section.header", document.getElementById("score-header").value);
		zip.file(projName+"/score_section.footer", document.getElementById("score-footer").value);

		// add the bpm and bpb values to the file too
		if (document.getElementById("playlist-bpm").value == "") zip.file(projName+"/beats_per_min", "140");
		else zip.file(projName+"/beats_per_min", String(document.getElementById("playlist-bpm").value));

		if (document.getElementById("playlist-bpb").value == "") zip.file(projName+"/beats_per_block","4");
		else zip.file(projName+"/beats_per_block", document.getElementById("playlist-bpb").value);

		// Add the loaded audio files to the zip file
		for (let i = 0; i < this.audioFiles.length; i++)
			zip.file(projName+"/"+this.audioFiles[i][0],this.audioFiles[i][1]);

		zip.generateAsync({type:"blob"}).then(function (blob) { // 1) generate the zip file
			saveAs(blob, projName+".zip");                          // 2) trigger the download
		});
	}
	loadProject()
	{
		if (csound == null) 
		{
			alert("Csound subsystem must be initialized to load project files.");
			return;
		}

		// This is mostly from SO

		// Open a file picker
		let input = document.createElement('input');
		input.type = 'file';

		var that = this; // so calls below have access to this
		input.onchange = e => { 
			var new_zip = new JSZip();
			new_zip.loadAsync(e.target.files[0])
			.then(function(zip) {
				// Iterate across all files in the zip
				zip.forEach((path, file) => {
					if (/\.synth$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							that.buildInstrument(content);
						});
					}
					else if (/\.track$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							let filename = file.name.split(".track")[0];
							filename = filename.split("/");
							filename = filename[filename.length-1];
							that.buildTrack(content,filename);
						});
					}
					else if (/\.score$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							let state = JSON.parse(content);
							that.trackLaneObject.reconfigure(state);
						});
					}
					else if (/score_section.header$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							document.getElementById("score-header").value = content;
						});

					}
					else if (/score_section.footer$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							document.getElementById("score-footer").value = content;
						});
					}
					else if (/orchestra_section.header$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							document.getElementById("orchestra-header").value = content;
						});
					}
					else if (/orchestra_section.footer$/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							document.getElementById("orchestra-footer").value = content;
						});
					}
					else if (/beats_per_min/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							console.log(content);
							document.getElementById("playlist-bpm").value = Number(content);
						});
					}
					else if (/beats_per_block/.test(path)) 
					{
						file.async("string")
						.then( (content) => {
							console.log(content);
							document.getElementById("playlist-bpb").value = Number(content);
						});
					}
					else // load anything else as a raw audio file to the browser filesystem
					{
						file.async("uint8array")
						.then( (content) => {
							// Load the file into csound
							let filename = file.name;
							filename = filename.split("/")[1];
							// any filename with no dot as assumed to not be an audio file and skipped
							if (!filename.includes(".")) return;
							csound.fs.writeFile(filename, content);
							// Add tag to list of loaded samples
							let pListTag = document.getElementById("sample-list");
							let newRow = document.createElement("tr");
							let val = document.createElement("td");
							val .innerText = file.name;
							newRow.appendChild(val);
							pListTag.appendChild(newRow);
							// Append file contents to our list of audio files
							that.audioFiles.push([filename,content]);
						});
					}
				});
			});
		}
		input.click();
	}
	loadAudioFile()
	{
		// This is mostly from SO
		if (csound == null) 
		{
			alert("Csound subsystem must be initialized to load audio files.");
			return;
		}

		// Open a file picker
		let input = document.createElement('input');
		input.type = 'file';

		input.onchange = e => { 
			// getting a hold of the file reference
			let file = e.target.files[0]; 
			//console.log(file);

			// setting up the reader
			let reader = new FileReader();
			//reader.readAsText(file,'UTF-8');
			reader.readAsArrayBuffer(file);

			// When the reader is done reading we can load/setup the instrument
			reader.onload = readerEvent => {
				let dat = readerEvent.target.result;
				csound.fs.writeFile(file.name, new Uint8Array(dat));

				//get the tag to add parameters to
				let pListTag = document.getElementById("sample-list");

				//create the tags
				let newRow = document.createElement("tr");
				let content = document.createElement("td");

				// the content of the new tag is the filename
				content.innerText = file.name;

				//build the new element
				newRow.appendChild(content);
				pListTag.appendChild(newRow);

				// Append file contents to our list of audio files
				this.audioFiles.push([file.name,new Uint8Array(dat)]);
			}
		}
		input.click();
	}
	getAudioFiles()
	{
		return this.audioFiles;
	}
}

let viewObj = new View();
