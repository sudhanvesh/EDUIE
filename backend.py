import json
import os
import time
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()
import json


class StudyCompanionBackend:

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        print("Using API Key:", self.api_key)
        
    def _call_gemini(self, prompt: str, system_instruction: str, is_json: bool = False):
     print("⚡ Demo mode active — Gemini API disabled due to quota.")

     if is_json:
        return {"quiz": [], "flashcards": []}

     return f"(Demo Mode) Hint for: {prompt}"
        

    def get_problem_hint(self, problem_description: str, subject: str) -> str:
        """
        Provides a progressive hint for a problem without giving away the full answer immediately.
        """
        system_prompt = (
            f"You are a supportive {subject} tutor. Your goal is to guide the student "
            "through a problem using the Socratic method. Do not give the final answer. "
            "Provide a helpful hint or ask a guiding question that leads them to the next step."
        )
        return self._call_gemini(problem_description, system_prompt)

    def generate_flashcards(self, topic_content: str) -> List[Dict[str, str]]:
        """
        Generates a list of flashcards (Front/Back) from a block of text or a topic.
        """
        system_prompt = (
            "You are a study expert. Create a list of concise flashcards from the provided text. "
            "Return the data in a structured JSON format: "
            "{ 'flashcards': [ { 'front': 'question or term', 'back': 'answer or definition' } ] }"
        )
        result = self._call_gemini(topic_content, system_prompt, is_json=True)
        return result.get('flashcards', []) if isinstance(result, dict) else []

    def create_quiz(self, topic: str, difficulty: str = "medium", count: int = 5) -> List[Dict[str, Any]]:
        """
        Creates a multiple-choice quiz based on a topic.
        """
        system_prompt = (
            f"Generate a {difficulty} level quiz with {count} multiple-choice questions about the topic. "
            "Each question must have 4 options and one clearly marked correct answer. "
            "Return the data in structured JSON format: "
            "{ 'quiz': [ { 'question': '...', 'options': ['A', 'B', 'C', 'D'], 'correct_index': 0, 'explanation': '...' } ] }"
        )
        result = self._call_gemini(topic, system_prompt, is_json=True)
        return result.get('quiz', []) if isinstance(result, dict) else []


from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/')
def home():
    return "Study Companion Backend Running"

STUDY_AI = StudyCompanionBackend(api_key=os.getenv("GEMINI_API_KEY"))


@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    subject = data.get('subject', 'General')
    reply = STUDY_AI.get_problem_hint(message, subject)
    return jsonify({ 'reply': reply })

@app.route('/quiz', methods=['POST'])
def quiz():
    data = request.json
    topic = data.get('topic', '')
    result = STUDY_AI.create_quiz(topic)
    return jsonify({ 'quiz': result })

@app.route('/flashcards', methods=['POST'])
def flashcards():
    data = request.json
    topic = data.get('topic', '')
    result = STUDY_AI.generate_flashcards(topic)
    return jsonify({ 'flashcards': result })

if __name__ == '__main__':
    app.run(port=5000, debug=True)