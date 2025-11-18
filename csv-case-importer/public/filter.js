// DOM Elements
const filterForm = document.getElementById('filterForm');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const results = document.getElementById('results');
const resultsCount = document.getElementById('resultsCount');
const noResults = document.getElementById('noResults');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Store current results for export
let currentResults = [];

// Form submission
filterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await searchCases();
});

// Clear button
clearBtn.addEventListener('click', () => {
    filterForm.reset();
    resultsSection.classList.add('hidden');
    noResults.classList.add('hidden');
    currentResults = [];
});

// Export buttons
exportCsvBtn.addEventListener('click', () => {
    exportToCSV(currentResults);
});

exportJsonBtn.addEventListener('click', () => {
    exportToJSON(currentResults);
});

async function searchCases() {
    // Collect filter values
    const filters = {
        litigation_id: document.getElementById('litigationId').value.trim(),
        status_id: document.getElementById('statusId').value.trim(),
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        date_from: document.getElementById('dateFrom').value,
        date_to: document.getElementById('dateTo').value,
        tags: document.getElementById('tags').value.trim(),
        limit: document.getElementById('limit').value
    };

    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });

    // Show loading
    searchBtn.disabled = true;
    loading.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    noResults.classList.add('hidden');

    try {
        // Build query string
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/cases?${queryString}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch cases');
        }

        const data = await response.json();
        currentResults = data.cases || [];

        if (currentResults.length === 0) {
            noResults.classList.remove('hidden');
        } else {
            displayResults(currentResults);
            resultsSection.classList.remove('hidden');
        }
    } catch (error) {
        showNotification('Error fetching cases: ' + error.message, 'error');
    } finally {
        searchBtn.disabled = false;
        loading.classList.add('hidden');
    }
}

function displayResults(cases) {
    resultsCount.textContent = `Found ${cases.length} case${cases.length !== 1 ? 's' : ''}`;
    
    results.innerHTML = cases.map((caseData, index) => `
        <div class="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 slide-in" style="animation-delay: ${index * 0.05}s">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2 flex items-center">
                        <i class="fas fa-folder-open text-indigo-600 mr-2"></i>
                        ${caseData.first_name || 'N/A'} ${caseData.last_name || ''}
                    </h3>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${caseData.status_id ? `<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">Status: ${caseData.status_id}</span>` : ''}
                        ${caseData.litigation_id ? `<span class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">Litigation: ${caseData.litigation_id}</span>` : ''}
                    </div>
                </div>
                <button onclick="viewDetails(${index})" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-semibold">
                    <i class="fas fa-eye mr-2"></i>Details
                </button>
            </div>
            
            <div class="grid md:grid-cols-2 gap-4 text-sm">
                ${caseData.email ? `
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-envelope text-gray-400 mr-2 w-4"></i>
                        <span>${caseData.email}</span>
                    </div>
                ` : ''}
                ${caseData.phone ? `
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-phone text-gray-400 mr-2 w-4"></i>
                        <span>${caseData.phone}</span>
                    </div>
                ` : ''}
                ${caseData.created_at ? `
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-calendar text-gray-400 mr-2 w-4"></i>
                        <span>Created: ${new Date(caseData.created_at).toLocaleDateString()}</span>
                    </div>
                ` : ''}
                ${caseData.id ? `
                    <div class="flex items-center text-gray-700">
                        <i class="fas fa-hashtag text-gray-400 mr-2 w-4"></i>
                        <span>ID: ${caseData.id}</span>
                    </div>
                ` : ''}
            </div>

            ${caseData.tags && caseData.tags.length > 0 ? `
                <div class="mt-4 flex flex-wrap gap-2">
                    ${caseData.tags.map(tag => `
                        <span class="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                            <i class="fas fa-tag mr-1"></i>${tag}
                        </span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function viewDetails(index) {
    const caseData = currentResults[index];
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-info-circle mr-3"></i>Case Details
                </h2>
                <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-200 transition">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>
            <div class="p-8">
                <div class="space-y-4">
                    ${Object.entries(caseData).map(([key, value]) => {
                        if (!value) return '';
                        const displayKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                        let displayValue = value;
                        
                        if (Array.isArray(value)) {
                            displayValue = value.join(', ');
                        } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value, null, 2);
                        }
                        
                        return `
                            <div class="border-b border-gray-200 pb-3">
                                <div class="text-sm font-semibold text-gray-600 mb-1">${displayKey}</div>
                                <div class="text-gray-800">${displayValue}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-6 flex justify-end">
                    <button onclick="this.closest('.fixed').remove()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-semibold">
                        <i class="fas fa-check mr-2"></i>Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function exportToCSV(cases) {
    if (cases.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }

    // Get all unique keys from all cases
    const allKeys = new Set();
    cases.forEach(caseData => {
        Object.keys(caseData).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    cases.forEach(caseData => {
        const row = headers.map(header => {
            let value = caseData[header] || '';
            
            // Handle arrays
            if (Array.isArray(value)) {
                value = value.join('; ');
            }
            
            // Handle objects
            if (typeof value === 'object' && value !== null) {
                value = JSON.stringify(value);
            }
            
            // Escape quotes and wrap in quotes if contains comma
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n')) {
                value = `"${value}"`;
            }
            
            return value;
        });
        
        csvContent += row.join(',') + '\n';
    });

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cases_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Export successful!', 'success');
}

function exportToJSON(cases) {
    if (cases.length === 0) {
        showNotification('No data to export', 'error');
        return;
    }

    // Create JSON content
    const jsonContent = JSON.stringify(cases, null, 2);

    // Download file
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `cases_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('JSON export successful!', 'success');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white z-50 slide-in`;
    notification.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'} mr-2"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}
