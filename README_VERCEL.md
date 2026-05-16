# Deploying to Vercel

This project is ready to be deployed to Vercel.

## Steps:

1. **Upload to GitHub/GitLab/Bitbucket**: Push your code to a repository.
2. **Import to Vercel**: Connect your repository to Vercel.
3. **Environment Variables**: In the Vercel dashboard, go to **Settings > Environment Variables** and add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
4. **Build Settings**: Vercel should automatically detect Vite. If not, use:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

## Note on Firebase:
The Firebase configuration is already included in `firebase-applet-config.json`. Make sure your Firebase project allows requests from your Vercel URL in the **Firebase Console > Authentication > Settings > Authorized domains**.
