#This file sets up the db and defines the Piece model for a clothing item.
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv


db = SQLAlchemy() #database object used to interact w db, use to create tables, models, and to query the db


class Piece(db.Model):
    __tablename__="wardrobe"
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    label = db.Column(db.String, nullable=False) #nulllable=false means that every item must have a label
    color = db.Column(db.String, nullable=False)
    image=db.Column(db.String, nullable=False)
    #converts database row to a JSON for the frontend
    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "color": self.color,
            "image": self.image
        }
    
    #mainly for debugging purposes later on
    def __repr__(self): #define what the piece looks like when we print it out as opposed to some mem address
        return f"Piece(label={self.label}, color={self.color})"
     

    def __init__(self, label, color, image):
        self.label = label
        self.color = color
        self.image = image


