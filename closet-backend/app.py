#This file sets up the web server, routes, and connects everything together.
#Calls db.py for db setup and Piece model +trained AI model from main.py for obj detection + outfit generation.
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify
from flask.cli import load_dotenv 
from db import db, Piece
from main import model, generator #import the AI models
from flask_cors import CORS #cross origin resource sharing, disables default restriction blocking front & backend comms
import json
import os
import numpy as np
import cv2

app = Flask(__name__) #create Flask web server object
CORS(app) #enable cross origin resource sharing btwn front & backend

#LATER we will move from local to cloud via os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://localhost/closet_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = False  # set to True to log SQL queries while debugging

db.init_app(app) #connects flask app to sqlalchemy db
with app.app_context():
    db.create_all() 

# Response helper functions
def success_response(data, code=200):
    return json.dumps({"success": True, "data": data}), code

def failure_response(message, code=404):
    return json.dumps({"success": False, "error": message}), code


#cloudinary config
load_dotenv() #load sensitive varible infor from .env file

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)


#routes
@app.route("/")
def home():
    return success_response("Welcome to the closet API!")

@app.route("/wardrobe/", methods=["POST"])
def addClothing():
    img = request.files.get("image")
    if img is None:
        return failure_response("No image provided", code=400)
    
    # Read image bytes once into memory
    img_bytes = img.read()
    
    # Upload to Cloudinary using bytes
    upload_result = cloudinary.uploader.upload(img_bytes, folder="wardrobe_pieces")
    img_url = upload_result['secure_url']

    # Convert bytes to numpy array for YOLOv8
    nparr = np.frombuffer(img_bytes, np.uint8)
    img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # Pass numpy array to YOLOv8
    results = model(img_np, save_crop=True) 

    piece = None
    for obj in results[0].boxes.cls:
        label_id = obj.item()
        label = results[0].names[label_id]  # convert ID to name
        piece = Piece(label, img_url, "unknown") #will work on color part later
        db.session.add(piece)
    
    db.session.commit()  # commit once outside the loop


    if piece is None:
        return failure_response("No clothing item was created", 400)
    return success_response(piece.to_dict(), 201)


#getWardrobe as list of all pieces from wardrobe
@app.route("/wardrobe/", methods=["GET"])
def getWardrobe():
    pieces = Piece.query.all()
    result = []
    for piece in pieces:
        result.append(piece.to_dict())
    return success_response(result, code=200) 

#getClothingItem by id
@app.route("/wardrobe/<int:id>", methods=["GET"])
def getClothingItem(id):
    piece = Piece.query.get(id)
    if piece is None:
        return failure_response("Clothing item not found", code=404)
    return success_response(piece.to_dict(), code=200)

#removeClothingItem by id
@app.route("/wardrobe/<int:id>", methods=["DELETE"])
def removeClothingItem(id):
    piece = Piece.query.get(id)
    if piece is None:
        return failure_response("Clothing item not found", code=404)
    
    db.session.delete(piece)
    db.session.commit()
    return success_response("Clothing item removed", code=200)

#getOutfit() (outfit generation route!)
@app.route("/wardrobe/outfit/", methods=["POST"])
def getOutfit():
    pieces = Piece.query.all()
    if not pieces:
        return failure_response("Wardrobe is empty!", code=400)
    wardrobe_txt = ""
    for piece in pieces:
        wardrobe_txt +=f"- Item {piece.id}: {piece.label}\n"
    wardrobe_txt += f"Only use item IDs that exist above. Available IDs: {[p.id for p in pieces]}"

    body = json.loads(request.data) #read JSON body sent with request
    occasion = body.get("occasion","casual")
    weather = body.get("weather","mild")
    color = body.get("color","no preference")


    prompt = f"""<start_of_turn>user
    You are an expert fashion stylist with deep knowledge of color theory, pattern mixing, and occasion dressing.
    
    Context:
    Occasion: {occasion}
    Weather: {weather}
    Color preference: {color}
    Available wardrobe: {wardrobe_txt}

    TASK:
    Generate exactly 3 complete outfits using only items from the wardrobe above.

    RULES:
    - Every outfit must be appropriate for the weather, occasion, and color preference
    - Do not repeat the same combination across outfits
    - Each outfit must include at least a top and a bottom
    - Prioritize color coordination and pattern balance
    - If color preference is specified, at least one item per outfit must match it

    Respond in JSON format as follows:
    {{
    "stylist notes": "brief explanation of the outfit choices and how they fit the occasion/weather/color preference",
    "outfits": [
        {{
        "outfit_name": "name of the outfit",
        "selected_ids": [1,4],
        "description": "detailed description of the outfit, including how the pieces work together and why they are suitable for the occasion"
        }},
        {{
        "outfit_name": "name of the outfit",
        "selected_ids": [2,3],
        "description": "detailed description of the outfit, including how the pieces work together and why they are suitable for the occasion"
        }},
        {{
        "outfit_name": "name of the outfit",
        "selected_ids": [5,6],
        "description": "detailed description of the outfit, including how the pieces work together and why they are suitable for the occasion"
        }}
    ]
    }}
    <end_of_turn>
    <start_of_turn>model
             
    """
    response = generator(prompt, max_new_tokens=500, do_sample=True, temperature=0.7)
    full_response = response[0]['generated_text']
    generated = full_response.split("<start_of_turn>model")[-1].strip()

    try:
        outfit_data = json.loads(generated)
        return success_response(outfit_data, code=200)
    except:
        return success_response(generated, code=200) #for debugging purposes, return the full response if JSON parsing fails



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


