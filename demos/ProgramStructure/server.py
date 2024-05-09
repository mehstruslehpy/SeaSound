import json
import flask
from flask import request
from flask_cors import CORS

app = flask.Flask(__name__)
CORS(app)

@app.route("/pianoroll",methods=['POST'])
def welcome():
	print(json.loads(request.data))
	return "return string"

