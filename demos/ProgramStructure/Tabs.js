// TODO: Simplify the tab code. There's no need to save tabs between page loads.
// TODO: Changing drop down displays incorrect parameter for instruments
// TODO: Adding tracks to track editor should update dropdown in playlist editor
window.onload = TabLoader;

// There is only one track lane object for the whole program
let trackLaneObject = new TrackLaneCanvas("trackLaneCanvas",10,20);

//Selected Tab
function OpenTab(tabName, btnID) {
	var i;
	var x = document.getElementsByClassName("tab");

	for (i = 0; i < x.length; i++) {
		x[i].style.display = "none";
	}

	var x = document.getElementsByClassName("tab-button");
	for (i = 0; i < x.length; i++) {
		//x[i].style.background = "#043927";
		x[i].style.background = "black";
	}

	document.getElementById(tabName).style.display = "block";
	document.getElementById(btnID).style.background = "green";

	localStorage.setItem('activeTab', tabName);
	localStorage.setItem('activeBtn', btnID);
	ResetParameter(); // Reset the parameters on the track editor tab for consistency
}

function TabLoader() {
	str = localStorage.getItem('activeTab');
	str2 = localStorage.getItem('activeBtn');

	console.log(str);
	switch (str) {
		case 'PlaylistEditor':
		case 'InstrumentEditor':
		case 'TrackEditor':
		case 'Config':
			OpenTab(str,str2);
			break;
		default:
			console.log("no value");
	}
}

function SelectDropDown(divId,value)
{
	let children = document.getElementById(divId).children;
	for (let i = 0; i < children.length; i++)
		if (children[i].id == value) children[i].style.display = "inline";
		else children[i].style.display = "none";
	// Changes track editor tab parameter back to 0 regardless of which tab we call this from
	ResetParameter();
}

function AddCanvas(canvasDiv,prefix,name)
{
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

			newCanvas.setAttribute("id","instrument-"+name);
			newOption.setAttribute("value","instrument-"+name);
			newCanvas.setAttribute("class","trackLaneCanvas");
			let trackLaneObject = new GraphDiagramCanvas("instrument-"+name,20);
			break;
		}
		case "track-canvases": 
		{
			// Read in input parameters
			let params = document.getElementById("track-parameters").value;
			let hCells = document.getElementById("track-horizontal-cells").value;
			let vCells = document.getElementById("track-vertical-cells").value;
			if (vCells == "") vCells = 20;
			else vCells = Number(vCells);
			if (hCells == "") hCells = 40;
			else hCells = Number(hCells);
			if (params == "") params = 2;
			else params = Number(params);
			console.log(params);
	
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

			// create one canvas per parameter
			for (let i = 0; i < params; i++)
			{
				// create the canvas
				let newCanvas = document.createElement("canvas");
				newCanvas.setAttribute("tabindex","1");
				newCanvas.setAttribute("id","track-p"+i+"-"+name);
				newCanvas.setAttribute("class","pianoRollCanvas");
				if (i==0) newCanvas.style.display = "inline";
				else newCanvas.style.display = "none";
				instDiv.appendChild(newCanvas);
				let pianoRollObject = new PianoRollCanvas("track-p"+i+"-"+name,vCells,hCells);
			}
			// Playlist editor needs an associated pattern entry too
			let newPat = document.getElementById("pattern-select");
			let newOpt = document.createElement("option");
			newOpt.innerText = name;
			newOpt.setAttribute("value","instrument-"+name);
			newPat.append(newOpt);
			break;
		}
		default:
			break;
	}
}

// Hack to catch enter button presses on form inputs for adding canvases
function EnterHandler(e,div,prefix,name)
{
   if (e && e.keyCode == 13) AddCanvas(div,prefix,name);
}

function DeleteSelectOption(select)
{
	let selectTag = document.getElementById(select);
	for (var i=0; i<selectTag.length; i++)
		if (selectTag.options[i].value == selectTag.value)
			selectTag.remove(i);
}
function IncrementPlaylistBlockSize()
{
	trackLaneObject.incrementBlockSize();
}
function DecrementPlaylistBlockSize()
{
	trackLaneObject.decrementBlockSize();
}
function ResetPlaylist()
{
	let vCells = document.getElementById("playlist-vertical-cells").value;
	let hCells = document.getElementById("playlist-horizontal-cells").value;
	if (vCells == "") vCells = 20;
	else vCells = Number(vCells);
	if (hCells == "") hCells = 40;
	else hCells = Number(hCells);
	console.log(typeof vCells);
	console.log(hCells);
	trackLaneObject.reset(hCells,vCells);
}
function NextParameter()
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
function PrevParameter()
{
	let name = document.getElementById("track-canvases-select").value;
	name = name.split("-")[1];
	let children = document.getElementById("instrument-"+name).children;
	for (let i = 0; i < children.length; i++)
	{
		if (children[i].style.display == "inline")
		{
			children[i].style.display = "none";
			children[(i-1)%children.length].style.display = "inline";
			document.getElementById("param-num").innerText = "Current Parameter: "+(i+1)%children.length;
			break;
		}
	}
}
function ResetParameter()
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
