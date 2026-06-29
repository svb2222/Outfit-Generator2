
# This file loads the trained YOLO model + sets up the cloud Groq API pipeline
import os
from ultralytics import YOLO 
from groq import Groq
from flask.cli import load_dotenv

# Load our trained object detection model
model = YOLO('best2.pt')

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generator(prompt_text, **kwargs):
    """
    Sends the fashion prompt to Groq's cloud processing layer 
    using the open-weights Llama-3 model for 100% free generation.
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt_text}
            ],
            temperature=0.7,
            response_format={"type": "json_object"} 
        )
        
        response_text = completion.choices[0].message.content
        
        return [{"generated_text": f"<start_of_turn>model\n{response_text}"}]
        
    except Exception as e:
        print(f"Groq API Error: {e}")
        return [{"generated_text": '<start_of_turn>model\n{"error": "Failed to generate outfit structure"}'}]

