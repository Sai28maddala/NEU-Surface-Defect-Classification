import os
import torch
import torchvision.transforms as transforms
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from starlette.requests import Request
from PIL import Image
import io
import base64
import numpy as np
from collections import OrderedDict
import uvicorn

# Create the FastAPI app
app = FastAPI(title="NEU Surface Defect Analyzer")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Define constants
MODEL_PATH = 'models/best_model.pth'
CLASSES = ['crazing', 'inclusion', 'patches', 'pitted_surface', 'rolled-in_scale', 'scratches']

# Define image transformations (same as used during training)
transform = transforms.Compose([
    transforms.Resize((200, 200)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_model():
    """Load the trained model"""
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
            
        # Create a new model with EfficientNet-B0 architecture
        from torchvision.models import efficientnet_b0
        model = efficientnet_b0(weights=None)  # Initialize without weights
        
        # Modify the classifier for our 6 classes
        num_features = model.classifier[1].in_features
        model.classifier[1] = torch.nn.Linear(num_features, 256)
        model.classifier.add_module('2', torch.nn.ReLU())
        model.classifier.add_module('3', torch.nn.Dropout(0.2))
        model.classifier.add_module('4', torch.nn.Linear(256, 6))
        
        # Load the saved model weights
        model_state_dict = torch.load(MODEL_PATH, map_location=torch.device('cpu'))
        model.load_state_dict(model_state_dict)
        print("Successfully loaded model weights from file.")
            
        model.eval()
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load model: {str(e)}")


# Load the model at startup
model = load_model()
if model is None:
    raise RuntimeError("Application cannot start - Model failed to load")

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Render the main page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/predict")
async def predict(file: UploadFile = File(None), image: str = Form(None)):
    """Process the uploaded image and return predictions"""
    try:
        # Validate input
        if not file and not image:
            raise HTTPException(status_code=400, detail="No image provided")
            
        # Get the image from the request
        if file:
            # Validate file type
            if not file.content_type.startswith("image/"):
                raise HTTPException(status_code=400, detail="File must be an image")
            contents = await file.read()
            img = Image.open(io.BytesIO(contents)).convert('RGB')
        else:
            try:
                if 'base64,' in image:
                    image = image.split('base64,')[1]
                image_bytes = base64.b64decode(image)
                img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid base64 image data")

        # Validate image dimensions
        if img.size[0] < 10 or img.size[1] < 10:
            raise HTTPException(status_code=400, detail="Image dimensions too small")
            
        
        # Open and preprocess the image
        img_tensor = transform(img).unsqueeze(0)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(img_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
        # Get the top prediction and all class probabilities
        top_prob, top_class = torch.max(probabilities, 0)
        
        # Convert to Python types for JSON serialization
        class_probs = {CLASSES[i]: float(probabilities[i]) * 100 for i in range(len(CLASSES))}
        prediction = {
            'class': CLASSES[top_class],
            'confidence': float(top_prob) * 100,
            'probabilities': class_probs
        }
        
        return prediction
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    uvicorn.run(app, host="127.0.0.1", port=5000)

