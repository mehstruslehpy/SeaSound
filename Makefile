# Serve the python version of the backend
python: server.py
	flask --app server run
docs:
	jsdoc --debug ./static/js/* ./templates/index.html
	
