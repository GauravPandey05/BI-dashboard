# Travel Survey Dashboard

An interactive, customizable dashboard for analyzing travel survey data. This project enables users to upload, filter, visualize, and export insights from travel survey responses. It is designed for researchers, analysts, and organizations studying travel patterns, preferences, and behaviors.

## Features

- 📊 **Dynamic Data Visualization**: Visualize responses to travel-related survey questions using interactive charts.
- 📝 **Survey Question Selector**: Choose which survey questions to display and analyze.
- 🔎 **Advanced Filtering**: Filter survey responses by various criteria to focus on specific segments.
- 📈 **Summary Statistics**: View key travel insights such as most common travel plans, popular trip types, and booking behaviors.
- 💬 **Integrated Chatbot**: Ask questions about your data and get instant answers.
- ⬆️ **Data Upload**: Import new survey datasets for instant dashboard updates.
- 📤 **Export Options**: Export charts and insights to PowerPoint for easy sharing and reporting.
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices.
- 🔒 **User Authentication** (optional): Secure access and user-based data control.

## Technologies Used

- **TypeScript** (main language)
- **React** for UI components
- **Charting library** (e.g., Chart.js, Recharts)
- **CSS/SCSS** or TailwindCSS for styling
- **Node.js** (optional for backend/data API)
- **Lucide-React** for icons

## Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/GauravPandey05/BI-dashboard.git
cd BI-dashboard
npm install  # or yarn install
```

### Running the App

```bash
npm run dev  # or yarn dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build  # or yarn build
```

## Project Structure

```
src/
  components/         # Reusable UI components (Dashboard, Charts, Filters, etc.)
  contexts/           # React context providers (e.g., DataContext)
  pages/              # Page components or routes
  services/           # Data fetching and API utilities
  types/              # TypeScript type definitions (SurveyData, Response, etc.)
  utils/              # Helper functions
```

## Example Use Cases

- **Tourism Boards**: Analyze national or regional travel surveys.
- **Market Research**: Study traveler behavior and preferences.
- **Academia**: Research travel trends for publications.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for bug fixes, features, or improvements.

## License

MIT License

## Contact

For questions or support, open an issue or contact [GauravPandey05](https://github.com/GauravPandey05).
