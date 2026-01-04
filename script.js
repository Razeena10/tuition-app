// Data Storage
let students = JSON.parse(localStorage.getItem('students')) || [];
let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
let fees = JSON.parse(localStorage.getItem('fees')) || [];
let homework = JSON.parse(localStorage.getItem('homework')) || [];

// Data Migration - Convert old homework format to new format
function migrateHomeworkData() {
    const oldHomework = JSON.parse(localStorage.getItem('homework')) || [];
    
    // Check if data needs migration (old format had 'type', 'description', 'dueDate')
    const needsMigration = oldHomework.some(hw => hw.type && hw.description && hw.dueDate);
    
    if (needsMigration) {
        // Convert old homework entries to new simplified format
        const migratedHomework = oldHomework.map(hw => {
            if (hw.type && hw.description && hw.dueDate) {
                // Old format - convert to new format
                return {
                    id: hw.id,
                    studentId: hw.studentId,
                    date: hw.dueDate, // Use dueDate as the date
                    completed: hw.completed || false,
                    createdAt: hw.createdAt
                };
            }
            return hw; // Already in new format
        });
        
        homework = migratedHomework;
        localStorage.setItem('homework', JSON.stringify(homework));
        console.log('Homework data migrated to new format');
    }
}

// Current student for modals
let currentStudentId = null;

// Current attendance date for modal
let currentAttendanceDate = null;

// Current homework date for modal
let currentHomeworkDate = null;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    migrateHomeworkData(); // Migrate old data format if needed
    initializeTabs();
    initializeModals();
    initializeEventListeners();
    loadData();
    updateReports();
});

// Tab Management
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the active tab
            loadTabData(tabId);
        });
    });
}

// Modal Management
function initializeModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Close modal when clicking outside
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Event Listeners
function initializeEventListeners() {
    // Add Student Button
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        currentStudentId = null;
        document.getElementById('modalTitle').textContent = 'Add Student';
        document.getElementById('studentForm').reset();
        openModal('studentModal');
    });

    // Student Form Submit
    document.getElementById('studentForm').addEventListener('submit', handleStudentSubmit);

    // Search Students
    document.getElementById('studentSearch').addEventListener('input', filterStudents);

    // Attendance Form
    document.getElementById('attendanceDate').addEventListener('change', () => {
        loadAttendance();
        loadAttendanceTable();
    });

    // Homework Form
    document.getElementById('homeworkDate').addEventListener('change', loadHomework);

    // Mark Attendance Button
    document.getElementById('markAllAttendanceBtn').addEventListener('click', () => {
        const date = document.getElementById('attendanceDate').value;
        if (!date) {
            alert('Please select a date');
            return;
        }
        openAttendanceModal(date);
    });

    // Toggle View Button
    document.getElementById('toggleViewBtn').addEventListener('click', toggleAttendanceView);

    // Save Attendance Button
    document.getElementById('saveAttendanceBtn').addEventListener('click', saveAttendanceStatus);

    // Attendance Date Change
    document.getElementById('attendanceDate').addEventListener('change', () => {
        loadAttendance();
        loadAttendanceTable();
    });

    // Add Homework Button
    document.getElementById('markAllHomeworkBtn').addEventListener('click', () => {
        const date = document.getElementById('homeworkDate').value;
        if (!date) {
            alert('Please select a date');
            return;
        }
        openHomeworkModal(date);
    });

    // Save Homework Button
    document.getElementById('saveHomeworkBtn').addEventListener('click', saveHomeworkStatus);

    // Record Payment Button
    document.getElementById('recordPaymentBtn').addEventListener('click', handleFeePayment);

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;
    document.getElementById('feeDate').value = today;
    document.getElementById('homeworkDate').value = today;
}

