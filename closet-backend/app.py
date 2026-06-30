#This file sets up the web server, routes, and connects everything together.
#Calls db.py for db setup and Piece model +trained AI model from main.py for obj detection + outfit generation.
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify
from flask.cli import load_dotenv 
from db import db, Piece
from main import model, generator #import the AI models
from flask_cors import CORS 
import json
import os
import numpy as np
import cv2

app = Flask(__name__) #create Flask web server object
CORS(app) #enable cross origin resource sharing btwn front & backend

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://localhost/closet_db")
#app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://localhost/closet_db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SQLALCHEMY_ECHO"] = False  # set to True to log SQL queries while debugging

db.init_app(app) #connects flask app to sqlalchemy db
with app.app_context():
    db.create_all() 

# Response helper functions
def success_response(data, code=200):
    return jsonify({"success": True, "data": data}), code

def failure_response(message, code=404):
    return jsonify({"success": False, "error": message}), code


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
        display_label = clean_label(label)
        piece = Piece(label=display_label, image=img_url, color="unknown")
        db.session.add(piece)
        
    # If YOLO didn't detect anything, we still save the item as Unrecognized
    if piece is None:
        piece = Piece("Unrecognized item", image = img_url, color="unknown")
        db.session.add(piece)
    
    db.session.commit()  # commit the piece to the database

    return success_response(piece.to_dict(), 201)
    

def clean_label(raw_label):
    # Splits "Short-sleeves_black-white" on the underscore and takes the first part
    parts = raw_label.split("_")
    item_type = parts[0].replace("-", " ").strip().capitalize()
    return item_type

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

# Update a clothing item's label (manual override)
@app.route("/wardrobe/<int:id>", methods=["PUT"])
def updateClothingItem(id):
    piece = Piece.query.get(id)
    if piece is None:
        return failure_response("Clothing item not found", code=404)
    
    body = json.loads(request.data)
    new_label = body.get("label")
    
    if not new_label:
        return failure_response("Label cannot be empty", code=400)
    
    piece.label = new_label.strip().capitalize()
    db.session.commit()
    
    return success_response(piece.to_dict(), code=200)


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
    weather = body.get("weather","sunny")
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
    
    # Fire the prompt over to Groq cloud generator script
    response = generator(prompt)
    generated = response[0]['generated_text']
    
    # Clean out the legacy split tags if they exist
    if "<start_of_turn>model" in generated:
        generated = generated.split("<start_of_turn>model")[-1].strip()
    
    # Clean out markdown code blocks just in case
    if "```json" in generated:
        generated = generated.split("```json")[1].split("```")[0].strip()
    elif "```" in generated:
        generated = generated.split("```")[1].split("```")[0].strip()

    try:
        outfit_data = json.loads(generated)
        return success_response(outfit_data, code=200)
    except Exception as e:
        return success_response({"error": "Failed to parse JSON", "raw_text": generated}, code=200)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


