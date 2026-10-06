# Willing administrator dashboard

## Local setup

Copy `.env.example` to `.env.local`, run `npm install`, and start with `npm start`.
`REACT_APP_API_BASE_URL` defaults in the example to the HTTPS staging API. Set it
explicitly for each hosted environment before building. The verified production
API is `https://prod.willingapp.com`; the local `.env.local` now uses that URL.
Restart `npm start` after changing it. Create React App embeds
this URL at build time; changing a hosting variable requires a new build.

The frontend hosting provider has not been established. For a static host, publish
`build/` and configure SPA fallback to `index.html` for paths such as `/settings`.
This change does not deploy the frontend or configure a hosting service.

## Administrator accounts

Sign in with the backend administrator username and password. Settings supports
server-backed search, pagination, status filters, administrator creation, and
activation/deactivation. Administrators cannot deactivate their own account from
the UI. Backend permission failures are displayed without assuming owner IDs or
inventing a Super Admin role.

The backend account shape is `{ id, name, username, isActive }`. Creation accepts
`{ name, username, password }`, with a maximum of 50 characters per field. A phone
number can be entered as a username, but backend acceptance is unverified. The
administrator login is password-based; SMS login is not implemented.

Sessions use session storage unless Remember me is selected, which uses local
storage. Access and refresh tokens are stored in the selected storage; passwords
are never persisted. Production access tokens expire after five minutes. The
dashboard renews them 30 seconds before expiry and retries an authentication
failure once after renewal. Remembered sessions can renew on reopening the browser,
including after the access token expires. Legacy mock sessions and browser-only
administrator records are discarded. Sessions saved before refresh support need
one fresh sign-in to obtain a refresh token. Temporary network failures preserve
the saved session; a rejected refresh or disabled/locked account ends it.
Logout clears this device immediately and attempts backend logout.
Browser storage is specific to the hostname and port, so localhost:3000 and
localhost:3005 have separate sessions.

Phone-based Willing app users are separate from dashboard administrator accounts.
Administrator profile/password editing is not implemented because Swagger does
not document administrator edit/reset endpoints. My Account displays session
identity and available administrator details.

## Backend verification and release blockers

Production login with the supplied administrator credentials was verified on
October 5, 2026. Authenticated administrator listing, `/Admin/User` listing,
and metadata reads succeeded. Production rejected anonymous administrator/user
listing with HTTP 401, and rejected the administrator token on the regular `/User`
route with HTTP 403. The dashboard Users list therefore uses `/Admin/User`.
No production accounts were created, edited, or deactivated during verification.
On October 6, 2026, `/Identity/Login/Refresh` successfully renewed the supplied
administrator's token, preserved its Admin role, and allowed administrator listing.

- Supply separate staging administrator credentials. The screenshot credentials
  work on production but were rejected by the staging API.
- Enforce authentication: staging administrator/app-user lists returned real data
  without bearer authorization, and the administrator list accepted an invalid
  bearer token. Frontend login checks cannot secure an anonymously accessible API.
- Confirm existing owner/permission rules. Swagger returns no role/capability
  information, although metadata code 1023 references owner/higher-permission
  protection. If Super Admin exists, provide its authoritative identity/capability
  contract and enforce staff-management restrictions server-side.
- Confirm administrator logout behavior and whether deactivation
  invalidates existing sessions.
- Supply administrator edit/password-reset routes if those features are required.

Before release, use disposable staging accounts to verify creation, duplicate
usernames, activation/deactivation, inactive-account login, owner protections,
and unauthenticated/forbidden requests. No live accounts are created by unit tests.

## Checks

- `npx tsc --noEmit`
- `CI=true npm test -- --watchAll=false --runInBand --watchman=false`
- `npm run build`

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
