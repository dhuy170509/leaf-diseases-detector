// Minimal modelService stub (HARD RESET)
// Exposes a single predictImage function that does not run any models.

export const predictImage = async (_imageData: any) => {
  return {
    status: 'NO_MODEL_INSTALLED',
    message: 'No AI model is currently installed. Please add a model.'
  };
};
