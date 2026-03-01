# NEU Surface Defect Analyzer

A web application for analyzing and classifying surface defects in steel using the NEU Surface Defect dataset and a pre-trained PyTorch model.

## Overview

This application provides a user-friendly interface to upload images of steel surfaces and detect six types of defects:

1. Crazing
2. Inclusion
3. Patches
4. Pitted Surface
5. Rolled-in Scale
6. Scratches

The system uses a pre-trained EfficientNet-B0 model to classify the defects with high accuracy.

## Project Structure

```
NEU Surface Defect/
├── app.py                  # FastAPI application
├── models/                 # Pre-trained models
│   └── best_model.pth      # The trained PyTorch model
├── data/                   # Dataset
│   ├── train/              # Training data
│   │   ├── annotations/    # XML annotations
│   │   └── images/         # Images by defect type
│   └── validation/         # Validation data
│       ├── annotations/    # XML annotations
│       └── images/         # Images by defect type
├── static/                 # Static files
│   ├── css/                # CSS styles
│   │   └── style.css       # Main stylesheet
│   └── js/                 # JavaScript files
│       └── main.js         # Client-side functionality
├── templates/              # HTML templates
│   └── index.html          # Main page
└── requirements.txt        # Python dependencies
```

## Setup and Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

2. Run the FastAPI application:

```bash
python app.py
```

3. Open your web browser and navigate to:

```
http://localhost:5000
```

## How to Use

1. Upload an image by dragging and dropping it onto the upload area or by clicking the "Browse Files" button.
2. Once an image is uploaded, click the "Analyze Defect" button.
3. The system will process the image and display the detected defect type, confidence level, and probability distribution for all defect classes.

## Model Information

The model used is a fine-tuned EfficientNet-B0 architecture trained on the NEU Surface Defect dataset. The model achieves high accuracy in classifying the six types of surface defects.

## Dataset

The NEU Surface Defect dataset contains six types of typical surface defects of hot-rolled steel strips. Each class contains 300 grayscale images (200 for training, 100 for testing), each with a size of 200×200 pixels.



