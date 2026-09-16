import React from 'react';

interface PredictionViewProps {
  prediction: string | null;
  confidence: number | null;
}

const PredictionView: React.FC<PredictionViewProps> = ({ prediction, confidence }) => {
  return (
    <div className="prediction-view">
      <h2>Prediction Result</h2>
      {prediction ? (
        <div>
          <p><strong>Predicted Disease:</strong> {prediction}</p>
          <p><strong>Confidence Level:</strong> {confidence ? `${(confidence * 100).toFixed(2)}%` : 'N/A'}</p>
        </div>
      ) : (
        <p>No prediction available. Please upload an image.</p>
      )}
    </div>
  );
};

export default PredictionView;