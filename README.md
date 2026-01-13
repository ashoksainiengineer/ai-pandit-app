# Vedic Birth Time Rectification (BTR) Application

A beautiful, full-featured web application for accurate birth time rectification using authentic Vedic astrology methods.

## 🌟 Features

### User Data Collection
- **Birth Details**: Full name, DOB, tentative time, uncertainty level, place, coordinates
- **Physical Description**: Body structure, height, face shape, complexion
- **Life Events**: Comprehensive event categories with dates and importance levels

### Event Categories Supported
- 📚 **Education**: School, college, degrees, certifications
- 💼 **Career**: Jobs, promotions, business, transfers
- 💍 **Marriage**: Marriage, engagement, divorce
- 👶 **Children**: Births, miscarriages
- 👨‍👩‍👧 **Family**: Parent/sibling deaths, family events
- 🏥 **Health**: Illnesses, surgeries, accidents
- 💰 **Financial**: Property, investments, inheritance
- ✈️ **Travel**: Foreign trips, relocations
- 🕉️ **Spiritual**: Initiation, guru meetings

### Rectification Methods (Based on K.N. Rao's Approach)
1. Event-Based Method
2. Divisional Chart Analysis (D-1, D-9, D-10, D-7, D-24, D-12, D-30)
3. Vimshottari Dasha Correlation
4. Physical Characteristics Verification

### Beautiful Results Display
- **Rectified Time**: With confidence score (1-10)
- **Event-by-Event Analysis**: Match quality for each life event
- **Rectified Chart**: Complete planetary positions
- **Dasha Timeline**: Mahadasha sequence with current period
- **Physical Verification**: Lagna-based trait matching
- **Recommendations**: For further verification

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom Vedic theme
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Calculations**: Custom Swiss Ephemeris-based algorithms

## 📁 Project Structure

```
vedic-btr-app/
├── app/
│   ├── api/
│   │   └── calculate/
│   │       └── route.ts          # BTR calculation API
│   ├── globals.css               # Global styles & Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main landing page with form
├── components/
│   └── ResultsDisplay.tsx        # Beautiful results component
├── lib/
│   ├── ephemeris.ts              # Astrological calculations
│   └── btr-engine.ts             # Rectification analysis engine
├── types/
│   └── index.ts                  # TypeScript type definitions
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository or extract the zip file

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🎨 Design Features

- **Dark Vedic Theme**: Navy blue with saffron/orange accents
- **Glassmorphism**: Frosted glass card effects
- **Animated Background**: Floating orbs and twinkling stars
- **Smooth Transitions**: Framer Motion animations
- **Responsive Design**: Works on all screen sizes
- **Custom Scrollbar**: Styled to match theme

## 📊 How It Works

### Step 1: Birth Details
User enters basic birth information including tentative time and place.

### Step 2: Physical Description
Physical characteristics help verify the ascendant sign.

### Step 3: Life Events
User adds significant life events with exact dates. The more events, the better the accuracy.

### Step 4: Analysis
The system:
1. Calculates planetary positions for tentative time
2. Tests multiple time adjustments within uncertainty range
3. Correlates each life event with Dasha periods
4. Checks divisional chart placements
5. Verifies physical features against Lagna characteristics
6. Selects the time with highest event correlation score

### Output
- Rectified birth time
- Confidence score
- Detailed event-by-event analysis
- Complete chart with planetary positions
- Vimshottari Dasha sequence
- Physical verification results
- Recommendations for further steps

## 🔮 Astrological Methods Used

### Event-House Mappings
Based on classical Vedic astrology principles:
- Marriage → 7th house, Venus, D-9 chart
- Career → 10th house, Saturn/Mercury, D-10 chart
- Children → 5th house, Jupiter, D-7 chart
- Education → 4th/5th/9th houses, Jupiter/Mercury, D-24 chart
- And many more...

### Physical Characteristics by Lagna
Each ascendant sign has associated physical traits that can be matched.

## ⚠️ Disclaimer

This application provides astrological analysis for educational and entertainment purposes. Results should be verified with a qualified Vedic astrologer for important decisions.

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

Made with ❤️ for accurate Vedic birth time rectification
