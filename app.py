import os
import logging
from flask import Flask, render_template

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key")

@app.route('/')
def index():
    """Main budget calculator page"""
    return render_template('index.html')

if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='127.0.0.1', port=5000)
