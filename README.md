# Furniture Construction OCR Mobile App

A comprehensive mobile-first web application designed for furniture construction companies to capture, process, and organize construction documents using OCR technology.

## Features

### 🔐 Authentication
- Firebase Authentication with email/password
- Secure user registration and login
- Protected routes and user session management

### 📸 Image Capture & Upload
- Mobile-first camera interface with device camera access
- Alternative image upload functionality
- Optimized image handling for construction documents
- Firebase Storage integration for secure image storage

### 🔍 OCR Processing
- Google Cloud Vision API integration for text extraction
- Intelligent categorization of extracted content:
  - Materials identification
  - Measurements parsing
  - Installation instructions extraction
- Real-time processing with loading states

### 📊 Data Management
- Firebase Firestore for NoSQL data storage
- Real-time data synchronization
- Project organization and management
- Editable extracted content with manual corrections

### 📄 Export Capabilities
- PDF generation with formatted project data
- Excel (.xlsx) export for data analysis
- Downloadable files with professional formatting
- Firebase Cloud Functions for server-side processing

### 📱 Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface elements
- Progressive Web App capabilities
- Offline-ready architecture

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling
- **React Router** for navigation
- **Lucide React** for consistent iconography

### Backend & Services
- **Firebase Authentication** for user management
- **Firebase Firestore** for document storage
- **Firebase Storage** for image storage
- **Firebase Cloud Functions** for serverless processing
- **Google Cloud Vision API** for OCR processing

### Additional Libraries
- **jsPDF** for PDF generation
- **XLSX** for Excel file creation
- **React Hot Toast** for notifications

## Project Structure

```
functions/
├── src/
│   ├── index.ts/        # Fucntion of processOCR to process the image
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── camera/         # Camera capture components
│   ├── ocr/           # OCR result components
│   ├── projects/      # Project management components
│   └── ui/            # Base UI components
├── hooks/             # Custom React hooks
│   ├── useAuth.ts     # Authentication logic
│   ├── useCamera.ts   # Camera functionality
│   ├── useOCR.ts      # OCR processing
│   ├── useFirestore.ts # Database operations
│   └── useExport.ts   # Export functionality
├── pages/             # Application pages/screens
├── contexts/          # React context providers
├── config/            # Configuration files
└── utils/             # Utility functions
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase project with the following services enabled:
  - Authentication (Email/Password)
  - Firestore Database
  - Storage
  - Cloud Functions
- Google Cloud Platform project with Vision API enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd furniture-construction-ocr-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication, Firestore, Storage, and Functions
   - Copy your Firebase configuration to `src/config/firebase.ts`

4. Configure Google Cloud Vision API:
   - Enable the Vision API in your Google Cloud Console
   - Set up authentication for your Firebase Cloud Functions

5. Start the development server:
```bash
npm run dev
```

### Firebase Configuration

Update `src/config/firebase.ts` with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Cloud Functions Setup

The application requires Firebase Cloud Functions for:
- OCR processing with Google Cloud Vision API
- PDF generation
- Excel file creation

Deploy the Cloud Functions:

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
firebase deploy --only functions
```

## Usage

1. **Register/Login**: Create an account or sign in with existing credentials
2. **Capture Images**: Use the camera interface to capture construction documents
3. **Review OCR Results**: View and edit the extracted text and categorized content
4. **Save Projects**: Store organized project data in Firestore
5. **Export Data**: Generate PDF reports or Excel files for sharing

## Design Principles

### Mobile-First Approach
- Touch-optimized interface elements
- Responsive breakpoints for all screen sizes
- Camera-first user experience
- Gesture-friendly navigation

### Professional Aesthetics
- Construction industry-appropriate color scheme
- Clean, minimal interface design
- Consistent typography and spacing
- Subtle animations and transitions

### Accessibility
- High contrast ratios for readability
- Keyboard navigation support
- Screen reader compatibility
- Clear visual hierarchy

## Performance Optimization

- Lazy loading of components
- Image optimization and compression
- Efficient state management
- Minimal bundle size with tree shaking
- Progressive loading states

## Security Features

- Firebase Authentication integration
- Secure file upload to Firebase Storage
- User data isolation with Firestore security rules
- Protected API endpoints with authentication checks
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
