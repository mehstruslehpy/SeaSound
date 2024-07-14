# Serve the python version of the backend.
python: server.py
	flask --app server run
# Build the documentation from source.
docs:
	jsdoc --debug ./static/js/ ./misc_docs/README.md
	mv out docs
# For now just deletes all the documentation.
clean:
	rm -rf ./out
# Show any TODO: comments in the source code.
todo:
	grep -rn "TODO:*" ./static/js/ ./templates/
