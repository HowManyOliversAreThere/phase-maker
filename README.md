# Phase Maker - Random Phase 10 Generator

A modern web application that generates random Phase 10 card game sets for endless replayability. Built with React, TypeScript, ShadCN/UI and Tailwind CSS.

🌐 **Live App**: [https://phasemaker.oliverrobson.tech/](https://phasemaker.oliverrobson.tech/)

## Features

- **Random Phase Generation**: Creates 10 unique phases with progressive difficulty
- **Shareable URLs**: Each generated set has a unique URL that can be shared
- **Responsive Design**: Optimized for both desktop and mobile devices

## Color Scheme

The app uses the official Phase 10 color palette:
- **Base Background**: `#0443A7` (Deep Blue)
- **Accent Colors**: 
  - Red: `#FB041E`
  - Blue: `#0275C5`
  - Green: `#009224`
  - Yellow: `#FCD700`

## Phase Types

The generator creates phases using these Phase 10 elements:

- **Sets**: Multiple cards of the same number (any color)
- **Runs**: Cards in consecutive numerical order (any color)
- **Colors**: Cards of the same color (any numbers)
- **Even/Odd**: Cards that are all even (2,4,6,8,10,12) or all odd (1,3,5,7,9,11)
- **Color Runs**: Cards in consecutive order of the same color
- **Color Even/Odd**: Even or odd cards of the same color

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd phase-maker
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## How to Use

1. **Generate New Set**: Click "Generate New Set" to create 10 random phases
2. **Share Set**: Click "Share Set" to copy the unique URL to your clipboard
3. **View Shared Set**: Visit a shared URL to see the same phase set on any device
4. **Play the Game**: Use the generated phases in your Phase 10 game!

## Phase 10 Rules Quick Reference

- Complete phases in order from 1 to 10
- Wild cards can substitute for any card in any phase
- You must complete your current phase before advancing
- Failed phases must be attempted again next round
- First player to complete all 10 phases wins!

## URL Structure

Shared phase sets use this URL format:
```
https://phasemaker.oliverrobson.tech/?set=<unique-id>
```

The unique ID is deterministic, meaning the same ID will always generate the same phase set.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Phase 10** is a registered trademark of Mattel, Inc.
- This is an unofficial fan-made tool for generating custom phase sets