// Student Management
function handleStudentSubmit(e) {
    e.preventDefault();
    
    const studentData = {
        id: currentStudentId || Date.now().toString(),
        nameEn: document.getElementById('studentNameEn').value,
        nameUrdu: document.getElementById('studentNameUrdu').value,
        nameArabic: document.getElementById('studentNameArabic').value,
        age: parseInt(document.getElementById('studentAge').value),
        class: document.getElementById('studentClass').value,
        subject: document.getElementById('studentSubject').value,
        parentContact: document.getElementById('parentContact').value,
        monthlyFee: parseFloat(document.getElementById('monthlyFee').value),
        joiningDate: document.getElementById('joiningDate').value,
        createdAt: currentStudentId ? students.find(s => s.id === currentStudentId).createdAt : new Date().toISOString()
    };

    if (currentStudentId) {
        // Update existing student
        const index = students.findIndex(s => s.id === currentStudentId);
        students[index] = studentData;
    } else {
        // Add new student
        students.push(studentData);
    }

    saveData();
    loadStudents();
    updateDropdowns();
    closeModal('studentModal');
    updateReports();
}

function loadStudents() {
    const container = document.getElementById('studentsList');
    container.innerHTML = '';

    students.forEach(student => {
        const card = createStudentCard(student);
        container.appendChild(card);
    });
}

function createStudentCard(student) {
    const card = document.createElement('div');
    card.className = 'student-card';
    
    const attendanceRate = calculateAttendanceRate(student.id);
    const homeworkCompletion = calculateHomeworkCompletion(student.id);
    const feeStatus = getFeeStatus(student.id);

    card.innerHTML = `
        <div class="student-header">
            <div class="student-name">${student.nameEn}</div>
            <div class="student-actions">
                <button class="btn btn-small btn-success" onclick="viewStudentRecord('${student.id}')" title="View Record">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-small btn-primary" onclick="editStudent('${student.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-secondary" onclick="deleteStudent('${student.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="student-info">
            <div class="info-item">
                <span class="info-label">Urdu Name</span>
                <span class="info-value rtl">${student.nameUrdu || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Arabic Name</span>
                <span class="info-value rtl">${student.nameArabic || 'N/A'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Age/Class</span>
                <span class="info-value">${student.age}/${student.class}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Subject</span>
                <span class="info-value">${student.subject}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Contact</span>
                <span class="info-value">${student.parentContact}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Monthly Fee</span>
                <span class="info-value">$${student.monthlyFee}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Attendance</span>
                <span class="info-value">${attendanceRate}%</span>
            </div>
            <div class="info-item">
                <span class="info-label">Homework</span>
                <span class="info-value">${homeworkCompletion}%</span>
            </div>
        </div>
        <div style="margin-top: 10px;">
            <span class="status-badge ${feeStatus.class}">${feeStatus.text}</span>
        </div>
    `;

    return card;
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    currentStudentId = id;
    document.getElementById('modalTitle').textContent = 'Edit Student';
    
    // Fill form with student data
    document.getElementById('studentNameEn').value = student.nameEn;
    document.getElementById('studentNameUrdu').value = student.nameUrdu || '';
    document.getElementById('studentNameArabic').value = student.nameArabic || '';
    document.getElementById('studentAge').value = student.age;
    document.getElementById('studentClass').value = student.class;
    document.getElementById('studentSubject').value = student.subject;
    document.getElementById('parentContact').value = student.parentContact;
    document.getElementById('monthlyFee').value = student.monthlyFee;
    document.getElementById('joiningDate').value = student.joiningDate;
    
    openModal('studentModal');
}

function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student? This will also delete all related attendance, fee, and homework records.')) {
        students = students.filter(s => s.id !== id);
        attendance = attendance.filter(a => a.studentId !== id);
        fees = fees.filter(f => f.studentId !== id);
        homework = homework.filter(h => h.studentId !== id);
        
        saveData();
        loadStudents();
        updateDropdowns();
        updateReports();
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const cards = document.querySelectorAll('.student-card');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(searchTerm) ? 'block' : 'none';
    });
}

