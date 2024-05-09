/** THIS FILE DEFINES THE STRUCTURE OF OUR MUSICAL SCORE TYPE **/
// A score represents a single musical work
Score:
{
	// A block represents the individual units of a given score
	Block:
	{
		// Every block at its core consists of a phrase containing the 
		// individual notes of the score.
		Phrase:
		{
			// Each phrase consists of a collection of notes.
			Note:
			{
				// Every note consists of a start time, duration, pitch and velocity value.
				float start_time;
				float duration;
				float pitch;
				float velocity;
				// The end time of the note can be calculated by
				float end_time = start_time+duration;
			}

			// The notes of the phrase are collected into a list as shown
			Note notes_list;
		}
	}
	// Each score consists of a collection of blocks
	Block block_list;
}
