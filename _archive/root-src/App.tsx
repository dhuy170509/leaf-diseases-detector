/// <reference types="react" />
import React from 'react';

const App: React.FC = () => {
  return (
    <div>
      <h1>Leaf Disease Detector</h1>
      <button aria-label="upload-image">Upload Image</button>
      <div role="region" aria-label="prediction-results">Prediction Results</div>
    </div>
  );
}

export default App;