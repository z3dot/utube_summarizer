from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from transformers import pipeline
import wikipedia

app = Flask(__name__)
CORS(app)

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

def get_transcript(video_url):
    video_id = video_url.split("v=")[1]
    transcript = YouTubeTranscriptApi.get_transcript(video_id)
    return " ".join([entry['text'] for entry in transcript])

def summarize_text(text):
    summary = summarizer(text, max_length=200, min_length=50, do_sample=False)
    return summary[0]['summary_text']

@app.route('/summarize', methods=['POST'])
def summarize():
    video_url = request.json['video_url']
    transcript = get_transcript(video_url)
    summary = summarize_text(transcript)
    return jsonify({'summary': summary})

@app.route('/summarize_wiki', methods=['POST'])
def summarize_wiki():
    question = request.json['question']
    try:
        # Search Wikipedia for the question
        search_results = wikipedia.search(question)
        if not search_results:
            return jsonify({'summary': "No Wikipedia article found for this question."})
        
        # Try to get the page content of the first search result
        try:
            page = wikipedia.page(search_results[0], auto_suggest=False)
        except wikipedia.DisambiguationError as e:
            # If we get a disambiguation page, try the first option
            page = wikipedia.page(e.options[0], auto_suggest=False)
        except wikipedia.PageError:
            # If the page doesn't exist, return an error message
            return jsonify({'summary': "Couldn't find a specific Wikipedia page for this question."})
        
        content = page.summary  # Use the summary instead of full content
        
        # Summarize the content
        if len(content) > 1024:
            summary = summarizer(content[:1024], max_length=150, min_length=50, do_sample=False)[0]['summary_text']
        else:
            summary = content
        
        return jsonify({'summary': summary})
    except Exception as e:
        return jsonify({'summary': f"An error occurred: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
