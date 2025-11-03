
import React, { useState, useEffect, useRef } from 'react';
import './chat.css';
import axios from 'axios';
import nlp from 'compromise'; // 🧠 NLP library

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: `👋 Hi! You can ask me things like:\n
                • "Find music and catering under 3000"\n
                • "Show decor services over 500"\n
                • "Get music and decor between 1000 and 2500"\n
                • "Find catering from 500 to 1500"\n
                I'll show you the best services I can find! 🎯`
    }
  ]);

  const [input, setInput] = useState('');
  const [allServices, setAllServices] = useState([]);
  const [isOpen, setIsOpen] = useState(true); // 📂 Collapsible toggle state
  const [voiceEnabled, setVoiceEnabled] = useState(true); // 🔊 Voice response toggle

  const toggleChat = () => setIsOpen(!isOpen); // Toggle chat window open/close

  const messagesEndRef = useRef(null);

  // 🔃 Auto scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // ✅ using this to Load high‑quality voices once on mount
  useEffect(() => {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices(); // Ensure voices are loaded
    };
  }, []);

  // Function to read text aloud if voice toggle is ON
  const speakText = (text) => {
    if (!voiceEnabled) return; // 🔇 Skip if muted
    const synth = window.speechSynthesis;
    if (!synth) return;

    const voices = synth.getVoices();
    // ✅ Try to select a better quality voice (especially Chrome 'Google' voices)
    const selectedVoice = voices.find(
      (voice) =>
        voice.name.toLowerCase().includes("google") && voice.lang.includes("en-US")
    );

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.voice = selectedVoice || voices[0]; // fallback
    utterance.rate = 1;   // keep natural
    utterance.pitch = 1;  // keep natural
    utterance.volume = 1; // max volume
    synth.speak(utterance);
  };

  //  Fetch services from backend (cached)
  const fetchServices = async () => {
    if (allServices.length > 0) return allServices;
    try {
      const res = await axios.get('http://localhost:5050/api/services');
      setAllServices(res.data);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch services', err);
      return [];
    }
  };

  //  Parses input to extract category and price
  const parseQuery = (text) => {
    const doc = nlp(text.toLowerCase());
    const categories = ['catering', 'music', 'decor'];
    const foundCategories = categories.filter(cat => text.includes(cat));
    const priceMatch = text.match(/under\s?(\d+)/);
    const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;
    return { foundCategories, maxPrice };
  };

  //  Bundle logic to find best combos under budget
  function buildBundles(services, categories, maxBudget) {
    const filtered = services.filter(s => categories.includes(s.category.toLowerCase()));
    const grouped = {};
    categories.forEach(cat => {
      grouped[cat] = filtered.filter(s => s.category.toLowerCase() === cat);
    });

    const combos = [];
    grouped[categories[0]]?.forEach(a => {
      if (categories.length === 1) {
        if (a.price <= maxBudget) {
          combos.push({ services: [a], total: a.price, score: a.preferenceScore });
        }
      } else {
        grouped[categories[1]]?.forEach(b => {
          const totalPrice = a.price + b.price;
          if (totalPrice <= maxBudget) {
            combos.push({
              services: [a, b],
              total: totalPrice,
              score: a.preferenceScore + b.preferenceScore
            });
          }
        });
      }
    });

    return combos.sort((x, y) => y.score - x.score).slice(0, 3); // top 3 combos
  }

  // 📩 Called when user sends message
  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage = { from: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);

    const services = await fetchServices();
    const text = input.toLowerCase();
    let reply = "Sorry, I couldn't find anything for that.";

    // Price range detection
    const underMatch = text.match(/under\s?(\d+)/);
    const overMatch = text.match(/over\s?(\d+)/);
    const rangeMatch = text.match(/(?:between|from)\s?(\d+)\s?(?:and|to)\s?(\d+)/);

    const isBundleRequest = text.includes("build") || text.includes("bundle") || text.includes("package");

    const categories = ['catering', 'decor', 'music'];
    const foundCategories = categories.filter(cat => text.includes(cat));
    const uniqueCategories = [...new Set(foundCategories)];

    let maxPrice = null;
    let minPrice = null;

    if (rangeMatch) {
      minPrice = parseInt(rangeMatch[1]);
      maxPrice = parseInt(rangeMatch[2]);
    } else if (underMatch) {
      maxPrice = parseInt(underMatch[1]);
    } else if (overMatch) {
      minPrice = parseInt(overMatch[1]);
    }

    //  Smart bundle logic
    if (isBundleRequest && uniqueCategories.length >= 2 && maxPrice) {
      const bundles = buildBundles(services, uniqueCategories, maxPrice);
      if (bundles.length > 0) {
        reply = `🎯 Top ${bundles.length} bundle(s) under £${maxPrice}:`;
        bundles.forEach(b => {
          const names = b.services.map(s => `${s.title} (£${s.price})`).join(' + ');
          reply += `\n• ${names} → Total £${b.total}`;
        });
      } else {
        reply = "❌ Couldn't build a bundle within that budget.";
      }
    } else {
      //  Regular filtering logic
      const filtered = services.filter(service => {
        const matchCategory = uniqueCategories.length > 0
          ? uniqueCategories.includes(service.category.toLowerCase())
          : true;

        const matchMin = minPrice !== null ? service.price >= minPrice : true;
        const matchMax = maxPrice !== null ? service.price <= maxPrice : true;

        return matchCategory && matchMin && matchMax;
      });

      if (filtered.length > 0) {
        reply = `Found ${filtered.length} service(s):\n` +
          filtered.slice(0, 3).map(s => `• ${s.title} (£${s.price})`).join('\n');
      }
    }

    //  Add bot message and optionally speak
    setMessages(prev => [...prev, { from: 'bot', text: reply }]);
    speakText(reply); // 🗣️ Speak reply if voice toggle is ON
    setInput('');
  };

  return (
    <div className="chatbot-container">
      {/* 📂 Chat open/close toggle */}
      <button className="chat-toggle-btn" onClick={toggleChat}>
        {isOpen ? '🔽' : '💬'}
      </button>

      {/* 💬 Chat window */}
      {isOpen && (
        <div className="chat-window">
          {/* 🔃 Scrollable message area */}
          <div className="message-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 🔈 Voice toggle checkbox */}
          <div className="voice-toggle">
            <label>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={() => setVoiceEnabled(!voiceEnabled)}
              />
              {voiceEnabled ? '🔊 Voice On' : '🔇 Voice Off'}
            </label>
          </div>

          {/* ✍️ Chat input */}
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about services..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;