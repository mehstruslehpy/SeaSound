
# SeaSound
SeaSound is an experimental browser based front-end to csound for simple music composition.

## Table of Contents
- [Installation](#installation)
- [Start-up](#start-up)
- [Demo](#demo)
- [Tutorial](#tutorial)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Licensing](#licensing)

## Installation
As of right now to develop and use this program my machine runs: Firefox 114.0.2, Python 3.8.10, Flask 2.2.2, Werkzeug 2.2.2 along with Bash. To build the docs I am using pandoc 2.5 and jsdoc 4.0.3.

## Start-up
Run `make` and navigate to the address in your browser that is specified by flask at the terminal.

## Demo

You can try SeaSound in your browser by clicking [here](https://mehstruslehpy.github.io/SeaSound/templates/index.html).

As a quick demo you may load a sample project by executing the following steps.

1. In the sample_projects directory of the SeaSound source code download the "DrumAndBassArp.zip" project file to your computer.
2. Open SeaSound in a new tab using the link above.
3. Press the "Config" button at the top right corner of the display to open the config editor.
4. Press the "Reinit" button at the top right corner of the display to start the csound backend.
5. Press the "Load Project" button in the config editor to load the sample project you downloaded in the previous steps from wherever you browser downloaded it to on your computer. Note that if the csound backend has not finished loading yet you will get a pop up warning saying "Csound subsystem must be initialized to load project files." if this occurs wait several seconds for the csound backend to load and then try to pressing the "Load Project" button again. If necessary you may need to press the "Reinit" button to try and reload the csound backend as well.
6. After the project is loaded you can navigate around in the playlist, instrument, track and config editor tabs to analyze the loaded track. Additionally you may press the "Play Track" button to playback the full project.

Note: This project is made as a demo to show how SeaSound can be used to make music and is not intended to be a technically deep or aesthetically pleasing piece of music.

For more info, documentation and tutorials on using SeaSound, see the tutorial and documentation sections below.

## Tutorial
Tutorials for using SeaSound can be found [here](https://mehstruslehpy.github.io/SeaSound/tutorial-Tutorial%20Browser.html).

## Documentation
For code documentation see [here](https://mehstruslehpy.github.io/SeaSound/).

## Contributing
1. Fork the repository.
2. Create a new branch: `git checkout -b feature-name`.
3. Make your changes.
4. Push your branch: `git push origin feature-name`.
5. Create a pull request.

## Licensing
Per [here](https://choosealicense.com/licenses/gpl-3.0/) I have attempted to license this software using GPL v3. I have included the full statement of the license in the LICENSE.md file. Ideally I would like my code to stay open source, be attributed to myself and to respect the freedoms of the people who choose to use it. Please let me know if you see that I've done anything wrong. I'm not a lawyer so I'm sure I've made some mistakes with this.

