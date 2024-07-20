# The Track Editor.

## The Track Editor Overview.

On clicking the track editor tab button at the top of the screen you are presented with the following user interface:

![](./03_IMAGES/03_TRACK_EDITOR_STARTING.png)

From left to right we describe the controls shown in this image:

1. Loaded tracks may be selected via the drop down to the right of the "Select Track:" label. Since no tracks are loaded on startup the NULL track is the only loaded track.
2. The "Delete Track" button is used to delete the currently selected track.
3. The "Add Track" button is used to configure/add new tracks to the project.
4. The "+"/"-" buttons to the right of the "Switch Parameter:" label are used to switch between the various parameter canvases of the currently selected track (track parameters will be explained in later sections).
5. The "Current Parameter: ***" displays the parameter number corresponding to the currently displayed parameter canvases of the currently selected track. Since no track is selected, this contains placeholder text "\*\*\*".
6. The "Render Track" renders the csound code corresponding to the currently selected tracks to a pop up dialog window for inspection.
7. The “Save Track” button saves and downloads the currently selected track to a .track file using your browsers default download settings.
8. The “Load Track” button can be used to load a track from files saved in the previous step.

## How SeaSound Tracks Work.

Csound score code for a particular instrument can be thought of as an array of strings, each string containing a fixed number of ascii words (parameters) separated by spaces corresponding to the parameters of the instrument. Each string in the array makes up a single note/event in the score. Textually this looks much like a spreadsheet of values. 

In SeaSound tracks are made for individual instruments. Each track contains one gui canvas per parameter of the instrument specified. The various canvases can provide different styles of graphical input for each of the different parameters of the instrument. The user switches between these parameter canvases and inputs note events to them via the mouse and keyboard graphically. These tracks can then be translated down to csound score code.

Note that in particular we designate the first/zeroth parameter canvas in the array of parameters as the "trigger-mode" canvas. What this means is that this canvas in particular is used for the inputing and deletion of actual note/event start times and durations. The other parameters in the array are update to reflect the start times and durations input via this widget and can only have the values contained within them changed, but new notes cannot be added to them or deleted from them.

## SeaSound Track Configuration and Creation.

To create a track in a SeaSound project you must press the "AddTrack" button described above. Doing so results in the following dialog popping up.

![](./03_IMAGES/03_ADD_TRACK_EMPTY_DIALOG.png)

The text fields of this dialog are as follows:

1. The "Track Name:" field is where you give your track a name. This name is used to select the track from the "Select Track" dropdown discussed above as well as for selecting the track for arrangement in the playlist editor.
2. The "Instrument:" field is where you select the name of the instrument this track will trigger notes for. Note that double clicking in the associated text field here should display a drop down of the possible instruments you have loaded/created in the instrument editor to make selection easier.
3. The "Parameter:" field dropdown lets you select parameters to be added to your track by canvas types (described below).
4. The "+"/"-" buttons are used to add/remove the currently selected parameter to the track. After clicking these buttons the dialog should be updated to show you the current collection of parameters you intend to use for the track so far.
5. The "Horizontal Cells:" field specifies the number of cells that this track will contain. This corresponds to the length (in beats) of the track.
6. The "Beats Per Cell:" field specifies the number of beats each cell of your track contains. This is mostly experimental and may be removed in later versions. Right now it pertains to the unit conversion of the generated code. Leaving this as the default value "1" is usually the best choice.

Warning: If you supply too little parameters for your chosen instrument to the track you have selected or too many the result will be whatever the csound backend chooses to do when toof few/too many parameters are supplied to an instrument. This may result in errors or code that does not work as you expected. It is important to get the number of  parameters in the track menu for your instrument correct.

A filled in track dialog example is shown below.

![](./03_IMAGES/03_ADD_TRACK_FILLED_DIALOG.png)

## Track Parameter Types.

As of right now there are four different types of parameter canvases, pianoroll, lollipop, bars and coded event canvases. We explain the trigger mode behavior of each in the following subsections.

### The Pianoroll Canvas Type.

Pianoroll canvases look like the following:

![](./03_IMAGES/03_PIANOROLL_CANVAS.png)

Pianoroll canvases are used primarily for inputting frequencies and durations with respect to time as in most modern DAWS. Note in the screenshot in particular the status info in the upper right corner of the screen. By pressing h with the pianoroll canvas focused we can bring up a quickreference menu showing the pianoroll keybinds.

![](./03_IMAGES/03_PIANOROLL_KEYBINDS.png)

The keybinds are as follows:

1. The numbers 1, 2 and 3 are used to change the mode of the editor. There are three modes for the graph canvas: instrument, node and edge mode which we will describe below.
2. The wasd keys pan around in the canvas space.
3. The qe and zc keys change the amount of scaling in the X and Y directions of the canvas.
4. The rf, tg and yh keys are used to control the units that X, Y scaling and translation occur in.
5. The x key is used to select the fraction of a cell that snapping occurs to.
6. The keys 1, 2, 3, 4 and 5 are used to select the mode that the pianoroll canvas is in.
7. The i key is used to quickly change the instrument that the current track emits code for.

