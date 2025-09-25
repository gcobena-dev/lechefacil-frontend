# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/75865edf-433d-4ea2-8aa5-627ff20349cd

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/75865edf-433d-4ea2-8aa5-627ff20349cd) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Configure environment variables
# Create a .env file from .env.example and set VITE_API_URL to your backend (e.g. http://localhost:8000)
cp .env.example .env

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/75865edf-433d-4ea2-8aa5-627ff20349cd) and click on Share -> Publish.

## Backend integration notes

- Auth: Login calls `/api/v1/auth/login` and stores a JWT. Then select a tenant from `/api/v1/auth/my-tenants`. The selected tenant ID is sent on protected requests via `X-Tenant-ID` (configurable with `VITE_TENANT_HEADER`).
- Animals: Animals page lists from `/api/v1/animals`.
- Milk Prices: Lists from `/api/v1/milk-prices` and buyers from `/api/v1/buyers`.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
