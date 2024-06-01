// TODO: Need to start working on timing logic
// TODO: Add load and save code for instruments, widgets, project, etc
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
		// add the associated canvas tag
		let ele = document.getElementById(canvasDiv);
		let newCanvas = document.createElement("canvas");
		newCanvas.setAttribute("tabindex","1");
		ele.appendChild(newCanvas);

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
	
		newCanvas.setAttribute("id","instrument-"+name);
		newOption.setAttribute("value","instrument-"+name);
		newCanvas.setAttribute("class","trackLaneCanvas");
		let instrumentCanvasObject = new GraphDiagramCanvas("instrument-"+name,name,20);

		// Add the instrument canvas to our map of all instruments
		this.instrumentMap.set(this.CleanName(name),instrumentCanvasObject);

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
		if (hCells == "") hCells = 40;
		else hCells = Number(hCells);
		let cellsPerBeat = document.getElementById("track-cells-per-beat").value;
		if (cellsPerBeat == "") cellsPerBeat= 4;
		else cellsPerBeat = Number(cellsPerBeat);

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
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,this.pianoRollVCellDefault,hCells,cellsPerBeat);
			else if (this.paramList[i] == "Lollipop")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,this.sliderVCellDefault,hCells,cellsPerBeat,"lollipop");
			else if (this.paramList[i] == "Bars")
				canvObj=new SliderCanvas("track-p"+i+"-"+name,this.sliderVCellDefault,hCells,cellsPerBeat,"solid");
			else if (this.paramList[i] == "Event")
				canvObj=new CodedEventCanvas("track-p"+i+"-"+name,hCells,cellsPerBeat);
			else 
				canvObj=new PianoRollCanvas("track-p"+i+"-"+name,this.pianoRollVCellDefault,hCells,cellsPerBeat);
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
		let instrument = this.CleanName(document.getElementById("instrument-canvases-select").textContent);
		if (instrument == "") return;
		this.instrumentMap.get(instrument).configureNode(name,inputs,outputs);
	}
	// Render the currently selected instrument to text
	renderInstrument()
	{
		// Get the instrument text name
		let instrument = document.getElementById('instrument-canvases-select').textContent; // get the select tag
		instrument = this.CleanName(instrument);
		// Get a string with the instrument code
		let outString = this.instrumentMap.get(instrument).renderToText();
		// print the instrument to the console.
		console.log(outString);
		// Print the instrument code to modal in browser
		document.getElementById("instr-code-dialog").showModal();
		document.getElementById("instrument-code-dialog-output").textContent = outString;
	}
	// Render the currently selected track
	// TODO: Need to iterate across all the parameters here
	renderTrack()
	{
		// Get the track text name
		let track = document.getElementById('track-canvases-select').textContent; // get the select tag
		track = this.CleanName(track);
		// Get the beats per minute of the project
		let bpmText = document.getElementById('playlist-bpm').value; // get the select tag
		if (bpmText == "") bpmText = document.getElementById('playlist-bpm').placeholder;
		// Get a string with the track code
		let params = this.trackMap.get(track)
		let paramList = params[0].getNoteOutput(Number(bpmText));
		// print the track to the console.
		console.log(paramList);

		// Print the instrument code to modal in browser
		//document.getElementById("instr-code-dialog").showModal();
		//document.getElementById("instrument-code-dialog-output").textContent = outString;
	}

}

let viewObj = new View();