// Attendance Management
function openAttendanceModal(date) {
    currentAttendanceDate = date;
    const container = document.getElementById('attendanceChecklist');
    container.innerHTML = '';

    students.forEach(student => {
        const existingAttendance = attendance.find(a => 
            a.studentId === student.id && a.date === date
        );

        const studentDiv = document.createElement('div');
        studentDiv.className = 'attendance-student-item';
        studentDiv.innerHTML = `
            <div class="student-info">
                <strong>${student.nameEn}</strong>
                <span class="student-subject">${student.subject}</span>
            </div>
            <div class="attendance-status">
                <label>
                    <input type="radio" name="attendance_${student.id}" value="Present" 
                           ${existingAttendance?.status === 'Present' ? 'checked' : ''}>
                    Present
                </label>
                <label>
                    <input type="radio" name="attendance_${student.id}" value="Absent" 
                           ${existingAttendance?.status === 'Absent' ? 'checked' : ''}>
                    Absent
                </label>
            </div>
        `;
        container.appendChild(studentDiv);
    });

    openModal('attendanceModal');
}

function saveAttendanceStatus() {
    const date = currentAttendanceDate;
    
    students.forEach(student => {
        const status = document.querySelector(`input[name="attendance_${student.id}"]:checked`)?.value;
        
        if (status) {
            const existingIndex = attendance.findIndex(a => 
                a.studentId === student.id && a.date === date
            );

            const attendanceData = {
                id: existingIndex >= 0 ? attendance[existingIndex].id : Date.now().toString() + '_' + student.id,
                studentId: student.id,
                date: date,
                status: status,
                note: '',
                createdAt: existingIndex >= 0 ? attendance[existingIndex].createdAt : new Date().toISOString()
            };

            if (existingIndex >= 0) {
                attendance[existingIndex] = attendanceData;
            } else {
                attendance.push(attendanceData);
            }
        }
    });

    saveData();
    loadAttendance();
    loadAttendanceTable();
    closeModal('attendanceModal');
    updateReports();
}

function toggleAttendanceView() {
    const listView = document.getElementById('attendanceList');
    const tableView = document.getElementById('attendanceTable');
    
    if (listView.style.display === 'none') {
        listView.style.display = 'block';
        tableView.style.display = 'none';
    } else {
        listView.style.display = 'none';
        tableView.style.display = 'block';
        loadAttendanceTable();
    }
}

