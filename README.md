# Mzimba South EduData Hub

This project is a static web app that now supports optional Supabase backend storage in addition to local browser storage.

## What was added
- Supabase client is included in `index.html`.
- `config.js` now has `supabaseUrl` and `supabaseAnonKey` placeholders.
- `data.js` now initializes from Supabase when config values are present.
- LocalStorage is still used as a fallback if Supabase is not configured.
- Added `supabase_tables.sql` with exact table definitions.

## Supabase deployment steps

### 1. Create a Supabase project
1. Go to `https://app.supabase.com/`
2. Sign in or register
3. Click `New project`
4. Set a project name, password, and region
5. Create the project

### 2. Get your Supabase keys
1. Open the project dashboard
2. Go to `Settings` → `API`
3. Copy the `URL` and the `anon` public key

### 3. Create the required tables
1. In the Supabase dashboard, go to `SQL Editor`
2. Create a new query
3. Paste the contents of `supabase_tables.sql`
4. Run the query

### 4. Configure the app
1. Open `config.js`
2. Set:
```js
supabaseUrl: 'https://<your-project-ref>.supabase.co',
supabaseAnonKey: '<your-anon-key>'
```
3. Save the file

### 5. Run the app locally
1. Open `index.html` in a browser
2. Admin uploads will now be written to Supabase if config values are set
3. Other devices/browsers can use the same config to share the same data

## Table definitions
The SQL file `supabase_tables.sql` contains the exact table definitions for your current app.

## Notes
- If you leave `supabaseUrl` and `supabaseAnonKey` blank, the app continues to work using localStorage.
- To use Supabase from different browsers/devices, each copy of the app must have the same Supabase config values.
- For public deployment, consider adding Supabase Row Level Security policies and auth later.
