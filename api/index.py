import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# This is the WSGI application that Vercel will use
application = app

if __name__ == "__main__":
    app.run()
