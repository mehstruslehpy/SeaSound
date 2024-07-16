# Serve the python version of the backend.
python: server.py
	flask --app server run
# TODO: Can I copy my code for the program into the docs directory to allow people to
# run my code via the github pages hosting?
# Build the documentation from source.
docs:
	jsdoc --debug ./static/js/ ./misc_docs/README.md -u ./misc_docs/
	find ./tutorial_docs -type f -name "*.md" | xargs -I % sh -c 'pandoc % > %.html'
	mv out docs
# For now just deletes all the documentation.
clean:
	rm -rf ./docs
	rm -f ./tutorial_docs/*.html
# Show any TODO: comments in the source code.
todo:
	grep -rn "TODO:*" ./static/js/ ./templates/
