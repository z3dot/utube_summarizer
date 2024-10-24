import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMoon, FaSun, FaYoutube, FaWikipediaW } from 'react-icons/fa';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { injected } from './wallet';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    background-color: ${props => props.theme.background};
    color: ${props => props.theme.text};
    transition: all 0.3s ease;
  }
`;

const lightTheme = {
  background: '#f0f2f5',
  text: '#333',
  primary: '#3b82f6',
  secondary: '#10b981',
  error: '#ef4444',
  card: '#ffffff',
};

const darkTheme = {
  background: '#1f2937',
  text: '#f9fafb',
  primary: '#60a5fa',
  secondary: '#34d399',
  error: '#f87171',
  card: '#374151',
};

const AppContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
  text-align: center;
`;

const Card = styled(motion.div)`
  background-color: ${props => props.theme.card};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const Tab = styled(motion.button)`
  padding: 12px 24px;
  background-color: transparent;
  color: ${props => props.active ? props.theme.primary : props.theme.text};
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  border: 2px solid ${props => props.theme.primary}40;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: all 0.3s ease;
  background-color: ${props => props.theme.card};
  color: ${props => props.theme.text};

  &:focus {
    border-color: ${props => props.theme.primary};
  }
`;

const Button = styled(motion.button)`
  padding: 12px 24px;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.secondary};
  }

  &:disabled {
    background-color: #a0aec0;
    cursor: not-allowed;
  }
`;

const ThemeToggle = styled(motion.button)`
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: ${props => props.theme.card};
  border: none;
  color: ${props => props.theme.text};
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const HistoryContainer = styled(Card)`
  text-align: left;
`;

const HistoryItem = styled(motion.div)`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.primary}20;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${props => props.theme.primary}10;
  }
`;

function App() {
  const [activeTab, setActiveTab] = useState('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [wikiQuestion, setWikiQuestion] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [thoughts, setThoughts] = useState([]);
  const [theme, setTheme] = useState('light');
  const [history, setHistory] = useState([]);
  const { active, account, library, connector, activate, deactivate } = useWeb3React();
  const [balance, setBalance] = useState();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary('');
    setThoughts([]);

    const endpoint = activeTab === 'youtube' ? '/summarize' : '/summarize_wiki';
    const payload = activeTab === 'youtube' ? { video_url: videoUrl } : { question: wikiQuestion };

    try {
      setThoughts(prev => [...prev, `Fetching ${activeTab === 'youtube' ? 'video transcript' : 'Wikipedia content'}...`]);
      const response = await axios.post(endpoint, payload);
      
      setThoughts(prev => [...prev, "Generating summary..."]);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate thinking time
      
      setSummary(response.data.summary);
      setThoughts(prev => [...prev, "Summary generated successfully!"]);

      // Add to history
      setHistory(prev => [{type: activeTab, query: activeTab === 'youtube' ? videoUrl : wikiQuestion}, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error('Error:', error);
      setSummary('An error occurred while generating the summary.');
      setThoughts(prev => [...prev, "Error occurred during summarization."]);
    }
    setLoading(false);
  };

  const loadFromHistory = (item) => {
    if (item.type === 'youtube') {
      setActiveTab('youtube');
      setVideoUrl(item.query);
    } else {
      setActiveTab('wiki');
      setWikiQuestion(item.query);
    }
  };

  async function connect() {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex);
    }
  }

  async function disconnect() {
    try {
      deactivate();
    } catch (ex) {
      console.log(ex);
    }
  }

  useEffect(() => {
    if (library && account) {
      let stale = false;
      library.getBalance(account).then((balance) => {
        if (!stale) {
          setBalance(ethers.formatEther(balance));
        }
      });
      return () => {
        stale = true;
        setBalance(undefined);
      };
    }
  }, [library, account]);

  async function sendPayment() {
    if (library && account) {
      try {
        const signer = library.getSigner();
        const tx = await signer.sendTransaction({
          to: "YOUR_ETHEREUM_ADDRESS",
          value: ethers.parseEther("0.01") // 0.01 ETH
        });
        await tx.wait();
        alert("Payment successful!");
      } catch (ex) {
        console.log(ex);
        alert("Payment failed. Please try again.");
      }
    }
  }

  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <GlobalStyle />
      <AppContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <ThemeToggle onClick={toggleTheme} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </ThemeToggle>
        <h1>AI Summarizer</h1>
        <TabContainer>
          <Tab
            active={activeTab === 'youtube'}
            onClick={() => setActiveTab('youtube')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaYoutube /> YouTube
          </Tab>
          <Tab
            active={activeTab === 'wiki'}
            onClick={() => setActiveTab('wiki')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaWikipediaW /> Wikipedia
          </Tab>
        </TabContainer>
        <Card>
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              value={activeTab === 'youtube' ? videoUrl : wikiQuestion}
              onChange={(e) => activeTab === 'youtube' ? setVideoUrl(e.target.value) : setWikiQuestion(e.target.value)}
              placeholder={activeTab === 'youtube' ? "Enter YouTube video URL" : "Ask a question for Wikipedia summary"}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loading ? 'Summarizing...' : 'Summarize'}
            </Button>
          </form>
        </Card>
        <AnimatePresence>
          {thoughts.length > 0 && (
            <Card
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3>AI Thoughts</h3>
              {thoughts.map((thought, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {thought}
                </motion.p>
              ))}
            </Card>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {summary && (
            <Card
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2>{activeTab === 'youtube' ? 'Video Summary' : 'Wikipedia Summary'}</h2>
              <p>{summary}</p>
            </Card>
          )}
        </AnimatePresence>
        <HistoryContainer>
          <h3>Recent Searches</h3>
          {history.map((item, index) => (
            <HistoryItem
              key={index}
              onClick={() => loadFromHistory(item)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item.type === 'youtube' ? <FaYoutube /> : <FaWikipediaW />} {item.query}
            </HistoryItem>
          ))}
        </HistoryContainer>
        <div>
          {active ? (
            <div>
              <p>Connected with {account}</p>
              <p>Balance: {balance} ETH</p>
              <button onClick={disconnect}>Disconnect</button>
              <button onClick={sendPayment}>Pay 0.01 ETH</button>
            </div>
          ) : (
            <button onClick={connect}>Connect to a wallet</button>
          )}
        </div>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
