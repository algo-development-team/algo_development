from flask import Blueprint, request
from google_api import get_flow 
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from dotenv import load_dotenv
load_dotenv()
import os

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
TOKEN_URI = 'https://oauth2.googleapis.com/token'
flow = None

bp = Blueprint('/api/google-calendar', __name__, url_prefix='/api/google-calendar')

@bp.route('/handle-token', methods=['PATCH'])
def handle_token():
  data = request.get_json()
  code = data['code']
  print(code)
  
  global flow
  flow = get_flow()
  flow.fetch_token(code=code)
  credentials = flow.credentials
  print(credentials.refresh_token)

  # regular auth, user info is not altered
  if credentials.refresh_token is None:
    return 'Auth Completed'

  # new auth, user info is created or updated
  else:
    # SAVE REFRESH TOKEN TO USER DOCUMENT HERE

    return 'Token Created'