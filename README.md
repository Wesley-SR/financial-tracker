# Financial Tracker

A personal, privacy-first financial dashboard built as a responsive Progressive Web App (PWA).

## V1

- Net-worth dashboard and R$ 1,000,000 progress
- Monthly income, fixed expenses and free-margin tracking
- Extra income/expense entries for unplanned spending
- Apartment equity and mortgage balance
- Financial assets, vehicle, other assets and debts
- Emergency-fund target
- Million-goal scenario simulator
- Local JSON backup and restore
- Responsive mobile layout
- Installable PWA with lightweight offline cache

## Privacy

Financial values are **not stored in this public repository**.

The app stores entered data in the browser using `localStorage`. Use **Backup** regularly if you want a portable copy of your history.

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## GitHub Pages

The repository includes a GitHub Actions workflow that builds pull requests and deploys `main` to GitHub Pages.

After the first merge, enable **Settings → Pages → Source: GitHub Actions** if Pages is not already enabled.

## Branching

Development happens in feature branches. `main` should remain the stable version so changes can be reviewed and rolled back cleanly.
