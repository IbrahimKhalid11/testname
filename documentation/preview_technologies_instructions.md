# Report Preview Technologies - Implementation Instructions for Youware.com

## Overview
This document provides complete instructions to replicate the comprehensive file preview system from the reports main page. The system supports multiple file formats with different preview technologies and includes both inline preview panes and detailed modal previews.

## Core Preview Technologies Used

### 1. PDF Preview Technology
- **Service**: Google Docs Viewer
- **Implementation**: 
```javascript
// For PDF files
const iframe = document.createElement('iframe');
iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(fileURL)}&embedded=true`;
iframe.style.width = '100%';
iframe.style.height = '600px';
iframe.style.border = '1px solid #ddd';
iframe.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
```

### 2. Excel/Spreadsheet Preview Technology
- **Service**: Microsoft Office Apps Live Viewer
- **Implementation**:
```javascript
// For Excel files (.xlsx, .xls)
const iframe = document.createElement('iframe');
iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileURL)}`;
iframe.style.width = '100%';
iframe.style.height = '600px';
iframe.style.border = '1px solid #ddd';
iframe.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
```

### 3. Image Preview Technology
- **Implementation**: Direct image display with enhanced styling
```javascript
// For images (.jpg, .jpeg, .png, .gif)
previewImage.src = fileURL;
previewImage.style.display = 'block';
previewImage.style.maxWidth = '100%';
previewImage.style.maxHeight = '600px';
previewImage.style.margin = '0 auto';
previewImage.style.border = '1px solid #ddd';
previewImage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
previewImage.style.cursor = 'pointer';
previewImage.onclick = function() {
    window.open(fileURL, '_blank');
};
```

### 4. Video Preview Technology
- **Implementation**: HTML5 video element with controls
```javascript
// For videos (.mp4, .webm, .ogg, .mov, .avi)
const video = document.createElement('video');
video.controls = true;
video.autoplay = false;
video.style.width = '100%';
video.style.maxHeight = '600px';
video.style.border = '1px solid #ccc';
video.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
video.src = fileURL;
```

### 5. Generic File Preview Technology
- **Implementation**: SVG-based file information display
```javascript
// For other file types
const fileExtension = fileName.split('.').pop().toUpperCase();
previewImage.src = `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='15%25' text-anchor='middle' font-family='Arial' font-weight='bold' font-size='24' fill='%23333'%3E${encodeURIComponent(fileName)}%3C/text%3E%3Ctext x='50%25' y='350' text-anchor='middle' font-family='Arial' font-weight='bold' font-size='36' fill='%23333'%3E${encodeURIComponent(fileExtension)} FILE%3C/text%3E%3Ctext x='50%25' y='400' text-anchor='middle' font-size='20' fill='%23333'%3EClick to download%3C/text%3E%3C/svg%3E`;
```

## HTML Structure Required

### 1. Main Preview Pane (Above Reports Table)
```html
<!-- Preview Pane for Reports -->
<div class="report-preview-pane" style="margin-bottom: 20px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <div class="preview-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 id="preview-title">Report Preview</h3>
        <div>
            <span id="preview-info" style="font-size: 0.9rem; color: #666;"></span>
        </div>
    </div>
    <div class="preview-content" style="display: flex; flex-direction: column; align-items: center;">
        <div id="preview-container" style="width: 100%; min-height: 300px; display: flex; justify-content: center; align-items: center;">
            <p id="no-preview-message" style="color: #999; font-style: italic;">Select a report to preview</p>
            <img id="preview-image" src="" alt="Report Preview" style="max-width: 100%; max-height: 400px; display: none;">
        </div>
        <div class="preview-controls" style="display: flex; justify-content: center; align-items: center; margin-top: 15px;">
            <button id="prev-report-btn" class="action-button secondary" style="margin-right: 10px;" disabled>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span id="preview-counter" style="margin: 0 15px;">0 of 0</span>
            <button id="next-report-btn" class="action-button secondary" style="margin-left: 10px;" disabled>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        </div>
        <div class="preview-actions" style="margin-top: 15px;">
            <button id="preview-download-btn" class="action-button primary" style="margin-right: 10px;" disabled>
                <i class="fas fa-download"></i> Download
            </button>
            <button id="preview-details-btn" class="action-button secondary" disabled>
                <i class="fas fa-info-circle"></i> View Details
            </button>
        </div>
    </div>
</div>
```

### 2. Report Details Modal with Preview
```html
<!-- Report Details Modal -->
<div id="report-details-modal" class="modal">
    <div class="modal-content modal-lg">
        <div class="modal-header">
            <h3 id="report-details-title">Report Details</h3>
            <span class="modal-close">&times;</span>
        </div>
        <div class="modal-body">
            <!-- Report info sections here -->
            
            <!-- Report Preview Section -->
            <div class="report-preview">
                <img id="report-preview-image" src="" alt="Report Preview">
                <div class="preview-controls">
                    <button class="preview-control-btn" id="prev-version-btn"><i class="fas fa-chevron-left"></i></button>
                    <span class="preview-counter" id="version-counter">1 of 5</span>
                    <button class="preview-control-btn" id="next-version-btn"><i class="fas fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    </div>
</div>
```

## Core JavaScript Functions to Implement

