import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Smile, Mic, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { API_BASE } from '../config/api.js';
import './DrSmilesChat.css';

const systemInstruction = "You are Dr. Smiles, an incredibly fun, magical, and super caring dental bear! Your absolute favorite thing in the whole world is taking care of teeth! You speak in an enthusiastic, goofy, and super friendly tone. You frequently recommend playing our awesome HappyDental mini-games (like 'Clinic Explorer', 'Tooth Defender', or 'Sugar Bug Blaster') to help kids learn and feel super brave! Keep your responses very short, punchy, and use lots of fun emojis so they fit easily in a mobile chat bubble.";

const MOCK_RESPONSES = [
  { keywords: ['hurt', 'pain', 'scared', 'afraid', 'fear', 'cry', 'sad'], text: "Oh no, please don't be scared! 🐻 I have a super secret trick: my tools just tickle your teeth! 🪄 To see how brave you can be, you should totally play 'Tooth Defender' in our Games section! 🎮" },
  { keywords: ['needle', 'shot', 'injection', 'poke'], text: "Ah, the sleepy juice! 💧 We just put the tooth to sleep so it snoozes while we wash away the bugs. It's like a tiny mosquito bite! Want to see how it works? Try playing 'Clinic Explorer'! 🏥✨" },
  { keywords: ['drill', 'noise', 'loud', 'buzz', 'machine'], text: "That buzzy sound is my special tooth-tickler! Bzzzz! 🐝 It washes away the sticky sugar bugs. You can practice blasting bugs in the 'Sugar Bug Blaster' game! 🎯" },
  { keywords: ['cavity', 'bug', 'sugar', 'candy', 'sweet', 'chocolate', 'hurt tooth'], text: "Yuck, sugar bugs! 🦠 They love to hide in tiny caves in our teeth. We just sweep them out and patch the cave with a shiny star! ⭐ Go play 'Sugar Bug Blaster' to help me catch them! 🦸‍♂️" },
  { keywords: ['hello', 'hi', 'hey', 'how are you', 'howdy', 'morning', 'afternoon'], text: "Hello there! I'm Dr. Smiles 🐻, and I'm doing SUPER great! Are you ready for a fun adventure today? I highly recommend checking out our cool Games to start having fun! 🎮✨" },
  { keywords: ['why', 'same', 'repeat', 'robot', 'fake', 'ai'], text: "Haha! 🐻 I am just a fun bear waiting to connect to my super-smart AI brain! Until my creator adds an API key, I might repeat myself sometimes. But I still love teeth! 🦷✨" },
  { keywords: ['game', 'play', 'fun', 'bored'], text: "Did someone say GAMES?! 🎮 I love games! You should totally check out 'Tooth Defender' or 'Clinic Explorer'! They are so much fun and you learn about teeth! 🚀" },
  { keywords: ['brush', 'paste', 'toothbrush', 'clean'], text: "Brushing is my favorite time of the day! 🪥 Did you know you should brush for 2 whole minutes? Try singing a song while you do it! 🎶" },
  { keywords: ['dentist', 'doctor', 'you', 'who'], text: "I'm Dr. Smiles, your friendly dental bear! 🐻 My job is to make sure your smile is as bright as a star! ⭐ Want to learn what I do? Play 'Clinic Explorer'! 🏥" },
  { keywords: ['yes', 'yeah', 'ok', 'sure', 'yep'], text: "Awesome! High five! ✋ Let's keep our smiles bright and shiny! Try heading over to the Games section to earn some coins! 💰✨" },
  { keywords: ['no', 'nope', 'nah'], text: "That's totally okay! 🐻 We go at your pace. Whenever you are ready for some fun, the 'Sugar Bug Blaster' game is waiting for you! 🎯" }
];

