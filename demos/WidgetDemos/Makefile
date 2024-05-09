# Serve the lisp version of the backend
lisp: server.lisp
	sbcl --load server.lisp
	echo "Backend running. Connect to localhost:4242/index.html in your browser now."

# Serve the python version of the backend
python: server.py
	flask --app server run
