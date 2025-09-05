# Report Repository System

A comprehensive report management system with role-based access control, built with HTML, CSS, JavaScript, and Supabase.

## Features

- 📊 **Dashboard**: Overview of reports and KPIs
- 📋 **Reports Management**: Upload, view, and manage reports
- 📈 **KPI Data Entry**: Enter and track key performance indicators
- 🎯 **Scorecard Designer**: Create and manage scorecards
- 📅 **Calendar**: View scheduled reports and deadlines
- 👥 **User Management**: Role-based access control
- ⚙️ **Settings**: System configuration

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Netlify
- **Version Control**: GitHub

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd report-repository-system
```

2. Start a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

3. Open your browser and navigate to `http://localhost:8000`

### Production Deployment

This application is configured for deployment on Netlify with automatic deployments from GitHub.

## Environment Variables

The application uses the following Supabase configuration (already configured):

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key

## File Structure

```
├── index.html                 # Main dashboard
├── reports.html              # Reports management
├── kpi-data-entry.html       # KPI data entry
├── scorecard-designer.html   # Scorecard designer
├── calendar.html             # Calendar view
├── users.html                # User management
├── settings.html             # Settings
├── assets/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── data.js           # Data management
│   │   ├── access-control.js # Role-based access control
│   │   ├── navigation-template.js # Navigation system
│   │   └── supabase/         # Supabase integration
│   └── images/               # Static images
├── netlify.toml              # Netlify configuration
└── README.md                 # This file
```

## Access Control

The system implements role-based access control:

- **Users**: Can access reports, KPI data entry, dashboard, system reports, and calendar
- **Managers**: All user permissions plus scorecard designer
- **Admins**: Full access to all features including user management and settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software.

## Support

For support and questions, please contact the development team. 