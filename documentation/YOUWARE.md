# YOUWARE - Report Management System

## 🏗️ Architecture Overview

This is a comprehensive report management system built with vanilla HTML, CSS, and JavaScript, featuring dual backend support for data persistence and file storage.

### Core System Design

- **Frontend**: Vanilla JavaScript with modular architecture
- **Backend**: Dual integration support (Backendless + Supabase)
- **Data Flow**: Local storage with cloud synchronization
- **File Storage**: Cloud file storage with preview capabilities
- **Authentication**: Multi-provider authentication support

## 📁 Key File Structure

```
src/
├── assets/js/
│   ├── data.js                    # Local data store and mock data
│   ├── script.js                  # Main application logic and UI
│   ├── backendless/               # Legacy Backendless integration
│   │   ├── config.js              # Backendless configuration
│   │   ├── auth.js                # Backendless authentication
│   │   └── [integration files]    # Backendless sync modules
│   └── supabase/                  # Current Supabase integration
│       ├── config.js              # Supabase configuration
│       ├── auth.js                # Supabase authentication service
│       ├── data.js                # Supabase data operations
│       ├── files.js               # Supabase file storage operations
│       ├── departments-users-integration.js    # Dept/Users sync
│       ├── reports-storage-integration.js      # Reports/Files sync
│       └── full-integration-manager.js         # Master integration
├── reports.html                   # Main reports page with preview
├── settings.html                  # System configuration
├── users.html                     # User management
├── test-supabase-integration.html # Supabase integration testing
├── test-configuration-check.html  # Configuration verification
└── [other pages...]
```

## 🔧 Development Commands

This is a client-side application with no build process. Development is done directly by:

1. **Local Development**: Open HTML files directly in browser or use live server
2. **Testing**: Use the built-in test pages (`test-*.html`)
3. **Backendless Setup**: Configure API keys in `assets/js/backendless/config.js`

### Test Pages Available:
**Supabase Integration (Current)**:
- `test-supabase-integration.html` - Complete Supabase integration testing
- `test-configuration-check.html` - Configuration verification and troubleshooting

**Legacy Backendless Integration**:
- `test-full-integration.html` - Complete Backendless integration testing
- `test-departments-users-integration.html` - Department/User sync testing
- `test-settings-crud.html` - Settings CRUD operations testing

## 🧩 Core Architecture Components

### Three-Layer Data Reading Architecture

**Layer 1: Supabase Data Service** (`assets/js/supabase/data.js`)
- Generic CRUD operations with filtering and options support
- Standardized error handling with fallback patterns
- Specialized methods for common collections (getDepartments, getUsers, etc.)
- Connection testing and initialization management

```javascript
// Generic data retrieval with options
await supabaseData.get('users', {
  filter: { department: 'Engineering' },
  order: { column: 'name', ascending: true },
  limit: 50
});
```

**Layer 2: Integration Manager** (`assets/js/supabase/integration-manager.js`)
- Parallel data fetching using `Promise.all()` for performance
- Bidirectional sync between Supabase and localStorage
- Automatic UI refresh triggers after data changes
- CRUD operations with automatic local storage sync

```javascript
// Parallel sync from Supabase
const [departments, users, reports] = await Promise.all([
  supabaseData.getDepartments(),
  supabaseData.getUsers(), 
  supabaseData.getReports()
]);
```

**Layer 3: Local Storage with Cloud Sync**
- **Primary**: Local storage (`localStorage`) for immediate UI responsiveness
- **Secondary**: Supabase PostgreSQL for persistence and multi-user sync
- **Integration**: Parallel fetching with automatic fallback to local data
- **Conflict Resolution**: Latest timestamp wins with graceful error handling

**Key Data Collections:**
- `departments` - Organizational units
- `users` - System users with role-based permissions
- `reportTypes` - Report templates/categories
- `reports` - Individual report instances with file attachments
- `frequencies` - Reporting schedules (Daily, Weekly, Monthly, etc.)
- `formats` - Supported file formats (PDF, Excel, Word, Image, Video)

### Data Synchronization Patterns

**Parallel Data Fetching:**
```javascript
// High-performance parallel sync
async syncFromSupabase() {
  const [departments, users, reports, reportTypes, frequencies, formats] = 
    await Promise.all([
      this.supabaseData.getDepartments(),
      this.supabaseData.getUsers(),
      this.supabaseData.getReports(),
      this.supabaseData.getReportTypes(),
      this.supabaseData.getFrequencies(),
      this.supabaseData.getFormats()
    ]);
  
  localStorage.setItem('reportrepo_db', JSON.stringify({
    departments, users, reports, reportTypes, frequencies, formats
  }));
}
```

