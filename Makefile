# Serve the python version of the backend.
python: server.py
	flask --app server run
# Build the documentation from source.
docs:
	jsdoc --debug ./static/js/* ./templates/index.html
# For now just deletes all the documentation.
clean:
	rm -rf ./out
# Show any TODO: comments in the source code.
todo:
	grep -r "TODO:*" ./static/js/ ./templates/
