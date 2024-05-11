window.onload = Loader;

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
}

function Loader() {
	str = localStorage.getItem('activeTab');
	str2 = localStorage.getItem('activeBtn');

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
	console.log(value);
	let children = document.getElementById(divId).children;
	for (let i = 0; i < children.length; i++)
	{
		console.log(children[i].id);
		console.log(value);
		if (children[i].id == value) children[i].style.display = "inline";
		else children[i].style.display = "none";
	}
}

function AddCanvas(canvasDiv,name)
{
	console.log("Canvas: "+canvasDiv);
	console.log("Name: "+name);
	if (canvasDiv == "" || name == "") return;

	// add the associated canvas tag
	let ele = document.getElementById(canvasDiv);
	let newCanvas = document.createElement("canvas");
	newCanvas.setAttribute("tabindex","1");
	newCanvas.style.display = "none";
	ele.appendChild(newCanvas);

	// add the associated select entry
	let selectEle = document.getElementById(canvasDiv+"-select");
	let newOption = document.createElement("option");
	newOption.innerText = name;
	selectEle.append(newOption);

	// load the display based on which type of canvas we are dealing with
	switch (canvasDiv)
	{
		case "instrument-canvases":
			newCanvas.setAttribute("id","instrument-"+name);
			newOption.setAttribute("value","instrument-"+name);
			newCanvas.setAttribute("class","trackLaneCanvas");
			let trackLaneObject = new GraphDiagramCanvas("instrument-"+name,20);
			break;
		case "track-canvases": 
			newCanvas.setAttribute("id","track-"+name);
			newOption.setAttribute("value","track-"+name);
			newCanvas.setAttribute("class","pianoRollCanvas");
			let pianoRollObject = new PianoRollCanvas("track-"+name,20,40);
			break;
		default:
			break;
	}
}

// Hack to catch enter button presses on form inputs for adding canvases
function EnterHandler(e,div,name)
{
   if (e && e.keyCode == 13) AddCanvas(div,name);
}