function loadAttendanceTable() {
    const container = document.getElementById('attendanceTable');
    const selectedDate = document.getElementById('attendanceDate').value;
    
    if (!selectedDate) {
        container.innerHTML = '<p>Please select a date to view attendance table.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'attendance-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    
    students.forEach(student => {
        const studentAttendance = attendance.find(a => 
            a.studentId === student.id && a.date === selectedDate
        );

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.nameEn}</td>
            <td>${student.subject}</td>
            <td>
                <span class="status-badge status-${studentAttendance?.status.toLowerCase() || 'pending'}">
                    ${studentAttendance?.status || 'Not Marked'}
                </span>
            </td>
            <td>${new Date(selectedDate).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(table);
}

function loadAttendance() {
    const container = document.getElementById('attendanceList');
    container.innerHTML = '';

    const sortedAttendance = attendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedAttendance.forEach(record => {
        const student = students.find(s => s.id === record.studentId);
        if (!student) return;

        const item = document.createElement('div');
        item.className = 'attendance-item';
        
        item.innerHTML = `
            <div class="item-info">
                <h4>${student.nameEn}</h4>
                <p>${new Date(record.date).toLocaleDateString()}</p>
                ${record.note ? `<p><em>${record.note}</em></p>` : ''}
            </div>
            <div>
                <span class="status-badge status-${record.status.toLowerCase()}">${record.status}</span>
                <button class="btn btn-small btn-secondary" onclick="deleteAttendance('${record.id}')" style="margin-left: 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}

function deleteAttendance(id) {
    if (confirm('Delete this attendance record?')) {
        attendance = attendance.filter(a => a.id !== id);
        saveData();
        loadAttendance();
        loadAttendanceTable();
        updateReports();
    }
}

// Fee Management
function handleFeePayment() {
    const studentId = document.getElementById('feeStudent').value;
    const amount = parseFloat(document.getElementById('feeAmount').value);
    const paymentMode = document.getElementById('paymentMode').value;
    const date = document.getElementById('feeDate').value;

    if (!studentId || !amount || !paymentMode || !date) {
        alert('Please fill all fields');
        return;
    }

    const feeData = {
        id: Date.now().toString(),
        studentId: studentId,
        amount: amount,
        paymentMode: paymentMode,
        date: date,
        createdAt: new Date().toISOString()
    };

    fees.push(feeData);
    saveData();
    loadFees();
    
    // Clear form
    document.getElementById('feeAmount').value = '';
    document.getElementById('paymentMode').value = '';
    updateReports();
}

function loadFees() {
    const container = document.getElementById('feesList');
    container.innerHTML = '';

    const sortedFees = fees.sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedFees.forEach(fee => {
        const student = students.find(s => s.id === fee.studentId);
        if (!student) return;

        const item = document.createElement('div');
        item.className = 'fee-item';
        
        item.innerHTML = `
            <div class="item-info">
                <h4>${student.nameEn}</h4>
                <p>Amount: $${fee.amount}</p>
                <p>Payment Mode: <span class="payment-mode payment-${fee.paymentMode?.toLowerCase() || 'unknown'}">${fee.paymentMode || 'N/A'}</span></p>
                <p>${new Date(fee.date).toLocaleDateString()}</p>
            </div>
            <div>
                <span class="status-badge status-paid">Paid</span>
                <button class="btn btn-small btn-secondary" onclick="deleteFee('${fee.id}')" style="margin-left: 10px;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}

function deleteFee(id) {
    if (confirm('Delete this fee record?')) {
        fees = fees.filter(f => f.id !== id);
        saveData();
        loadFees();
        updateReports();
    }
}

// Homework Management
function openHomeworkModal(date) {
    currentHomeworkDate = date;
    const container = document.getElementById('homeworkChecklist');
    container.innerHTML = '';

    students.forEach(student => {
        const existingHomework = homework.find(h => 
            h.studentId === student.id && h.date === date
        );

        const studentDiv = document.createElement('div');
        studentDiv.className = 'homework-student-item';
        studentDiv.innerHTML = `
            <div class="student-info">
                <strong>${student.nameEn}</strong>
                <span class="student-subject">${student.subject}</span>
            </div>
            <div class="homework-status">
                <label>
                    <input type="radio" name="homework_${student.id}" value="done" 
                           ${existingHomework?.completed ? 'checked' : ''}>
                    Done
                </label>
                <label>
                    <input type="radio" name="homework_${student.id}" value="not-done" 
                           ${!existingHomework?.completed ? 'checked' : ''}>
                    Not Done
                </label>
            </div>
        `;
        container.appendChild(studentDiv);
    });

    openModal('homeworkModal');
}

function saveHomeworkStatus() {
    const date = currentHomeworkDate;
    
    students.forEach(student => {
        const status = document.querySelector(`input[name="homework_${student.id}"]:checked`)?.value;
        
        if (status) {
            const existingIndex = homework.findIndex(h => 
                h.studentId === student.id && h.date === date
            );

            const homeworkData = {
                id: existingIndex >= 0 ? homework[existingIndex].id : Date.now().toString() + '_' + student.id,
                studentId: student.id,
                date: date,
                completed: status === 'done',
                createdAt: existingIndex >= 0 ? homework[existingIndex].createdAt : new Date().toISOString()
            };

            if (existingIndex >= 0) {
                homework[existingIndex] = homeworkData;
            } else {
                homework.push(homeworkData);
            }
        }
    });

    saveData();
    loadHomework();
    closeModal('homeworkModal');
    updateReports();
}

function loadHomework() {
    const container = document.getElementById('homeworkTable');
    const selectedDate = document.getElementById('homeworkDate').value;
    
    if (!selectedDate) {
        container.innerHTML = '<p>Please select a date to view homework status.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'homework-table';
    
    table.innerHTML = `
        <thead>
            <tr>
                <th>Student Name</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    
    students.forEach(student => {
        const studentHomework = homework.find(h => 
            h.studentId === student.id && h.date === selectedDate
        );

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.nameEn}</td>
            <td>${student.subject}</td>
            <td>
                <span class="status-badge status-${studentHomework?.completed ? 'done' : 'not-done'}">
                    ${studentHomework?.completed ? 'Done' : 'Not Done'}
                </span>
            </td>
            <td>${new Date(selectedDate).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });

    container.innerHTML = '';
    container.appendChild(table);
}

// Utility Functions
function calculateAttendanceRate(studentId) {
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    if (studentAttendance.length === 0) return 0;
    
    const presentCount = studentAttendance.filter(a => a.status === 'Present').length;
    return Math.round((presentCount / studentAttendance.length) * 100);
}

function calculateHomeworkCompletion(studentId) {
    const studentHomework = homework.filter(h => h.studentId === studentId);
    if (studentHomework.length === 0) return 0;
    
    const completedCount = studentHomework.filter(h => h.completed).length;
    return Math.round((completedCount / studentHomework.length) * 100);
}

function getFeeStatus(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return { text: 'Unknown', class: 'status-pending' };
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthFees = fees.filter(f => {
        const feeDate = new Date(f.date);
        return f.studentId === studentId && 
               feeDate.getMonth() === currentMonth && 
               feeDate.getFullYear() === currentYear;
    });
    
    const totalPaid = currentMonthFees.reduce((sum, f) => sum + f.amount, 0);
    
    if (totalPaid >= student.monthlyFee) {
        return { text: 'Paid', class: 'status-paid' };
    } else if (totalPaid > 0) {
        return { text: 'Partial', class: 'status-pending' };
    } else {
        return { text: 'Pending', class: 'status-pending' };
    }
}

// Data Management
function saveData() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('attendance', JSON.stringify(attendance));
    localStorage.setItem('fees', JSON.stringify(fees));
    localStorage.setItem('homework', JSON.stringify(homework));
}

function loadData() {
    loadStudents();
    updateDropdowns();
}

function loadTabData(tabId) {
    switch(tabId) {
        case 'students':
            loadStudents();
            break;
        case 'attendance':
            loadAttendance();
            loadAttendanceTable();
            break;
        case 'fees':
            loadFees();
            break;
        case 'homework':
            loadHomework();
            break;
        case 'reports':
            updateReports();
            break;
    }
}

function updateDropdowns() {
    const selects = ['feeStudent'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Select Student</option>';
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = student.nameEn;
            select.appendChild(option);
        });
    });
}

function updateReports() {
    updateOverallStats();
    updateMonthlyStats();
}

function updateOverallStats() {
    const container = document.getElementById('overallStats');
    
    const totalStudents = students.length;
    const totalAttendanceRecords = attendance.length;
    const totalHomeworkAssigned = homework.length;
    const completedHomework = homework.filter(h => h.completed).length;
    const totalFeesCollected = fees.reduce((sum, f) => sum + f.amount, 0);
    
    const avgAttendance = students.length > 0 ? 
        Math.round(students.reduce((sum, s) => sum + calculateAttendanceRate(s.id), 0) / students.length) : 0;
    
    const avgHomeworkCompletion = students.length > 0 ? 
        Math.round(students.reduce((sum, s) => sum + calculateHomeworkCompletion(s.id), 0) / students.length) : 0;

    container.innerHTML = `
        <div class="stat-item">
            <span>Total Students</span>
            <span class="stat-value">${totalStudents}</span>
        </div>
        <div class="stat-item">
            <span>Average Attendance</span>
            <span class="stat-value">${avgAttendance}%</span>
        </div>
        <div class="stat-item">
            <span>Homework Completion</span>
            <span class="stat-value">${avgHomeworkCompletion}%</span>
        </div>
        <div class="stat-item">
            <span>Total Fees Collected</span>
            <span class="stat-value">$${totalFeesCollected}</span>
        </div>
        <div class="stat-item">
            <span>Homework Assigned</span>
            <span class="stat-value">${totalHomeworkAssigned}</span>
        </div>
        <div class="stat-item">
            <span>Homework Completed</span>
            <span class="stat-value">${completedHomework}</span>
        </div>
    `;
}

function updateMonthlyStats() {
    const container = document.getElementById('monthlyStats');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAttendance = attendance.filter(a => {
        const date = new Date(a.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const monthlyFees = fees.filter(f => {
        const date = new Date(f.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const monthlyHomework = homework.filter(h => {
        const date = new Date(h.createdAt);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const presentCount = monthlyAttendance.filter(a => a.status === 'Present').length;
    const monthlyFeesTotal = monthlyFees.reduce((sum, f) => sum + f.amount, 0);
    const completedHomeworkCount = monthlyHomework.filter(h => h.completed).length;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    container.innerHTML = `
        <h4>${monthNames[currentMonth]} ${currentYear}</h4>
        <div class="stat-item">
            <span>Attendance Records</span>
            <span class="stat-value">${monthlyAttendance.length}</span>
        </div>
        <div class="stat-item">
            <span>Present Days</span>
            <span class="stat-value">${presentCount}</span>
        </div>
        <div class="stat-item">
            <span>Fees Collected</span>
            <span class="stat-value">$${monthlyFeesTotal}</span>
        </div>
        <div class="stat-item">
            <span>Homework Assigned</span>
            <span class="stat-value">${monthlyHomework.length}</span>
        </div>
        <div class="stat-item">
            <span>Homework Completed</span>
            <span class="stat-value">${completedHomeworkCount}</span>
        </div>
    `;
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Export Function
function exportData() {
    const data = {
        students,
        attendance,
        fees,
        homework,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `tuition-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

// Import Function (can be added later)
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm('This will replace all current data. Are you sure?')) {
                students = data.students || [];
                attendance = data.attendance || [];
                fees = data.fees || [];
                homework = data.homework || [];
                
                saveData();
                loadData();
                updateReports();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };
    reader.readAsText(file);
}
// Student Record Functions
let currentRecordStudentId = null;

function viewStudentRecord(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    currentRecordStudentId = studentId;
    
    // Set modal title
    document.getElementById('studentRecordTitle').textContent = `${student.nameEn} - Complete Record`;
    
    // Get student data
    const studentAttendance = attendance.filter(a => a.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const studentHomework = homework.filter(h => h.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));
    const studentFees = fees.filter(f => f.studentId === studentId).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate statistics
    const attendanceRate = calculateAttendanceRate(studentId);
    const homeworkCompletion = calculateHomeworkCompletion(studentId);
    const totalFeesPaid = studentFees.reduce((sum, f) => sum + f.amount, 0);
    const presentDays = studentAttendance.filter(a => a.status === 'Present').length;
    const completedHomework = studentHomework.filter(h => h.completed).length;
    
    const content = `
        <div class="student-summary">
            <div class="summary-card">
                <span class="summary-value">${attendanceRate}%</span>
                <span class="summary-label">Attendance Rate</span>
            </div>
            <div class="summary-card">
                <span class="summary-value">${presentDays}</span>
                <span class="summary-label">Present Days</span>
            </div>
            <div class="summary-card">
                <span class="summary-value">${homeworkCompletion}%</span>
                <span class="summary-label">Homework Completion</span>
            </div>
            <div class="summary-card">
                <span class="summary-value">$${totalFeesPaid}</span>
                <span class="summary-label">Total Fees Paid</span>
            </div>
        </div>

        <div class="student-record-section">
            <h4><i class="fas fa-calendar-check"></i> Attendance History</h4>
            ${studentAttendance.length > 0 ? `
                <table class="record-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Note</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentAttendance.map(a => `
                            <tr>
                                <td>${new Date(a.date).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${a.status.toLowerCase()}">${a.status}</span></td>
                                <td>${a.note || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No attendance records found.</p>'}
        </div>

        <div class="student-record-section">
            <h4><i class="fas fa-book"></i> Homework History</h4>
            ${studentHomework.length > 0 ? `
                <table class="record-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentHomework.map(h => `
                            <tr>
                                <td>${new Date(h.date).toLocaleDateString()}</td>
                                <td><span class="status-badge status-${h.completed ? 'done' : 'not-done'}">${h.completed ? 'Done' : 'Not Done'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No homework records found.</p>'}
        </div>

        <div class="student-record-section">
            <h4><i class="fas fa-money-bill-wave"></i> Fee Payment History</h4>
            ${studentFees.length > 0 ? `
                <table class="record-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${studentFees.map(f => `
                            <tr>
                                <td>${new Date(f.date).toLocaleDateString()}</td>
                                <td>$${f.amount}</td>
                                <td><span class="payment-mode payment-${f.paymentMode?.toLowerCase() || 'unknown'}">${f.paymentMode || 'N/A'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<p>No fee payment records found.</p>'}
        </div>
    `;
    
    document.getElementById('studentRecordContent').innerHTML = content;
    openModal('studentRecordModal');
}

function exportStudentRecord() {
    if (!currentRecordStudentId) return;
    
    const student = students.find(s => s.id === currentRecordStudentId);
    if (!student) return;
    
    const studentAttendance = attendance.filter(a => a.studentId === currentRecordStudentId);
    const studentHomework = homework.filter(h => h.studentId === currentRecordStudentId);
    const studentFees = fees.filter(f => f.studentId === currentRecordStudentId);
    
    const recordData = {
        student: student,
        attendance: studentAttendance,
        homework: studentHomework,
        fees: studentFees,
        statistics: {
            attendanceRate: calculateAttendanceRate(currentRecordStudentId),
            homeworkCompletion: calculateHomeworkCompletion(currentRecordStudentId),
            totalFeesPaid: studentFees.reduce((sum, f) => sum + f.amount, 0),
            presentDays: studentAttendance.filter(a => a.status === 'Present').length,
            completedHomework: studentHomework.filter(h => h.completed).length
        },
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(recordData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `${student.nameEn.replace(/\s+/g, '_')}-record-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}
// PWA Installation
let deferredPrompt;
let installButton;

// Check if app is already installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Add install button to header if not installed
function addInstallButton() {
    if (!isAppInstalled() && !document.getElementById('installBtn')) {
        const headerActions = document.querySelector('.header-actions');
        installButton = document.createElement('button');
        installButton.id = 'installBtn';
        installButton.className = 'btn btn-success';
        installButton.innerHTML = '<i class="fas fa-download"></i> Install App';
        installButton.style.display = 'none';
        installButton.addEventListener('click', installApp);
        headerActions.appendChild(installButton);
    }
}

// Install app function
async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        if (installButton) {
            installButton.style.display = 'none';
        }
    }
}

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    addInstallButton();
    if (installButton) {
        installButton.style.display = 'inline-flex';
    }
});

// Listen for app installed event
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed');
    if (installButton) {
        installButton.style.display = 'none';
    }
});

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Initialize PWA features
document.addEventListener('DOMContentLoaded', function() {
    addInstallButton();
    
    // Show install instructions for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        setTimeout(() => {
            if (!isAppInstalled()) {
                alert('To install this app on iOS:\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install');
            }
        }, 3000);
    }
});