const DEFAULT_RESPONSES = [
  "That's a fantastic question! 🌟 I love talking about teeth! Want to explore the clinic yourself and learn more? Go play the 'Clinic Explorer' game right now! 🏥🚀",
  "Wow, that's interesting! 🐻 Did you know playing 'Sugar Bug Blaster' helps you learn how to fight cavity creeps? You should try it! 🎮",
  "Haha, you are so fun to talk to! 😄 If you want to see what happens in a real dental clinic, check out 'Clinic Explorer' in the Games tab! 🏥✨",
  "I'm so glad we're friends! 🐻 Remember to brush your teeth twice a day! Wanna practice? Play our fun 'Tooth Defender' game! 🪥🛡️"
];
let defaultResponseIndex = 0;

export default function DrSmilesChat() {
  const userId = useStore(state => state.userId);
  const [messages, setMessages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API_BASE}/api/chat/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([{ id: 1, text: "Hi! I'm Dr. Smiles 🐻. I'm here to answer any questions you have about visiting the dentist. What's on your mind?", sender: 'bot', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        }
        setIsLoaded(true);
      })
      .catch(err => {
        console.error('Failed to fetch chat history', err);
        setIsLoaded(true);
      });
  }, [userId]);

  // Helper to save message
  const saveMessage = async (msg) => {
    if (!userId) return;
    try {
      await fetch(`${API_BASE}/api/chat/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
    } catch (err) {
      console.error('Failed to save message', err);
    }
  };
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    
    // Add user message
    const newMsg = {
      id: Date.now(),
      text: userMsg,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    saveMessage(newMsg);

    setIsTyping(true);

    // Simulate AI thinking and responding
    // AI or Fallback Response
    setTimeout(async () => {
      let responseText = "";
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      try {
        if (!groqApiKey) {
          throw new Error("No API key provided, using fallback");
        }

        // Format conversation history for Groq
        const apiMessages = [
          { role: "system", content: systemInstruction },
          ...messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: "user", content: userMsg }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqApiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant", // Updated to the latest supported Groq model
            messages: apiMessages,
            max_tokens: 150
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
           throw new Error(result.error?.message || "Failed to fetch from Groq");
        }
        
        responseText = result.choices[0].message.content;

      } catch (err) {
        console.warn("AI fallback:", err.message);
        
        // If an API key is present but failing, show the actual error to help the user debug it
        if (groqApiKey && groqApiKey.length > 5) {
           responseText = `Oops! I tried to connect to my AI brain, but got an error: "${err.message}". Please check your Groq API key!`;
        } else {
          // Normal fallback if no API key is provided
          const lowerMsg = userMsg.toLowerCase();
          responseText = MOCK_RESPONSES.find(r => r.keywords.some(kw => lowerMsg.includes(kw)))?.text;
          
          if (!responseText) {
            responseText = DEFAULT_RESPONSES[defaultResponseIndex];
            defaultResponseIndex = (defaultResponseIndex + 1) % DEFAULT_RESPONSES.length;
          }
        }
      }

      const botMsg = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMsg]);
      saveMessage(botMsg);
      setIsTyping(false);
    }, 500);
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <Link to="/" className="back-btn"><ArrowLeft /> Back</Link>
        <div className="chat-profile">
          <div className="avatar bg-pink float">🐻</div>
          <div>
            <h2>Dr. Smiles</h2>
            <span className="status">AI Companion</span>
          </div>
        </div>
      </header>

      <div className="chat-container">
        <div className="chat-messages">
          {!isLoaded && <div style={{textAlign: "center", padding: 20}}>Loading chat history...</div>}
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                className={`message ${msg.sender}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                layout
              >
                <div className="message-content">
                  <p>{msg.text}</p>
                </div>
                <span className="message-time">{msg.time}</span>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                className="message bot typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div className="message-content">
                  <div className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <form className="chat-input-wrapper card" onSubmit={handleSend}>
            <button type="button" className="icon-btn"><Smile size={24} color="var(--gray-400)"/></button>
            <input 
              type="text" 
              placeholder="Ask Dr. Smiles anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="button" className="icon-btn"><ImageIcon size={24} color="var(--gray-400)"/></button>
            <button type="button" className="icon-btn"><Mic size={24} color="var(--gray-400)"/></button>
            <button type="submit" className="send-btn" disabled={!input.trim()}><Send size={20} color="white"/></button>
          </form>
        </div>
      </div>
    </div>
  );
}