**Automatic CRUD with Sync:**
- Create operations: Supabase → Local Storage → UI Refresh
- Update operations: Supabase → Local Storage → UI Refresh  
- Delete operations: Supabase → Local Storage → UI Refresh
- Read operations: Supabase with localStorage fallback

### Preview System Architecture

**"Latest File First" Logic:**
- All previewers default to showing the most recent file
- File sorting by upload date (newest first)
- Click-to-select functionality for both reports and files
- Unified preview interface across main page and modals

### Permission System

**Role-Based Access Control:**
- Department-scoped permissions
- Action-specific permissions (view, add, edit, delete)
- Permission inheritance and override mechanisms
- User-specific department assignments

## 🎯 Key Design Patterns

### State Management
- Global state variables for current selections
- Event-driven UI updates
- Centralized data access through `DB` object

### Modal Management
- Consistent modal patterns across the application
- Form validation and submission handling
- Dynamic content population

### File Handling
- Multi-format support (PDF, Office docs, images, videos)
- Preview generation for different file types
- Cloud file storage integration (Supabase Storage) with fallback mechanisms
- Signed URL generation for secure file access

## 🔄 Enhanced Data Synchronization Flow

### Three-Layer Read Architecture:
1. **Supabase First** → Parallel fetch using `Promise.all()`
2. **Local Storage Sync** → Update localStorage with fresh data
3. **UI Refresh** → Automatic table/component updates
4. **Fallback Strategy** → Local storage when Supabase unavailable

### CRUD with Automatic Sync:
1. **User Action** → Supabase operation (create/update/delete)
2. **Local Storage Update** → Immediate localStorage sync
3. **UI Refresh** → Automatic component refresh via events
4. **Error Handling** → Graceful fallback with user notification

### Performance Optimizations:
- **Parallel Fetching**: All collections loaded simultaneously
- **Conditional Initialization**: Services initialize only when needed
- **Event-Driven Updates**: UI components listen for data change events
- **Smart Caching**: Local storage provides instant fallback data

## 🧪 Testing Strategy

- **Configuration Tests**: Verify backend configuration and connectivity (`test-configuration-check.html`)
- **Integration Tests**: Verify cloud backend connectivity and data sync (`test-supabase-integration.html`)
- **CRUD Tests**: Validate create, read, update, delete operations
- **Permission Tests**: Ensure role-based access control works
- **File Upload Tests**: Test file storage and preview functionality
- **Sync Tests**: Validate bidirectional data synchronization between local storage and cloud

## 📝 Development Notes

### Adding New Features
1. Update local data structure in `data.js`
2. Add Supabase integration in appropriate service (`assets/js/supabase/`)
3. Update UI components and event handlers
4. Add to integration manager if needed
5. Create test cases in `test-supabase-integration.html`
6. Update table schema in Supabase if required

### Common Integration Points
- Form submission handlers in `script.js`
- Table rendering functions
- Modal setup and teardown
- File upload/preview workflows
- Integration manager initialization in HTML pages
- Authentication state management

### Backend Integration Guidelines
- **Primary**: Use Supabase integration with three-layer architecture
- **Data Service**: Always use `supabaseData.get()` for consistent querying
- **Integration Manager**: Use `supabaseIntegrationManager` for CRUD operations
- **Testing**: Always test configuration and connectivity before development
- **Error Handling**: Implement graceful fallbacks to local storage
- **File Storage**: Use Supabase Storage with signed URLs for security
- **Performance**: Leverage parallel fetching for multi-table operations

### Three-Layer Integration Points
- **Service Layer**: `assets/js/supabase/data.js` - Generic CRUD operations
- **Manager Layer**: `assets/js/supabase/integration-manager.js` - Sync coordination
- **UI Layer**: Event-driven updates with automatic refresh triggers

### Preview System Extension
- All new previewers should implement "latest file first"
- Use `getLatestFile()` utility function
- Follow click-to-select pattern for consistency

### Configuration Management
- **Supabase Config**: `assets/js/supabase/config.js` contains project URL and keys
- **Environment**: Configuration automatically detects local vs production environments
- **Testing**: Use `test-configuration-check.html` to verify setup