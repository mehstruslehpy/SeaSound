/*
This file is part of SeaSound.

SeaSound is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

SeaSound is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with SeaSound. If not, see <https://www.gnu.org/licenses/>.
*/

// Mixer channels store collections of "slots" that make up a single "mixer channel".
// Each slot corresponds to a csound instrument that is wired together via the csound signalflow graph opcodes.
class MixerChannel
{
	widgetType = "MixerChannel";
	// Contains array of raw text source code for each slot
	slotList = Array();
	// Contains parameters used for starting each slot
	slotParameters = Array();
	// contains the name of this channel
	channelName = "";
	// Contains the name of the input to the channel
	inputName = "";
	// Stores the master volume for the channel
	volume = 0;
	// Stores the currently selected mixer slot
	slotIndex = 0;

	constructor(channelName)
	{
		this.channelName = channelName;
	}

	
	incrSlotIndex()
	{
		if (this.slotIndex < this.slotList.length) this.slotIndex++;
	}
	decrSlotIndex()
	{
		if (this.slotIndex > 0) this.slotIndex--;
	}
	getSlotIndex()
	{
		return this.slotIndex;
	}
	getObjectType()
	{
		return this.widgetType;
	}
	addSlot(name,text)
	{
		this.slotList.push({name:name,text:text});		
	}
	/*insertSlot(name,text)
	{
		this.slotList.push({name:name,text:text});		
	}
	*/
	addAbove(index,name)
	{
		if (index < 1) index = 1;
		this.slotList.splice(index-1,0,{name:name,text:"; "+name});
	}
	addBelow(index,name)
	{
		if (index > this.slotList.length) index = this.slotList.length;
		this.slotList.splice(index,0,{name:name,text:"; "+name});
	}
	writeSlot(name,text)
	{
		for (let i = 0; i < this.slotList.length; i++)
			if (this.slotList[i].name == name) this.slotList[i].text = text;
	}
	getSlot(name)
	{
		console.log(this.slotList);
		let out = null;
		for (let i = 0; i < this.slotList.length; i++)
			if (this.slotList[i].name == name) out = this.slotList[i];
		return out.text;
	}
	setVolume(val)
	{
		console.log("Mixer channel volume:" +val);
	}
}

