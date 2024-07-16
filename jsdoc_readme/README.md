## Some global variables and functions:

The variable csoundjs contains the path to the csound javascript library.

	const csoundjs = "../static/csound/csound.js";

The variable csound contains a pointer to the csound engine.

	let csound = null;

The function  playCode() receives a csound file and plays it back.

	async function playCode(code) 

The function stopCsound() is used to stop playback.

	async function stopCsound(code) 

The function reinitCsound() is used to reinitialize the csound backend.

	async function reinitCsound() 

