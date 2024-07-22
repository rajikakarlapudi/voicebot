import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneAltSlash } from '@fortawesome/free-solid-svg-icons';
import './App.css';

const App = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [language, setLanguage] = useState('en-US'); // Default language

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    setRecognition(recognition);
  }, [language]);

  const startListening = () => {
    if (recognition && !listening) {
      recognition.lang = language; // Set language dynamically
      recognition.start();
      setListening(true);
    }
  };

  const stopListening = () => {
    if (recognition && listening) {
      recognition.stop();
      setListening(false);
      fetchOpenAIResponse(transcript);
    }
  };

  const fetchOpenAIResponse = async (text) => {
    try {
      setError('');
      const res = await axios.post('http://localhost:5000/api/openai', {
        prompt: text,
        language: language // Include language in request if needed
      });
      const aiResponse = res.data.choices[0].message.content;
      setResponse(aiResponse);
      speakResponse(aiResponse);
    } catch (error) {
      setError('Error fetching OpenAI response: ' + (error.response ? error.response.data.message : error.message));
    }
  };

  const speakResponse = (text) => {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    synth.speak(utterance);
  };

  // Function to change language
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div className="voice-bot-container">
      <div className='button-container'>
      <button className="icon-button" onClick={listening ? stopListening : startListening}>
        <FontAwesomeIcon icon={listening ? faMicrophoneAltSlash : faMicrophone} size="3x" />
      </button>
      <select onChange={handleLanguageChange} value={language} style={{ marginBottom: '20px' }} className='options'>
        <option value="en-US">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="te-IN">Telugu</option>
      </select>
      </div>
      <div className="transcription-container">
        <h2>Question:</h2>
        <p>{transcript}</p>
      </div>
      <div className="response-container">
        <textarea readOnly value={response} />
      </div>
      {error && <h2>Error:</h2>}
      {error && <p>{error}</p>}
    </div>
  );
};

export default App;
