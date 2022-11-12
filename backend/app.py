from flask import Flask
from flask_restful import Api
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()
import os

import google_calendar

app = Flask(__name__)
api = Api(app)
CORS(app, supports_credentials=True)

app.register_blueprint(google_calendar.bp)

@app.route('/')
def hello_world():
  return f'Algo Backend app Route'

if __name__ == '__main__':
  app.run(debug=True)