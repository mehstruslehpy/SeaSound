window.onload = Loader;

//Selected Tab
function openTab(tabName, btnID) {
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
		case 'Lollipop':
		case 'Pianoroll':
		case 'CodedEvent':
		case 'PointInterpolation':
		case 'GraphDiagram':
		case 'TrackLane':
			openTab(str,str2);
			break;
		default:
			console.log("no value");
	}
}

