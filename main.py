from app import app

if __name__ == '__main__':
    # For local development
    app.run(debug=True, host='127.0.0.1', port=5000)