As mentioned above the pianoroll canvas is a modal canvas, much like graph instrument canvases. The modes of the pianoroll canvas are as follows:

1. Select mode: In select mode notes can be highlighting by right clicking, holding and dragging the mouse. Selected notes are highlighted and can be deleted in bulk or pasted using the other modes of the pianoroll canvas.
2. Note mode: In note mode notes can be entered onto the pianoroll by clicking the mouse on the desired cell of the screen, holding and dragging.
3. Paste mode: In paste mode if a selection of notes was highlighted previous from the select mode, right clicking anywhere in the canvas will paste a copy of the selection at the location of the mouse cursor.
4. Delete mode: In delete mode right clicking the mouse on individual notes causes them to be deleted.
5. Remove mode: In remove mode any notes selected from the select mode are deleted. This allows for notes to be delete in groups.

Note that alignment of notes does not need to occur at cell boundaries. For example if you wanted to align notes to thirds of a cell using the x key mentioned above and entering 3 into the popup menu that results will cause notes to be snapped to thirds of cell boundaries.

### The Lollipop Canvas Type.

Lollipop canvases look like the following:

![](./03_IMAGES/03_LOLLIPOP_CANVAS.png)

Lollipop canvases allow numerical values to be specified with respect to time and relative to some particular configurable maximum and minimum values. Note again in the screenshot in particular the status info in the upper right corner of the screen. By pressing h with the lollipop canvas focused we can bring up a quickreference menu showing the canvases keybinds.

![](./03_IMAGES/03_LOLLIPOP_KEYBINDS.png)

The keybinds are as follows

1. All panning and scaling controls are the exact same as the pianoroll canvas controls.
2. The x key allows grid snapping behavior similar to the pianoroll, but this snapping applies only along the horizontal axis rather than the vertical axis.
3. The n and m keys are used to change the minimum and maximum values lollipops can take respectively relative to the maximum/minimum boundaries shown on the screen. Thus pressing n and inputting a number configures the value corresponding to the bottom of the boundary drawn to the screen and similarly pressing m configures the maximum corresponding to the top boundary.
4. The control key toggles delete mode on.

Note: In fact you aren't restricted to the boundaries drawn on the canvas. You can draw lollipop sliders above or below these boundaries or to the left or right of them. But such behavior with respect to my code should be considered undefined.

The modes of the lollipop canvas themself are much simpler than the pianoroll canvas. There are only two modes. Enter and delete mode. Enter mode allows for individual lollipops to be placed on the screen via mouseclicking similar to pianoroll note mode. Pressing control places the canvas into delete mode. In delete mode clicking on a lollipop deletes it and sets the canvas back to note mode for further input.

### The Bars Canvas Type.

The bars canvas type is simply a variation on the lollipop canvas where the lollipops are drawn as rectangles rather than lollipops hence everything stated above for the lollipop canvas applies equally to the bars canvas type. An example of the bars canvas is shown in the figure below.

![](./03_IMAGES/03_BARS_CANVAS.png) 

### The Coded Event Canvas Type.

Coded event canvases look like the following:

![](./03_IMAGES/03_CODEDEVENT_CANVAS.png) 

The coded event canvas allows textual events to be specified with respect to time. This allows for more flexibility than the pianoroll or lollipop canvases at the expense of ease of use. Note again in the screenshot in particular the status info in the upper right corner of the screen. By pressing h with the coded event canvas focused we can bring up a quickreference menu showing canvases keybinds.

![](./03_IMAGES/03_CODEDEVENT_KEYBINDS.png) 

Again the keybinds are nearly the exact same as the pianoroll and lollipop canvases. The new exception being that now there is a key j which pops up a menu for inputing the desired event to text to emit/display on mouse clicks.

## Creating A Simple Track.

As an exercise we will create a simple track as follows:

First click the "Add Track" button and enter the following inputs into the popup menu.

![](./03_IMAGES/03_EXAMPLE_DIALOG.png) 

This creates a track with a pianoroll, lollipop and coded event canvas. Since the first parameter in the list is the pianoroll canvas that will be our trigger mode canvas and the rest of the canvases will be in nontrigger mode.

Next click the confirm button and verify an empty pianoroll canvas appears on your screen. Note that the select track dropdown is not updated automatically. You should go ahead and select your new track now. If you edit other tracks and would like to return this one later you may reselect it by name using the select track dropdown again.

Now enter the following notes (or any other note pattern you like) into the piano roll.

![](./03_IMAGES/03_EXAMPLE_INPUTS.png) 

Now verify that corresponding values are entered automatically to your other parameters by scrolling through them using the +/- buttons at the top of the gui. In particular notice that clicking on events opens the pop up menu to input their event text and that clicking on lollipop sliders allows you to adjust their height.

Note also that scrolling, scaling and so on are synced between the parameters. If you scroll in one the rest are scrolled too and likewise if you scale one, the rest are also scaled.

[return](./tutorial-Tutorial Browser.html)
