# Rug Chart - Frontend Developer Technical Assessment

## 🔗 Live Demo

[View Live Demo](https://rugschart.vercel.app/)

## 📝 Project Overview

The main focus was on enhancing the chart component with engaging animations, smooth transitions, and responsive design.

## 💡 Technical Migration

### Canvas to Chart.js Trade-off

**Original Canvas Implementation**

- Low-level drawing API with direct pixel manipulation
- Complete control over rendering and animations
- Manual handling of all chart behaviors
- Complex but highly customizable

**Current Chart.js Solution**

- High-level, declarative API
- Built-in handling of animations, scaling, and responsiveness
- Plugin system for extended functionality
- Faster development and better maintainability

This migration prioritized development efficiency and maintainability while retaining the ability to create custom animations and effects.

## 🎯 Key Features

### Interactive Chart Component

- Real-time price movement visualization
- Smooth animations and transitions
- Dynamic color changes based on price movement
- Responsive scaling and adaptable viewport

### Visual Effects & Animations

- "To The Moon" celebration effect with animated rocket and stars
- Rug pull shake animation with color transitions
- Dynamic background gradient changes
- Countdown pulse animation
- Smooth candle transitions

### Technical Implementation

- Built with React + TypeScript + Vite
- Chart.js integration with custom configurations
- CSS animations and keyframes
- Responsive design principles
- Performance optimized animations using requestAnimationFrame

## 🛠 Technologies Used

- React 19.1.0
- TypeScript
- Chart.js 4.4.9
- chartjs-plugin-annotation 3.1.0
- Vite 6.3.5

## 💻 Development Setup

1. Clone the repository

```bash
git clone <repository-url>
```

2. Install dependencies

```bash
npm install
```

3. Run development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

## 🎨 Design Decisions

### Chart Enhancement

- Implemented custom animations for price movements
- Added visual feedback for significant price changes
- Created engaging "To The Moon" celebration effects
- Designed smooth transitions between states

### User Experience

- Responsive design for all screen sizes
- Intuitive visual feedback
- Smooth animations that don't interfere with functionality
- Clear countdown visualization

### Code Quality

- TypeScript for type safety
- Component-based architecture
- Modular CSS with clear naming conventions
- Comprehensive commenting for maintainability

## 🔍 Technical Assessment Focus Areas

### Animation & Transitions

- Custom keyframe animations for:
  - Moon shot effect with stars
  - Rug pull shake effect
  - Countdown pulse
  - Background gradient transitions

### Component Architecture

- Clean, maintainable code structure
- TypeScript implementation
- Efficient state management
- Modular design patterns

### Visual Design

- Solana-inspired color scheme
- Responsive layouts
- Interactive elements
- Professional styling

### Performance

- Optimized rendering cycles
- Efficient animation handling
- Smooth state transitions
- Mobile responsiveness

## 📈 Future Improvement Possibilities

- Add price pulse animations for significant changes
- Implement floating particle effects
- Add more chart interaction options
- Enhanced mobile experience
- More customization options
- Real-time data integration possibilities

## 🚀 Deployment

The project is deployed on Vercel with automatic deployments configured for the main branch.

## 📄 License

This project was created as part of a technical assessment and is not licensed for public use.

---

_This project was developed as part of a frontend developer technical assessment, focusing on demonstrating advanced React skills, animation implementations, and component architecture._
