import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import CropManagement from './components/CropManagement';
import Chatbot from './components/Chatbot';
import TrainingPanel from './components/TrainingPanel';
import './styles/main.css';
import './styles/training.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prediction' | 'crops' | 'training'>('prediction');

  return (
    <div className="App">
      <header className="app-header">
        <h1>🌿Lá nói bệnh-LeafAI</h1>
        <p>Giải pháp công nghệ nhận diện bệnh thực vật từ hình ảnh</p>
      </header>

      <nav className="app-nav">
        <button
          className={`tab-btn ${activeTab === 'prediction' ? 'active' : ''}`}
          onClick={() => setActiveTab('prediction')}
        >
          📷 Phân tích ảnh
        </button>
        <button
          className={`tab-btn ${activeTab === 'crops' ? 'active' : ''}`}
          onClick={() => setActiveTab('crops')}
        >
          🌱 Quản lý cây
        </button>
        <button
          className={`tab-btn ${activeTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveTab('training')}
        >
          🤖 Huấn luyện AI
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'prediction' && (
          <div className="tab-content">
            <ImageUploader />
          </div>
        )}
        {activeTab === 'crops' && (
          <div className="tab-content">
            <CropManagement />
          </div>
        )}
        {activeTab === 'training' && (
          <div className="tab-content">
            <TrainingPanel />
          </div>
        )}
      </main>

      {/* Chatbot Widget */}
      <Chatbot cropType="tomato" />
    </div>
  );
};

export default App;