# **App Name**: Relox

## Core Features:

- User Authentication (Google OAuth): Securely log in and out using Google OAuth, managing user sessions through Appwrite's authentication service. New users will be prompted for onboarding if no profile exists.
- User Profile Onboarding: Upon first successful login, present a full-screen onboarding modal to collect and store a unique username and bio in the Appwrite database.
- Dynamic Video Feed Display: An infinite scrollable feed to browse and view short-form videos from other users, providing a seamless viewing experience in a mobile-first layout.
- Video Upload & Publishing: Enable users to upload their own video content, add basic details (like captions or tags), and publish it to be visible in the app's video feeds.
- Persistent Bottom Navigation: Implement a fixed bottom navigation bar with interactive icons (Home, Discover, Upload, Inbox, Profile) for intuitive access to core app sections. Login prompts will appear for protected routes.
- AI-Powered Content Recommendation Tool: A generative AI tool that suggests relevant videos to users by analyzing their viewing habits and interaction history, enhancing content discovery.
- User Profile Viewing & Editing: Allows users to view their own profile and profiles of others, displaying usernames, bios, and potentially uploaded videos. Users can also edit their personal username and bio.

## Style Guidelines:

- The app will utilize a vibrant and energetic color palette against a pure black background. The primary action color is a luminous magenta (#DE2BEE) designed to stand out boldly, evoking a sense of creativity and excitement. The background is pure black (#000000) for a striking contrast and to emphasize the video content. A supportive accent color, a rich violet-blue (#6522C3), provides depth and complements the primary hue for interactive elements and subtle highlights.
- The 'Space Grotesk' font (sans-serif) will be used throughout the application for both headlines and body text. Its contemporary, slightly technical aesthetic aligns with the dynamic and forward-looking nature of short-form video content, ensuring readability in a mobile-first context while maintaining a cohesive modern look.
- Lucide-React icons will be incorporated for all functional elements, maintaining a consistent, modern, and vector-based visual style that complements the dark and neon-infused aesthetic.
- A strict mobile-first layout is central to the design, encapsulated within a maximum width of 430 pixels, horizontally centered. The full screen height (100dvh) will be utilized for an immersive experience, with an intentionally hidden scrollbar to prioritize content visibility. Essential UI components, such as the bottom navigation, are persistently displayed for ease of access.
- Subtle and fluid animations will be integrated for transitions between content (like video changes), interactions with the bottom navigation, and modal displays. These animations will be fast and responsive, designed to enhance the 'swipe' culture feel without being distracting, adding to a slick user experience.