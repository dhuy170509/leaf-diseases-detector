# Frontend UI - Modern Design Guide

## Overview
A modern, responsive web interface for Leaf Disease Detector with dark/light theme support.

## Features

### 1. **Responsive Layout**
- Mobile-first design
- Desktop, tablet, and mobile optimized
- Flexible grid system
- Touch-friendly controls

### 2. **Dark/Light Theme**
- System preference detection
- Toggle switch in header
- Persistent theme preference
- Smooth transitions

### 3. **Image Upload**
- Drag-and-drop support
- Click-to-upload
- Image preview
- File type validation
- Size indication

### 4. **Real-time Prediction**
- Live processing feedback
- Confidence visualization
- Severity indicators
- Execution time display

### 5. **Disease Details**
- Collapsible sections
- Symptoms, treatment, prevention
- Economic impact
- Affected crops
- Professional typography

### 6. **Model Selection**
- Easy model switching
- Performance metrics display
- Size, speed, accuracy comparison
- Model descriptions

## Component Structure

```
src/
├── AppModern.tsx              # Main app component
├── components/
│   ├── ImageUploaderModern.tsx    # Upload interface
│   ├── PredictionResultModern.tsx # Results display
│   ├── DiseaseDetailsModern.tsx    # Disease info
│   └── ModelSelectorModern.tsx     # Model selection
├── styles/
│   └── app.css               # Modern styles with theme support
└── index.tsx                 # Entry point
```

## Color Scheme

### Light Theme
- Background: `#ffffff`
- Secondary: `#f9fafb`
- Text: `#111827`
- Accent: `#10b981` (Green)

### Dark Theme
- Background: `#111827`
- Secondary: `#1f2937`
- Text: `#f3f4f6`
- Accent: `#10b981` (Green)

## Usage

### Installation
```bash
cd client
npm install
npm install lucide-react
```

### Running
```bash
npm start
```

### Building
```bash
npm run build
```

## Component APIs

### ImageUploaderModern
```typescript
interface ImageUploaderProps {
  onUpload: (file: File, metadata: any) => void;
  loading: boolean;
  isDarkMode: boolean;
}
```

### PredictionResultModern
```typescript
interface PredictionResultProps {
  prediction: {
    prediction: { disease: string; confidence: number; severity: string };
    diseaseInfo: any;
    modelUsed: string;
    processingTime: number;
    confidenceLevel: string;
    modelBreakdown: any[];
  };
  isDarkMode: boolean;
}
```

### DiseaseDetailsModern
```typescript
interface DiseaseDetailsProps {
  diseaseInfo: {
    name: string;
    symptoms: string;
    treatment: string;
    prevention: string;
    causes: string;
    economicImpact: string;
    affectedCrops: string[];
  };
  isDarkMode: boolean;
}
```

### ModelSelectorModern
```typescript
interface ModelSelectorProps {
  onModelSelect: (model: string) => void;
  selectedModel: string;
  isDarkMode: boolean;
}
```

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Focus indicators
- Color contrast compliance
- Screen reader support

## Performance Optimization

- CSS-in-JS with TailwindCSS-like utilities
- Lazy component loading
- Image optimization
- Minimal re-renders
- Efficient animations

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Changing Colors
Edit `app.css`:
```css
:root {
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}
```

### Adding New Sections
1. Create component in `components/`
2. Import in `AppModern.tsx`
3. Add styling to `app.css`
4. Implement responsive design

## Best Practices

1. **Mobile First**
   - Design for mobile, enhance for desktop
   - Test on multiple devices

2. **Performance**
   - Minimize re-renders
   - Optimize images
   - Use CSS for animations

3. **Accessibility**
   - Use semantic HTML
   - Add ARIA labels
   - Test with keyboard navigation

4. **Consistency**
   - Follow color scheme
   - Use consistent spacing
   - Maintain typography hierarchy

## Future Enhancements

- [ ] PWA support
- [ ] Offline functionality
- [ ] Image gallery
- [ ] History tracking
- [ ] Sharing predictions
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] User accounts

## Troubleshooting

### Theme not updating
- Clear browser cache
- Check localStorage
- Verify CSS is loaded

### Images not uploading
- Check file size
- Verify CORS settings
- Check API endpoint

### Responsive issues
- Use browser dev tools
- Test on actual devices
- Check media queries

---

For more information, see [API_REFACTORED.md](API_REFACTORED.md) and [README.md](README.md).
