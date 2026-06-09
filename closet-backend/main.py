#This file loads trained model + sets up Gemma 3 model pipeline
from transformers import pipeline 
from ultralytics import YOLO 

#load our trained model
#TODO: update the path to the model once we trained it with more epochs for better accuracy!!
model = YOLO('best.pt')

#loading gemma 3
generator = pipeline( 
    task = "text-generation",
    model = "google/gemma-3-1b-it",
)