### 1. File Type Detection Function
```javascript
function getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['pdf'].includes(extension)) return 'pdf';
    if (['xlsx', 'xls'].includes(extension)) return 'excel';
    if (['docx', 'doc'].includes(extension)) return 'word';
    if (['pptx', 'ppt'].includes(extension)) return 'powerpoint';
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension)) return 'video';
    
    return 'generic';
}
```

### 2. Main Preview Update Function
```javascript
function updatePreview() {
    const previewImage = document.getElementById('preview-image');
    const previewContainer = document.getElementById('preview-container');
    const noPreviewMessage = document.getElementById('no-preview-message');
    
    if (!previewImage || !previewContainer) return;
    
    if (reportFiles.length === 0) {
        previewImage.style.display = 'none';
        noPreviewMessage.style.display = 'block';
        return;
    }
    
    const file = reportFiles[currentPreviewIndex];
    const fileType = getFileType(file.name);
    
    // Clear existing content
    removeExistingPreviewElements(previewContainer);
    
    // Show appropriate preview based on file type
    switch(fileType) {
        case 'image':
            showImagePreview(file, previewImage);
            break;
        case 'pdf':
            showPDFPreview(file, previewContainer);
            break;
        case 'excel':
            showExcelPreview(file, previewContainer);
            break;
        case 'video':
            showVideoPreview(file, previewContainer);
            break;
        default:
            showGenericPreview(file, previewImage);
    }
    
    noPreviewMessage.style.display = 'none';
}
```

### 3. Preview Technology Functions
```javascript
function showPDFPreview(file, container) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileURL)}&embedded=true`;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    container.appendChild(iframe);
}

function showExcelPreview(file, container) {
    const iframe = document.createElement('iframe');
    iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.fileURL)}`;
    iframe.style.width = '100%';
    iframe.style.height = '600px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    container.appendChild(iframe);
}

function showVideoPreview(file, container) {
    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = false;
    video.style.width = '100%';
    video.style.maxHeight = '600px';
    video.style.border = '1px solid #ccc';
    video.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    video.src = file.fileURL;
    container.appendChild(video);
}

function showImagePreview(file, previewImage) {
    previewImage.src = file.fileURL;
    previewImage.style.display = 'block';
    previewImage.style.maxWidth = '100%';
    previewImage.style.maxHeight = '600px';
    previewImage.style.margin = '0 auto';
    previewImage.style.border = '1px solid #ddd';
    previewImage.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    previewImage.style.cursor = 'pointer';
    previewImage.onclick = () => window.open(file.fileURL, '_blank');
}
```

### 4. Preview Navigation Functions
```javascript
function setupPreviewNavigation() {
    const prevBtn = document.getElementById('prev-report-btn');
    const nextBtn = document.getElementById('next-report-btn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPreviewIndex > 0) {
                currentPreviewIndex--;
                updatePreview();
                updatePreviewCounter();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPreviewIndex < reportFiles.length - 1) {
                currentPreviewIndex++;
                updatePreview();
                updatePreviewCounter();
            }
        });
    }
}

function updatePreviewCounter() {
    const counter = document.getElementById('preview-counter');
    const prevBtn = document.getElementById('prev-report-btn');
    const nextBtn = document.getElementById('next-report-btn');
    
    if (counter) {
        counter.textContent = `${currentPreviewIndex + 1} of ${reportFiles.length}`;
    }
    
    if (prevBtn) prevBtn.disabled = currentPreviewIndex === 0;
    if (nextBtn) nextBtn.disabled = currentPreviewIndex === reportFiles.length - 1;
}
```

## Global Variables Required
```javascript
let currentPreviewIndex = 0;
let reportFiles = [];
```

## CSS Styles for Enhanced Previews
```css
.report-preview-pane {
    margin-bottom: 20px;
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.preview-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 15px;
}

.preview-control-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 5px;
}

.preview-control-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.highlighted-row {
    background-color: #e3f2fd !important;
}
```

## Advanced Modal Previews

The system also includes advanced modal previews with realistic document representations:

### 1. Realistic PDF Preview Modal
- Creates toolbar-like interface
- Shows page indicators
- Includes zoom controls simulation

### 2. Realistic Excel Preview Modal  
- Creates spreadsheet grid interface
- Shows cell references (A1, B1, etc.)
- Includes Excel-like toolbar

### 3. Realistic Word Preview Modal
- Shows document with headers, paragraphs
- Includes Word-like formatting
- Document structure simulation

### 4. PowerPoint Preview Modal
- Shows slide thumbnail navigation
- Main slide preview area
- PowerPoint-like interface

## Implementation Steps

1. **Add HTML structure** for preview pane and modals
2. **Include required CSS** for styling and layout
3. **Implement core JavaScript functions** for file type detection and preview updates
4. **Set up navigation controls** for browsing between files
5. **Add event listeners** for user interactions
6. **Test with different file types** to ensure proper preview rendering
7. **Implement error handling** for failed preview loads

## External Dependencies

- **Font Awesome** for icons: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`
- **Google Docs Viewer** for PDF previews (no API key required)
- **Microsoft Office Apps** for Excel/Word previews (no API key required)

## Error Handling

Include fallback mechanisms for when preview services are unavailable:
```javascript
function handlePreviewError(file, container) {
    container.innerHTML = `
        <div class="preview-error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Preview not available for ${file.name}</p>
            <button onclick="window.open('${file.fileURL}', '_blank')">Download File</button>
        </div>
    `;
}
```

This comprehensive preview system provides professional-grade file preview capabilities across multiple formats, ensuring users can quickly review content without downloading files.