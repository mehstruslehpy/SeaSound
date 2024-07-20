# Serve the python version of the backend.
python: server.py
	flask --app server run
# TODO: Can I copy my code for the program into the docs directory to allow people to
# run my code via the github pages hosting?
# Build the documentation from source.
docs:
	jsdoc --debug ./static/js/ ./jsdoc_readme/README.md -u ./jsdoc_tutorial_files/
	find ./tutorial_docs -type f -name "*.md" | xargs -I % sh -c 'pandoc % > %.html'
	mv out docs
	cp ./tutorial_docs/*.html ./docs/
	cp -rf ./tutorial_docs/01_IMAGES/ ./docs/01_IMAGES/
	cp -rf ./tutorial_docs/02_IMAGES/ ./docs/02_IMAGES/
	cp -rf ./tutorial_docs/03_IMAGES/ ./docs/03_IMAGES/
	cp -rf ./tutorial_docs/04_IMAGES/ ./docs/04_IMAGES/
	cp -rf ./tutorial_docs/05_IMAGES/ ./docs/05_IMAGES/
	cp -rf ./static ./docs/static
	rm -rf ./docs/static/node_modules
	cp -rf ./templates ./docs/templates
# For now just deletes all the documentation.
clean:
	rm -rf ./docs
	rm -f ./tutorial_docs/*.html
# Show any TODO: comments in the source code.
todo:
	grep -rn "TODO:*" ./static/js/ ./templates/
