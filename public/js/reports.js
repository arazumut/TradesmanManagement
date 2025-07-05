// Check authentication status when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuthStatus();
    
    // Set default date range (last 30 days)
    setDefaultDateRange();
    
    // Generate initial report
    generateReport();
    
    // Set up event listeners
    setupEventListeners();
});

// Set default date range (last 30 days)
function setDefaultDateRange() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    document.getElementById('startDate').value = formatDate(thirtyDaysAgo);
    document.getElementById('endDate').value = formatDate(today);
}

// Set up all event listeners
function setupEventListeners() {
    // Generate report button click
    document.getElementById('generateReport').addEventListener('click', function() {
        generateReport();
    });
    
    // Report type change
    document.getElementById('reportType').addEventListener('change', function() {
        generateReport();
    });
    
    // Export PDF button click
    document.getElementById('exportPdf').addEventListener('click', function() {
        exportReport('pdf');
    });
    
    // Export Excel button click
    document.getElementById('exportExcel').addEventListener('click', function() {
        exportReport('excel');
    });
    
    // Print report button click
    document.getElementById('printReport').addEventListener('click', function() {
        window.print();
    });
    
    // Logout button click
    document.getElementById('logout-btn').addEventListener('click', function() {
        logout();
    });
}

// Generate report based on selected type and date range
function generateReport() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Update report table title
    updateReportTableTitle(reportType);
    
    // Show loading state
    showLoading();
    
    // Build query string
    let queryParams = `?startDate=${startDate}&endDate=${endDate}&reportType=${reportType}`;
    
    fetch(`/api/admin/reports${queryParams}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Rapor oluşturulurken bir hata oluştu!');
        return response.json();
    })
    .then(data => {
        // Hide loading state
        hideLoading();
        
        // Update summary cards
        updateSummaryCards(data.summary);
        
        // Update chart
        updateChart(data.chartData);
        
        // Render report table
        renderReportTable(data.tableData, reportType);
    })
    .catch(error => {
        console.error('Error generating report:', error);
        hideLoading();
        showAlert('danger', 'Rapor oluşturulurken bir hata oluştu!');
    });
}

// Update report table title based on report type
function updateReportTableTitle(reportType) {
    const titleElement = document.getElementById('reportTableTitle');
    
    switch(reportType) {
        case 'sales':
            titleElement.textContent = 'Satış Raporu';
            break;
        case 'stores':
            titleElement.textContent = 'Mağaza Performans Raporu';
            break;
        case 'products':
            titleElement.textContent = 'Ürün Performans Raporu';
            break;
        case 'categories':
            titleElement.textContent = 'Kategori Performans Raporu';
            break;
        default:
            titleElement.textContent = 'Rapor';
    }
}

// Show loading state
function showLoading() {
    // Create loading overlay if it doesn't exist
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
        loadingOverlay.style.zIndex = '9999';
        loadingOverlay.innerHTML = '<div class="spinner-border text-light" role="status"><span class="visually-hidden">Yükleniyor...</span></div>';
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.classList.remove('d-none');
    }
}

// Hide loading state
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('d-none');
    }
}

// Update summary cards with data
function updateSummaryCards(summary) {
    if (!summary) return;
    
    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(value || 0);
    };
    
    // Update total sales
    document.getElementById('totalSales').textContent = formatCurrency(summary.totalSales);
    
    // Update order count
    document.getElementById('orderCount').textContent = summary.orderCount || 0;
    
    // Update average order value
    document.getElementById('avgOrderValue').textContent = formatCurrency(summary.avgOrderValue);
    
    // Update active customers
    document.getElementById('activeCustomers').textContent = summary.activeCustomers || 0;
}

// Update chart with data
function updateChart(chartData) {
    if (!chartData) return;
    
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Check if chart already exists and destroy it
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    // Create new chart
    window.salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Satış Tutarı (₺)',
                data: chartData.data,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₺' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '₺' + context.raw.toLocaleString('tr-TR');
                        }
                    }
                }
            }
        }
    });
}

// Render report table based on report type and data
function renderReportTable(tableData, reportType) {
    if (!tableData) return;
    
    const table = document.getElementById('reportTable');
    table.innerHTML = '';
    
    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY'
        }).format(value || 0);
    };
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // Set headers based on report type
    switch(reportType) {
        case 'sales':
            headerRow.innerHTML = `
                <th>Tarih</th>
                <th>Sipariş ID</th>
                <th>Müşteri</th>
                <th>Mağaza</th>
                <th>Tutar</th>
                <th>Durum</th>
            `;
            break;
        case 'stores':
            headerRow.innerHTML = `
                <th>Mağaza ID</th>
                <th>Mağaza Adı</th>
                <th>Sipariş Sayısı</th>
                <th>Toplam Satış</th>
                <th>Ortalama Sipariş</th>
                <th>Tamamlanma Oranı</th>
            `;
            break;
        case 'products':
            headerRow.innerHTML = `
                <th>Ürün ID</th>
                <th>Ürün Adı</th>
                <th>Kategori</th>
                <th>Mağaza</th>
                <th>Satış Adedi</th>
                <th>Toplam Satış</th>
            `;
            break;
        case 'categories':
            headerRow.innerHTML = `
                <th>Kategori ID</th>
                <th>Kategori Adı</th>
                <th>Ürün Sayısı</th>
                <th>Satış Adedi</th>
                <th>Toplam Satış</th>
                <th>Ortalama Ürün Fiyatı</th>
            `;
            break;
    }
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    if (tableData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="6" class="text-center">Veri bulunamadı</td>`;
        tbody.appendChild(emptyRow);
    } else {
        // Create rows based on report type
        tableData.forEach(item => {
            const row = document.createElement('tr');
            
            switch(reportType) {
                case 'sales':
                    // Format date
                    const orderDate = new Date(item.createdAt).toLocaleDateString('tr-TR');
                    
                    // Status badge
                    let statusBadge = '';
                    switch(item.status) {
                        case 'pending':
                            statusBadge = '<span class="badge bg-warning">Beklemede</span>';
                            break;
                        case 'processing':
                            statusBadge = '<span class="badge bg-info">Hazırlanıyor</span>';
                            break;
                        case 'completed':
                            statusBadge = '<span class="badge bg-success">Tamamlandı</span>';
                            break;
                        case 'cancelled':
                            statusBadge = '<span class="badge bg-danger">İptal Edildi</span>';
                            break;
                        default:
                            statusBadge = '<span class="badge bg-secondary">Bilinmiyor</span>';
                    }
                    
                    row.innerHTML = `
                        <td>${orderDate}</td>
                        <td>${item.id}</td>
                        <td>${item.User ? item.User.name : 'Bilinmiyor'}</td>
                        <td>${item.Store ? item.Store.name : 'Bilinmiyor'}</td>
                        <td>${formatCurrency(item.totalAmount)}</td>
                        <td>${statusBadge}</td>
                    `;
                    break;
                case 'stores':
                    // Calculate completion rate
                    const completionRate = ((item.completedOrders / item.totalOrders) * 100).toFixed(2);
                    
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.totalOrders}</td>
                        <td>${formatCurrency(item.totalSales)}</td>
                        <td>${formatCurrency(item.avgOrderValue)}</td>
                        <td>${completionRate}%</td>
                    `;
                    break;
                case 'products':
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.Category ? item.Category.name : 'Bilinmiyor'}</td>
                        <td>${item.Store ? item.Store.name : 'Bilinmiyor'}</td>
                        <td>${item.quantitySold}</td>
                        <td>${formatCurrency(item.totalSales)}</td>
                    `;
                    break;
                case 'categories':
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.name}</td>
                        <td>${item.productCount}</td>
                        <td>${item.quantitySold}</td>
                        <td>${formatCurrency(item.totalSales)}</td>
                        <td>${formatCurrency(item.avgProductPrice)}</td>
                    `;
                    break;
            }
            
            tbody.appendChild(row);
        });
    }
    
    table.appendChild(tbody);
}

// Export report as PDF or Excel
function exportReport(type) {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Show loading state
    showLoading();
    
    // Build query string
    let queryParams = `?startDate=${startDate}&endDate=${endDate}&reportType=${reportType}&exportType=${type}`;
    
    fetch(`/api/admin/reports/export${queryParams}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Rapor ${type === 'pdf' ? 'PDF' : 'Excel'} olarak dışa aktarılırken bir hata oluştu!`);
        
        // Check content type
        const contentType = response.headers.get('content-type');
        if (type === 'pdf' && !contentType.includes('application/pdf')) {
            throw new Error('PDF oluşturulamadı!');
        }
        if (type === 'excel' && !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
            throw new Error('Excel oluşturulamadı!');
        }
        
        return response.blob();
    })
    .then(blob => {
        // Hide loading state
        hideLoading();
        
        // Create file name
        const fileName = `rapor_${reportType}_${startDate}_${endDate}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        showAlert('success', `Rapor başarıyla ${type === 'pdf' ? 'PDF' : 'Excel'} olarak indirildi!`);
    })
    .catch(error => {
        console.error(`Error exporting report as ${type}:`, error);
        hideLoading();
        showAlert('danger', `Rapor ${type === 'pdf' ? 'PDF' : 'Excel'} olarak dışa aktarılırken bir hata oluştu!`);
    });
}

// Show alert message
function showAlert(type, message) {
    // Check if alert container exists, if not create it
    let alertContainer = document.querySelector('.alert-container');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.className = 'alert-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(alertContainer);
    }
    
    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type} alert-dismissible fade show`;
    alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    alertContainer.appendChild(alertEl);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
    }, 5000);
}
