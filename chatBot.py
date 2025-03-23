import os
import google.generativeai as genai
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

dotenv_path = os.path.join(os.path.dirname(__file__), ".env") 
load_dotenv(dotenv_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("X Google API key is missing. Set 'GEMINI_API_KEY' in .env file or environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    user_message: str

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]

generation_config = {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_output_tokens": 500,
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-pro-exp-02-05",
    safety_settings=safety_settings,
    generation_config=generation_config,
)

DISCLAIMER = "\n\n Disclaimer: The AI-generated response is for informational purposes only and should not be considered legal advice. Please consult a qualified lawyer for any legal matters.*"

LEGAL_PRE_PROMPT = """
You are an AI legal assistant with expertise in contract drafting and legal advisory. 
Your response must be clear, legally precise, and formatted professionally.

Task:
1️. Generate a well-structured **legal contract** based on the provided clauses.
2️. Provide **legal advice** related to the clauses, including risks, improvements, and missing terms.

Make sure to use formal legal language and be concise.
"""

@app.post("/chat/uploadImage")
async def upload_image(user_message: str = Form(""), image: UploadFile = File(None)):
    try:
        image_data = None
        
        if image:
            image_data = await image.read() 

        full_prompt = f"{LEGAL_PRE_PROMPT}\nUser: {user_message}\n" + ("Image attached." if image_data else "")

        response = model.generate_content(full_prompt)

        bot_response = response.text if hasattr(response, "text") else "No response generated."

        return {
            "user_message": user_message,
            "bot_response": bot_response + DISCLAIMER,
            "image_uploaded": bool(image_data),
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload error: {str(e)}")

@app.post("/chat/chatWithBot")
def chat_with_bot(chat_request: ChatRequest):
    try:
        user_message = chat_request.user_message

        full_prompt = f"{LEGAL_PRE_PROMPT}\nUser: {user_message}"

        response = model.generate_content(full_prompt)

        bot_response = response.text if hasattr(response, "text") else "Sorry, I couldn't generate a response."

        return {"user_message": user_message, "bot_response": bot_response + DISCLAIMER}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot error: {str(e)}")
