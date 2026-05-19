const AppState = {
    currentScreen: 'splash-screen',
    selectedZone: null,
    selectedSchool: null,
    isAdminLoggedIn: false,
    isSchoolLoggedIn: false,
    districtPassword: Config.districtPassword,
    adminUsername: Config.adminUsername,
    adminPassword: Config.adminPassword,
    recoveryEmail: Config.recoveryEmail
};

const Screens = {
    screens: {},
    
    init() {
        this.screens = {
            'splash-screen': document.getElementById('splash-screen'),
            'district-password-screen': document.getElementById('district-password-screen'),
            'zone-search-screen': document.getElementById('zone-search-screen'),
            'emis-search-screen': document.getElementById('emis-search-screen'),
            'school-password-screen': document.getElementById('school-password-screen'),
            'school-dashboard-screen': document.getElementById('school-dashboard-screen'),
            'category-data-screen': document.getElementById('category-data-screen'),
            'admin-login-screen': document.getElementById('admin-login-screen'),
            'admin-dashboard-screen': document.getElementById('admin-dashboard-screen'),
            'admin-recovery-screen': document.getElementById('admin-recovery-screen')
        };
    },
    
    show(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        this.screens[screenName].classList.add('active');
        AppState.currentScreen = screenName;
    }
};

const SplashScreen = {
    init() {
        setTimeout(() => {
            Screens.show('district-password-screen');
        }, 5000);
    }
};

const DistrictPasswordScreen = {
    init() {
        const passwordInput = document.getElementById('district-password');
        const toggleBtn = document.getElementById('toggle-district-password');
        const loginBtn = document.getElementById('district-login-btn');
        const errorDisplay = document.getElementById('district-error');
        
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        });
        
        loginBtn.addEventListener('click', () => {
            if (passwordInput.value === AppState.districtPassword) {
                errorDisplay.textContent = '';
                Screens.show('zone-search-screen');
            } else {
                errorDisplay.textContent = 'Please enter correct password or visit the division to access data';
                passwordInput.value = '';
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
};

const ZoneSearchScreen = {
    init() {
        const searchInput = document.getElementById('zone-search');
        const resultsContainer = document.getElementById('zone-results');
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const zones = DataStore.getZones();
            
            if (query === '') {
                resultsContainer.innerHTML = '';
                return;
            }
            
            const filteredZones = zones.filter(zone => 
                zone.name.toLowerCase().includes(query)
            );
            
            if (filteredZones.length === 0) {
                resultsContainer.innerHTML = '<p class="no-data">Sorry, We don\'t cover this area</p>';
                return;
            }
            
            resultsContainer.innerHTML = filteredZones.map(zone => `
                <div class="result-item" data-zone="${zone.name}">
                    <h3>${zone.name}</h3>
                </div>
            `).join('');
            
            document.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                    AppState.selectedZone = item.dataset.zone;
                    EMISearchScreen.init();
                    Screens.show('emis-search-screen');
                });
            });
        });
    }
};

const EMISearchScreen = {
    init() {
        const zoneDisplay = document.getElementById('selected-zone-display');
        const searchInput = document.getElementById('emis-search');
        const resultsContainer = document.getElementById('emis-results');
        
        zoneDisplay.textContent = `Selected Zone: ${AppState.selectedZone}`;
        searchInput.value = '';
        resultsContainer.innerHTML = '';
        
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const schools = DataStore.getSchoolsByZone(AppState.selectedZone);
            
            if (query === '') {
                resultsContainer.innerHTML = '';
                return;
            }
            
            const filteredSchools = schools.filter(school => 
                school.emis.toLowerCase().includes(query) || 
                school.name.toLowerCase().includes(query)
            );
            
            if (filteredSchools.length === 0) {
                resultsContainer.innerHTML = '<p class="no-data">No schools found with this EMIS number</p>';
                return;
            }
            
            resultsContainer.innerHTML = filteredSchools.map(school => `
                <div class="result-item" data-emis="${school.emis}" data-name="${school.name}" data-password="${school.password}">
                    <h3>${school.name}</h3>
                    <p>EMIS: ${school.emis}</p>
                </div>
            `).join('');
            
            document.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                    AppState.selectedSchool = {
                        emis: item.dataset.emis,
                        name: item.dataset.name,
                        password: item.dataset.password
                    };
                    SchoolPasswordScreen.init();
                    Screens.show('school-password-screen');
                });
            });
        });
    }
};

const SchoolPasswordScreen = {
    init() {
        const schoolDisplay = document.getElementById('school-name-display');
        const passwordInput = document.getElementById('school-password');
        const toggleBtn = document.getElementById('toggle-school-password');
        const loginBtn = document.getElementById('school-login-btn');
        const errorDisplay = document.getElementById('school-error');
        
        schoolDisplay.textContent = AppState.selectedSchool.name;
        passwordInput.value = '';
        errorDisplay.textContent = '';
        
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        });
        
        loginBtn.addEventListener('click', () => {
            if (passwordInput.value === AppState.selectedSchool.password) {
                errorDisplay.textContent = '';
                AppState.isSchoolLoggedIn = true;
                SchoolDashboard.init();
                Screens.show('school-dashboard-screen');
            } else {
                errorDisplay.textContent = 'Incorrect password. Please try again.';
                passwordInput.value = '';
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
};

const SchoolDashboard = {
    init() {
        const dashboardTitle = document.getElementById('dashboard-school-name');
        const logoutBtn = document.getElementById('logout-btn');
        const cards = document.querySelectorAll('.dashboard-card');
        
        dashboardTitle.textContent = AppState.selectedSchool.name;
        
        logoutBtn.addEventListener('click', () => {
            AppState.isSchoolLoggedIn = false;
            AppState.selectedSchool = null;
            Screens.show('district-password-screen');
        });
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                CategoryDataView.init(category);
                Screens.show('category-data-screen');
            });
        });
    }
};

const CategoryDataView = {
    init(category) {
        const categoryTitle = document.getElementById('category-title');
        const categoryContent = document.getElementById('category-content');
        const backBtn = document.getElementById('back-to-dashboard');
        
        const categoryNames = {
            'enrollment': 'Enrollment Data',
            'pslce': 'PSLCE Results',
            'particulars': 'School Particulars',
            'history': 'Upload History'
        };
        
        categoryTitle.textContent = categoryNames[category];
        
        let data = [];
        switch(category) {
            case 'enrollment':
                data = DataStore.getEnrollmentByEMIS(AppState.selectedSchool.emis);
                break;
            case 'pslce':
                data = DataStore.getPSLCEByEMIS(AppState.selectedSchool.emis);
                break;
            case 'particulars':
                data = DataStore.getParticularsByEMIS(AppState.selectedSchool.emis);
                break;
            case 'history':
                data = DataStore.getUploadHistory().filter(h => h.emis === AppState.selectedSchool.emis);
                break;
        }
        
        if (data.length === 0) {
            categoryContent.innerHTML = '<p class="no-data">No data available for this category</p>';
            return;
        }
        
        if (category === 'enrollment') {
            categoryContent.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>STD1 M</th>
                            <th>STD1 F</th>
                            <th>STD2 M</th>
                            <th>STD2 F</th>
                            <th>STD3 M</th>
                            <th>STD3 F</th>
                            <th>STD4 M</th>
                            <th>STD4 F</th>
                            <th>STD5 M</th>
                            <th>STD5 F</th>
                            <th>STD6 M</th>
                            <th>STD6 F</th>
                            <th>STD7 M</th>
                            <th>STD7 F</th>
                            <th>STD8 M</th>
                            <th>STD8 F</th>
                            <th>TOTAL M</th>
                            <th>TOTAL F</th>
                            <th>Date Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.year}</td>
                                <td>${item.std1m || 0}</td>
                                <td>${item.std1f || 0}</td>
                                <td>${item.std2m || 0}</td>
                                <td>${item.std2f || 0}</td>
                                <td>${item.std3m || 0}</td>
                                <td>${item.std3f || 0}</td>
                                <td>${item.std4m || 0}</td>
                                <td>${item.std4f || 0}</td>
                                <td>${item.std5m || 0}</td>
                                <td>${item.std5f || 0}</td>
                                <td>${item.std6m || 0}</td>
                                <td>${item.std6f || 0}</td>
                                <td>${item.std7m || 0}</td>
                                <td>${item.std7f || 0}</td>
                                <td>${item.std8m || 0}</td>
                                <td>${item.std8f || 0}</td>
                                <td>${item.totalM || 0}</td>
                                <td>${item.totalF || 0}</td>
                                <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <canvas id="enrollment-chart" style="margin-top: 30px; max-height: 400px;"></canvas>
            `;
            this.generateEnrollmentChart(data);
        } else if (category === 'pslce') {
            categoryContent.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>ENTERED M</th>
                            <th>ENTERED F</th>
                            <th>SAT M</th>
                            <th>SAT F</th>
                            <th>PASSED M</th>
                            <th>PASSED F</th>
                            <th>FAILED M</th>
                            <th>FAILED F</th>
                            <th>NAT SEC M</th>
                            <th>NAT SEC F</th>
                            <th>DIST SS M</th>
                            <th>DIST SS F</th>
                            <th>DAY SEC M</th>
                            <th>DAY SEC F</th>
                            <th>CDSS M</th>
                            <th>CDSS F</th>
                            <th>TOTAL SEL M</th>
                            <th>TOTAL SEL F</th>
                            <th>Date Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.year}</td>
                                <td>${item.enteredM || 0}</td>
                                <td>${item.enteredF || 0}</td>
                                <td>${item.satM || 0}</td>
                                <td>${item.satF || 0}</td>
                                <td>${item.passedM || 0}</td>
                                <td>${item.passedF || 0}</td>
                                <td>${item.failedM || 0}</td>
                                <td>${item.failedF || 0}</td>
                                <td>${item.nationalSecM || 0}</td>
                                <td>${item.nationalSecF || 0}</td>
                                <td>${item.districtSsM || 0}</td>
                                <td>${item.districtSsF || 0}</td>
                                <td>${item.daySecM || 0}</td>
                                <td>${item.daySecF || 0}</td>
                                <td>${item.cdssM || 0}</td>
                                <td>${item.cdssF || 0}</td>
                                <td>${item.totalSelectedM || 0}</td>
                                <td>${item.totalSelectedF || 0}</td>
                                <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <canvas id="pslce-chart" style="margin-top: 30px; max-height: 400px;"></canvas>
            `;
            this.generatePSLCEChart(data);
        } else if (category === 'particulars') {
            const school = DataStore.getSchoolByEMIS(AppState.selectedSchool.emis);
            const particulars = DataStore.getParticularsByEMIS(AppState.selectedSchool.emis);
            const latestParticulars = particulars.length > 0 ? particulars[particulars.length - 1] : null;
            
            if (school) {
                categoryContent.innerHTML = `
                    <div class="school-particulars-card">
                        <div class="particulars-section">
                            <h3>School Information</h3>
                            <div class="particulars-grid">
                                <div class="particular-item">
                                    <label>School Name</label>
                                    <p>${school.name}</p>
                                </div>
                                <div class="particular-item">
                                    <label>EMIS Number</label>
                                    <p>${school.emis}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Zone</label>
                                    <p>${school.zone}</p>
                                </div>
                                <div class="particular-item">
                                    <label>District Number</label>
                                    <p>${school.districtNumber || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Division Number</label>
                                    <p>${school.divisionNumber || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Constituency</label>
                                    <p>${school.constituency || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>T/A</label>
                                    <p>${school.ta || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Postal Address</label>
                                    <p>${school.postalAddress || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Distance From Nearest Public Primary School</label>
                                    <p>${school.distanceFromNearestPrimary ? school.distanceFromNearestPrimary + ' km' : 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Distance To TDC</label>
                                    <p>${school.distanceToTDC ? school.distanceToTDC + ' km' : 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Year Established</label>
                                    <p>${school.yearEstablished || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        ${latestParticulars ? `
                        <div class="particulars-section" style="margin-top: 30px;">
                            <h3>Contact Information</h3>
                            <div class="particulars-grid">
                                <div class="particular-item">
                                    <label>Headmaster</label>
                                    <p>${latestParticulars.headmaster || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Phone</label>
                                    <p>${latestParticulars.phone || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Email</label>
                                    <p>${latestParticulars.email || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Physical Address</label>
                                    <p>${latestParticulars.address || 'N/A'}</p>
                                </div>
                                <div class="particular-item">
                                    <label>Distance to the DEM's Office</label>
                                    <p>${latestParticulars.distanceDem ? latestParticulars.distanceDem + ' km' : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                `;
            } else {
                categoryContent.innerHTML = '<p class="no-data">School information not available</p>';
            }
        } else if (category === 'history') {
            categoryContent.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>EMIS</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.category}</td>
                                <td>${item.emis}</td>
                                <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
        
        backBtn.addEventListener('click', () => {
            Screens.show('school-dashboard-screen');
        });
    }
};

const AdminRecoveryScreen = {
    init() {
        const emailInput = document.getElementById('recovery-email');
        const verifyBtn = document.getElementById('verify-recovery-email');
        const resetBtn = document.getElementById('reset-admin-password');
        const errorDisplay = document.getElementById('recovery-error');
        const newPassDisplay = document.getElementById('new-admin-password');
        const copyNewPassBtn = document.getElementById('copy-new-password');
        const closeBtn = document.getElementById('close-recovery-modal');
        const backToLoginBtn = document.getElementById('back-to-admin-login');
        
        let newPassword = null;
        
        verifyBtn.addEventListener('click', () => {
            if (emailInput.value.toLowerCase() === AppState.recoveryEmail.toLowerCase()) {
                errorDisplay.textContent = '';
                emailInput.disabled = true;
                verifyBtn.style.display = 'none';
                resetBtn.style.display = 'block';
            } else {
                errorDisplay.textContent = 'Invalid recovery email';
            }
        });
        
        resetBtn.addEventListener('click', () => {
            newPassword = Config.adminPassword;
            AppState.adminPassword = newPassword;
            newPassDisplay.querySelector('span').textContent = newPassword;
            newPassDisplay.style.display = 'block';
            resetBtn.style.display = 'none';
            backToLoginBtn.style.display = 'block';
        });
        
        copyNewPassBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(newPassword);
            copyNewPassBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyNewPassBtn.textContent = 'Copy';
            }, 2000);
        });
        
        closeBtn.addEventListener('click', () => {
            Screens.show('district-password-screen');
        });
        
        backToLoginBtn.addEventListener('click', () => {
            Screens.show('admin-login-screen');
        });
        
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyBtn.click();
            }
        });
    }
};

const AdminPanel = {
    holdTimer: null,
    holdStartTime: null,
    progressInterval: null,
    isHolding: false,
    
    init() {
        this.initShortcutHandler();
        this.initAdminLogin();
        this.initAdminDashboard();
    },
    
    initShortcutHandler() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
                e.preventDefault();
                if (!this.isHolding) {
                    this.startHold();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isHolding) {
                if (!e.ctrlKey || !e.shiftKey || (e.key === 'M' || e.key === 'm')) {
                    this.cancelHold();
                }
            }
        });
    },
    
    startHold() {
        this.isHolding = true;
        this.holdStartTime = Date.now();
        const progressIndicator = document.getElementById('admin-progress-indicator');
        const progressBar = document.getElementById('admin-progress-bar');
        
        progressIndicator.classList.add('active');
        progressBar.style.width = '0%';
        
        let progress = 0;
        this.progressInterval = setInterval(() => {
            const elapsed = Date.now() - this.holdStartTime;
            progress = Math.min((elapsed / 3000) * 100, 100);
            progressBar.style.width = progress + '%';
        }, 50);
        
        this.holdTimer = setTimeout(() => {
            if (this.isHolding) {
                this.cancelHold();
                Screens.show('admin-login-screen');
            }
        }, 3000);
    },
    
    cancelHold() {
        this.isHolding = false;
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        const progressIndicator = document.getElementById('admin-progress-indicator');
        const progressBar = document.getElementById('admin-progress-bar');
        progressIndicator.classList.remove('active');
        progressBar.style.width = '0%';
    },
    
    initAdminLogin() {
        const closeBtn = document.getElementById('close-admin-modal');
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        const toggleBtn = document.getElementById('toggle-admin-password');
        const loginBtn = document.getElementById('admin-login-btn');
        const errorDisplay = document.getElementById('admin-error');
        const recoveryLink = document.getElementById('admin-recovery-link');
        
        closeBtn.addEventListener('click', () => {
            Screens.show(AppState.currentScreen === 'admin-login-screen' ? 'district-password-screen' : AppState.currentScreen);
        });
        
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                toggleBtn.textContent = '🙈';
            } else {
                passwordInput.type = 'password';
                toggleBtn.textContent = '👁️';
            }
        });
        
        loginBtn.addEventListener('click', () => {
            if (usernameInput.value === AppState.adminUsername && passwordInput.value === AppState.adminPassword) {
                errorDisplay.textContent = '';
                AppState.isAdminLoggedIn = true;
                usernameInput.value = '';
                passwordInput.value = '';
                this.loadAdminData();
                Screens.show('admin-dashboard-screen');
            } else {
                errorDisplay.textContent = 'Invalid username or password';
                passwordInput.value = '';
            }
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
        
        recoveryLink.addEventListener('click', () => {
            AdminRecoveryScreen.init();
            Screens.show('admin-recovery-screen');
        });
    },
    
    initAdminDashboard() {
        const logoutBtn = document.getElementById('admin-logout-btn');
        const tabs = document.querySelectorAll('.admin-tab');
        const panels = document.querySelectorAll('.admin-panel');
        
        logoutBtn.addEventListener('click', () => {
            AppState.isAdminLoggedIn = false;
            Screens.show('district-password-screen');
        });
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`admin-${tab.dataset.tab}`).classList.add('active');
            });
        });
        
        this.initZonesPanel();
        this.initSchoolsPanel();
        this.initEnrollmentPanel();
        this.initPSLCEPanel();
        this.initParticularsPanel();
        this.initHistoryPanel();
    },
    
    loadAdminData() {
        this.loadZones();
        this.loadSchools();
        this.loadEnrollment();
        this.loadPSLCE();
        this.loadParticulars();
        this.loadHistory();
        this.populateZoneSelect();
        this.populateYearSelects();
        this.populateSchoolSelects();
    },

    populateYearSelects() {
        const enrollmentYearSelect = document.getElementById('enrollment-year');
        const pslceYearSelect = document.getElementById('pslce-year');
        
        let yearOptions = '<option value="">Select Year</option>';
        for (let year = 2000; year <= 2080; year++) {
            yearOptions += `<option value="${year}">${year}</option>`;
        }
        
        if (enrollmentYearSelect) {
            enrollmentYearSelect.innerHTML = yearOptions;
        }
        if (pslceYearSelect) {
            pslceYearSelect.innerHTML = yearOptions;
        }
    },

    populateSchoolSelects() {
        const enrollmentSchoolSelect = document.getElementById('enrollment-school');
        const pslceSchoolSelect = document.getElementById('pslce-school');
        const schools = DataStore.getSchools();
        
        let schoolOptions = '<option value="">Select School</option>';
        schools.forEach(school => {
            schoolOptions += `<option value="${school.emis}">${school.name} (EMIS: ${school.emis})</option>`;
        });
        
        if (enrollmentSchoolSelect) {
            enrollmentSchoolSelect.innerHTML = schoolOptions;
            this.makeSearchable(enrollmentSchoolSelect);
        }
        if (pslceSchoolSelect) {
            pslceSchoolSelect.innerHTML = schoolOptions;
            this.makeSearchable(pslceSchoolSelect);
        }
    },

    makeSearchable(selectElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'searchable-select-wrapper';
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(selectElement);

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'searchable-select-input';
        searchInput.placeholder = 'Search...';
        wrapper.insertBefore(searchInput, selectElement);

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = selectElement.options;
            for (let i = 1; i < options.length; i++) {
                const option = options[i];
                const text = option.text.toLowerCase();
                option.style.display = text.includes(searchTerm) ? '' : 'none';
            }
        });
    },
    
    populateZoneSelect() {
        const zoneSelect = document.getElementById('new-school-zone');
        const zones = DataStore.getZones();
        zoneSelect.innerHTML = '<option value="">Select Zone</option>' + 
            zones.map(zone => `<option value="${zone.name}">${zone.name}</option>`).join('');
        this.makeSearchable(zoneSelect);
    },
    
    initZonesPanel() {
        const addBtn = document.getElementById('add-zone-btn');
        const zoneNameInput = document.getElementById('new-zone-name');
        
        addBtn.addEventListener('click', () => {
            const zoneName = zoneNameInput.value.trim();
            if (zoneName) {
                try {
                    DataStore.addZone(zoneName);
                    zoneNameInput.value = '';
                    this.loadZones();
                    this.populateZoneSelect();
                    this.showSuccess('Zone added successfully');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    },
    
    loadZones() {
        const zonesList = document.getElementById('zones-list');
        const zones = DataStore.getZones();
        
        zonesList.innerHTML = zones.map(zone => `
            <div class="list-item" data-id="${zone.id}">
                <div class="list-item-info">
                    <h4>${zone.name}</h4>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="AdminPanel.editZone(${zone.id})">Edit</button>
                    <button class="btn-delete" onclick="AdminPanel.deleteZone(${zone.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    deleteZone(id) {
        if (confirm('Are you sure you want to delete this zone?')) {
            DataStore.deleteRecord('zone', id);
            this.loadZones();
            this.populateZoneSelect();
        }
    },
    
    editZone(id) {
        const zones = DataStore.getZones();
        const zone = zones.find(z => z.id === id);
        if (zone) {
            const newName = prompt('Enter new zone name:', zone.name);
            if (newName && newName.trim()) {
                DataStore.editRecord('zone', id, { name: newName.trim() });
                this.loadZones();
                this.populateZoneSelect();
                this.showSuccess('Zone updated successfully');
            }
        }
    },
    
    initSchoolsPanel() {
        const addBtn = document.getElementById('add-school-btn');
        const emisInput = document.getElementById('new-school-emis');
        const nameInput = document.getElementById('new-school-name');
        const zoneSelect = document.getElementById('new-school-zone');
        const passwordInput = document.getElementById('new-school-password');
        const districtNumberInput = document.getElementById('new-school-district-number');
        const divisionNumberInput = document.getElementById('new-school-division-number');
        const constituencyInput = document.getElementById('new-school-constituency');
        const taInput = document.getElementById('new-school-ta');
        const postalAddressInput = document.getElementById('new-school-postal-address');
        const distancePrimaryInput = document.getElementById('new-school-distance-primary');
        const distanceTDCInput = document.getElementById('new-school-distance-tdc');
        const yearEstablishedInput = document.getElementById('new-school-year-established');
        
        addBtn.addEventListener('click', () => {
            const emis = emisInput.value.trim();
            const name = nameInput.value.trim();
            const zone = zoneSelect.value;
            const password = passwordInput.value.trim();
            const districtNumber = districtNumberInput.value.trim();
            const divisionNumber = divisionNumberInput.value.trim();
            const constituency = constituencyInput.value.trim();
            const ta = taInput.value.trim();
            const postalAddress = postalAddressInput.value.trim();
            const distanceFromNearestPrimary = distancePrimaryInput.value.trim();
            const distanceToTDC = distanceTDCInput.value.trim();
            const yearEstablished = yearEstablishedInput.value.trim();
            
            if (emis && name && zone && password) {
                try {
                    DataStore.addSchool(emis, name, zone, password, districtNumber, divisionNumber, constituency, ta, postalAddress, distanceFromNearestPrimary, distanceToTDC, yearEstablished);
                    emisInput.value = '';
                    nameInput.value = '';
                    zoneSelect.value = '';
                    passwordInput.value = '';
                    districtNumberInput.value = '';
                    divisionNumberInput.value = '';
                    constituencyInput.value = '';
                    taInput.value = '';
                    postalAddressInput.value = '';
                    distancePrimaryInput.value = '';
                    distanceTDCInput.value = '';
                    yearEstablishedInput.value = '';
                    this.loadSchools();
                    this.populateSchoolSelects();
                    this.showSuccess('School added successfully');
                } catch (error) {
                    alert(error.message);
                }
            }
        });
    },
    
    loadSchools() {
        const schoolsList = document.getElementById('schools-list');
        const schools = DataStore.getSchools();
        
        schoolsList.innerHTML = schools.map(school => `
            <div class="list-item" data-id="${school.id}">
                <div class="list-item-info">
                    <h4>${school.name}</h4>
                    <p>EMIS: ${school.emis} | Zone: ${school.zone}</p>
                    <p>Constituency: ${school.constituency || 'N/A'}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="AdminPanel.editSchool(${school.id})">Edit</button>
                    <button class="btn-delete" onclick="AdminPanel.deleteSchool(${school.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    deleteSchool(id) {
        if (confirm('Are you sure you want to delete this school?')) {
            DataStore.deleteRecord('school', id);
            this.loadSchools();
        }
    },
    
    editSchool(id) {
        const schools = DataStore.getSchools();
        const school = schools.find(s => s.id === id);
        if (school) {
            const newEmis = prompt('EMIS Number:', school.emis);
            if (newEmis === null) return;
            const newName = prompt('School Name:', school.name);
            if (newName === null) return;
            const newZone = prompt('Zone:', school.zone);
            if (newZone === null) return;
            const newPassword = prompt('School Password:', school.password);
            if (newPassword === null) return;
            const newDistrictNumber = prompt('District Number:', school.districtNumber || '');
            if (newDistrictNumber === null) return;
            const newDivisionNumber = prompt('Division Number:', school.divisionNumber || '');
            if (newDivisionNumber === null) return;
            const newConstituency = prompt('Constituency:', school.constituency || '');
            if (newConstituency === null) return;
            const newTa = prompt('T/A:', school.ta || '');
            if (newTa === null) return;
            const newPostalAddress = prompt('Postal Address:', school.postalAddress || '');
            if (newPostalAddress === null) return;
            const newDistancePrimary = prompt('Distance From Nearest Public Primary School (km):', school.distanceFromNearestPrimary || '');
            if (newDistancePrimary === null) return;
            const newDistanceTDC = prompt('Distance To TDC (km):', school.distanceToTDC || '');
            if (newDistanceTDC === null) return;
            const newYearEstablished = prompt('Year Established:', school.yearEstablished || '');
            if (newYearEstablished === null) return;
            
            DataStore.editRecord('school', id, {
                emis: newEmis.trim(),
                name: newName.trim(),
                zone: newZone.trim(),
                password: newPassword.trim(),
                districtNumber: newDistrictNumber.trim(),
                divisionNumber: newDivisionNumber.trim(),
                constituency: newConstituency.trim(),
                ta: newTa.trim(),
                postalAddress: newPostalAddress.trim(),
                distanceFromNearestPrimary: newDistancePrimary.trim(),
                distanceToTDC: newDistanceTDC.trim(),
                yearEstablished: newYearEstablished.trim()
            });
            this.loadSchools();
            this.showSuccess('School updated successfully');
        }
    },
    
    initEnrollmentPanel() {
        const uploadBtn = document.getElementById('upload-enrollment-btn');
        
        uploadBtn.addEventListener('click', () => {
            const schoolEmis = document.getElementById('enrollment-school').value.trim();
            const year = document.getElementById('enrollment-year').value.trim();
            
            const std1m = document.getElementById('enrollment-std1m').value.trim();
            const std1f = document.getElementById('enrollment-std1f').value.trim();
            const std2m = document.getElementById('enrollment-std2m').value.trim();
            const std2f = document.getElementById('enrollment-std2f').value.trim();
            const std3m = document.getElementById('enrollment-std3m').value.trim();
            const std3f = document.getElementById('enrollment-std3f').value.trim();
            const std4m = document.getElementById('enrollment-std4m').value.trim();
            const std4f = document.getElementById('enrollment-std4f').value.trim();
            const std5m = document.getElementById('enrollment-std5m').value.trim();
            const std5f = document.getElementById('enrollment-std5f').value.trim();
            const std6m = document.getElementById('enrollment-std6m').value.trim();
            const std6f = document.getElementById('enrollment-std6f').value.trim();
            const std7m = document.getElementById('enrollment-std7m').value.trim();
            const std7f = document.getElementById('enrollment-std7f').value.trim();
            const std8m = document.getElementById('enrollment-std8m').value.trim();
            const std8f = document.getElementById('enrollment-std8f').value.trim();
            
            if (schoolEmis && year) {
                const totalM = (parseInt(std1m) || 0) + (parseInt(std2m) || 0) + (parseInt(std3m) || 0) + 
                               (parseInt(std4m) || 0) + (parseInt(std5m) || 0) + (parseInt(std6m) || 0) + 
                               (parseInt(std7m) || 0) + (parseInt(std8m) || 0);
                const totalF = (parseInt(std1f) || 0) + (parseInt(std2f) || 0) + (parseInt(std3f) || 0) + 
                               (parseInt(std4f) || 0) + (parseInt(std5f) || 0) + (parseInt(std6f) || 0) + 
                               (parseInt(std7f) || 0) + (parseInt(std8f) || 0);
                
                DataStore.addEnrollment({ 
                    emis: schoolEmis, 
                    year,
                    std1m, std1f,
                    std2m, std2f,
                    std3m, std3f,
                    std4m, std4f,
                    std5m, std5f,
                    std6m, std6f,
                    std7m, std7f,
                    std8m, std8f,
                    totalM, totalF
                });
                
                document.getElementById('enrollment-school').value = '';
                document.getElementById('enrollment-year').value = '';
                document.getElementById('enrollment-std1m').value = '';
                document.getElementById('enrollment-std1f').value = '';
                document.getElementById('enrollment-std2m').value = '';
                document.getElementById('enrollment-std2f').value = '';
                document.getElementById('enrollment-std3m').value = '';
                document.getElementById('enrollment-std3f').value = '';
                document.getElementById('enrollment-std4m').value = '';
                document.getElementById('enrollment-std4f').value = '';
                document.getElementById('enrollment-std5m').value = '';
                document.getElementById('enrollment-std5f').value = '';
                document.getElementById('enrollment-std6m').value = '';
                document.getElementById('enrollment-std6f').value = '';
                document.getElementById('enrollment-std7m').value = '';
                document.getElementById('enrollment-std7f').value = '';
                document.getElementById('enrollment-std8m').value = '';
                document.getElementById('enrollment-std8f').value = '';
                
                this.loadEnrollment();
                this.showSuccess('Enrollment data uploaded successfully');
            }
        });
    },
    
    loadEnrollment() {
        const enrollmentList = document.getElementById('enrollment-list');
        const enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        
        enrollmentList.innerHTML = enrollment.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="list-item-info">
                    <h4>${item.schoolName || item.emis} | Year: ${item.year}</h4>
                    <p>Zone: ${item.zone || 'N/A'}</p>
                    <p>Total M: ${item.totalM || 0} | Total F: ${item.totalF || 0}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="AdminPanel.editEnrollment(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="AdminPanel.deleteEnrollment(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    deleteEnrollment(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            DataStore.deleteRecord('enrollment', id);
            this.loadEnrollment();
        }
    },
    
    editEnrollment(id) {
        const enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        const item = enrollment.find(e => e.id === id);
        if (item) {
            const newEmis = prompt('EMIS Number:', item.emis);
            if (newEmis === null) return;
            const newMale = prompt('Male Students:', item.male);
            if (newMale === null) return;
            const newFemale = prompt('Female Students:', item.female);
            if (newFemale === null) return;
            const newTotal = prompt('Total Students:', item.total);
            if (newTotal === null) return;
            const newYear = prompt('Academic Year:', item.year);
            if (newYear === null) return;
            
            DataStore.editRecord('enrollment', id, {
                emis: newEmis.trim(),
                male: newMale.trim(),
                female: newFemale.trim(),
                total: newTotal.trim(),
                year: newYear.trim()
            });
            this.loadEnrollment();
            this.showSuccess('Enrollment data updated successfully');
        }
    },
    
    initPSLCEPanel() {
        const uploadBtn = document.getElementById('upload-pslce-btn');
        
        uploadBtn.addEventListener('click', () => {
            const schoolEmis = document.getElementById('pslce-school').value.trim();
            const year = document.getElementById('pslce-year').value.trim();
            
            const enteredM = document.getElementById('pslce-entered-m').value.trim();
            const enteredF = document.getElementById('pslce-entered-f').value.trim();
            const satM = document.getElementById('pslce-sat-m').value.trim();
            const satF = document.getElementById('pslce-sat-f').value.trim();
            const passedM = document.getElementById('pslce-passed-m').value.trim();
            const passedF = document.getElementById('pslce-passed-f').value.trim();
            const failedM = document.getElementById('pslce-failed-m').value.trim();
            const failedF = document.getElementById('pslce-failed-f').value.trim();
            const nationalSecM = document.getElementById('pslce-national-sec-m').value.trim();
            const nationalSecF = document.getElementById('pslce-national-sec-f').value.trim();
            const districtSsM = document.getElementById('pslce-district-ss-m').value.trim();
            const districtSsF = document.getElementById('pslce-district-ss-f').value.trim();
            const daySecM = document.getElementById('pslce-day-sec-m').value.trim();
            const daySecF = document.getElementById('pslce-day-sec-f').value.trim();
            const cdssM = document.getElementById('pslce-cdss-m').value.trim();
            const cdssF = document.getElementById('pslce-cdss-f').value.trim();
            const totalSelectedM = document.getElementById('pslce-total-selected-m').value.trim();
            const totalSelectedF = document.getElementById('pslce-total-selected-f').value.trim();
            
            if (schoolEmis && year) {
                DataStore.addPSLCEResult({ 
                    emis: schoolEmis, 
                    year,
                    enteredM, enteredF,
                    satM, satF,
                    passedM, passedF,
                    failedM, failedF,
                    nationalSecM, nationalSecF,
                    districtSsM, districtSsF,
                    daySecM, daySecF,
                    cdssM, cdssF,
                    totalSelectedM, totalSelectedF
                });
                
                document.getElementById('pslce-school').value = '';
                document.getElementById('pslce-year').value = '';
                document.getElementById('pslce-entered-m').value = '';
                document.getElementById('pslce-entered-f').value = '';
                document.getElementById('pslce-sat-m').value = '';
                document.getElementById('pslce-sat-f').value = '';
                document.getElementById('pslce-passed-m').value = '';
                document.getElementById('pslce-passed-f').value = '';
                document.getElementById('pslce-failed-m').value = '';
                document.getElementById('pslce-failed-f').value = '';
                document.getElementById('pslce-national-sec-m').value = '';
                document.getElementById('pslce-national-sec-f').value = '';
                document.getElementById('pslce-district-ss-m').value = '';
                document.getElementById('pslce-district-ss-f').value = '';
                document.getElementById('pslce-day-sec-m').value = '';
                document.getElementById('pslce-day-sec-f').value = '';
                document.getElementById('pslce-cdss-m').value = '';
                document.getElementById('pslce-cdss-f').value = '';
                document.getElementById('pslce-total-selected-m').value = '';
                document.getElementById('pslce-total-selected-f').value = '';
                
                this.loadPSLCE();
                this.showSuccess('PSLCE results uploaded successfully');
            }
        });
    },
    
    loadPSLCE() {
        const pslceList = document.getElementById('pslce-list');
        const pslce = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        
        pslceList.innerHTML = pslce.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="list-item-info">
                    <h4>${item.schoolName || item.emis} | Year: ${item.year}</h4>
                    <p>Zone: ${item.zone || 'N/A'}</p>
                    <p>Total Selected M: ${item.totalSelectedM || 0} | Total Selected F: ${item.totalSelectedF || 0}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="AdminPanel.editPSLCE(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="AdminPanel.deletePSLCE(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    deletePSLCE(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            DataStore.deleteRecord('pslce', id);
            this.loadPSLCE();
        }
    },
    
    editPSLCE(id) {
        const pslce = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        const item = pslce.find(p => p.id === id);
        if (item) {
            const newEmis = prompt('EMIS Number:', item.emis);
            if (newEmis === null) return;
            const newCandidates = prompt('Number of Candidates:', item.candidates);
            if (newCandidates === null) return;
            const newPassed = prompt('Number Passed:', item.passed);
            if (newPassed === null) return;
            const newFailed = prompt('Number Failed:', item.failed);
            if (newFailed === null) return;
            const newYear = prompt('Examination Year:', item.year);
            if (newYear === null) return;
            
            DataStore.editRecord('pslce', id, {
                emis: newEmis.trim(),
                candidates: newCandidates.trim(),
                passed: newPassed.trim(),
                failed: newFailed.trim(),
                year: newYear.trim()
            });
            this.loadPSLCE();
            this.showSuccess('PSLCE results updated successfully');
        }
    },
    
    initParticularsPanel() {
        const uploadBtn = document.getElementById('upload-particulars-btn');
        
        uploadBtn.addEventListener('click', () => {
            const emis = document.getElementById('particulars-emis').value.trim();
            const headmaster = document.getElementById('particulars-headmaster').value.trim();
            const phone = document.getElementById('particulars-phone').value.trim();
            const email = document.getElementById('particulars-email').value.trim();
            const address = document.getElementById('particulars-address').value.trim();
            const distanceDem = document.getElementById('particulars-distance-dem').value.trim();
            
            if (emis && headmaster && phone && email && address) {
                DataStore.addSchoolParticulars({ emis, headmaster, phone, email, address, distanceDem });
                document.getElementById('particulars-emis').value = '';
                document.getElementById('particulars-headmaster').value = '';
                document.getElementById('particulars-phone').value = '';
                document.getElementById('particulars-email').value = '';
                document.getElementById('particulars-address').value = '';
                document.getElementById('particulars-distance-dem').value = '';
                this.loadParticulars();
                this.showSuccess('School particulars uploaded successfully');
            }
        });
    },
    
    loadParticulars() {
        const particularsList = document.getElementById('particulars-list');
        const particulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        
        particularsList.innerHTML = particulars.map(item => `
            <div class="list-item" data-id="${item.id}">
                <div class="list-item-info">
                    <h4>EMIS: ${item.emis} | Headmaster: ${item.headmaster}</h4>
                    <p>Phone: ${item.phone} | Email: ${item.email}</p>
                </div>
                <div class="list-item-actions">
                    <button class="btn-edit" onclick="AdminPanel.editParticulars(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="AdminPanel.deleteParticulars(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');
    },
    
    deleteParticulars(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            DataStore.deleteRecord('particulars', id);
            this.loadParticulars();
        }
    },
    
    editParticulars(id) {
        const particulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        const item = particulars.find(p => p.id === id);
        if (item) {
            const newEmis = prompt('EMIS Number:', item.emis);
            if (newEmis === null) return;
            const newHeadmaster = prompt('Headmaster Name:', item.headmaster);
            if (newHeadmaster === null) return;
            const newPhone = prompt('Phone Number:', item.phone);
            if (newPhone === null) return;
            const newEmail = prompt('Email Address:', item.email);
            if (newEmail === null) return;
            const newAddress = prompt('Physical Address:', item.address);
            if (newAddress === null) return;
            
            DataStore.editRecord('particulars', id, {
                emis: newEmis.trim(),
                headmaster: newHeadmaster.trim(),
                phone: newPhone.trim(),
                email: newEmail.trim(),
                address: newAddress.trim()
            });
            this.loadParticulars();
            this.showSuccess('School particulars updated successfully');
        }
    },
    
    initHistoryPanel() {
        this.loadHistory();
    },
    
    loadHistory() {
        const historyList = document.getElementById('history-list');
        const history = DataStore.getUploadHistory();
        
        historyList.innerHTML = history.map(item => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${item.category}</h4>
                    <p>EMIS: ${item.emis} | Date: ${new Date(item.timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
    },
    
    showSuccess(message) {
        const popup = document.getElementById('success-popup');
        const messageDisplay = document.getElementById('success-message');
        messageDisplay.textContent = message;
        popup.classList.add('active');
        setTimeout(() => {
            popup.classList.remove('active');
        }, 3000);
    },

    generateEnrollmentChart(data) {
        const ctx = document.getElementById('enrollment-chart');
        if (!ctx || data.length === 0) return;

        const sortedData = [...data].sort((a, b) => a.year - b.year);
        const years = sortedData.map(d => d.year);
        const totalM = sortedData.map(d => parseInt(d.totalM) || 0);
        const totalF = sortedData.map(d => parseInt(d.totalF) || 0);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Total Male',
                        data: totalM,
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Total Female',
                        data: totalF,
                        borderColor: 'rgba(118, 75, 162, 1)',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Enrollment Trends by Year',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    },

    generatePSLCEChart(data) {
        const ctx = document.getElementById('pslce-chart');
        if (!ctx || data.length === 0) return;

        const sortedData = [...data].sort((a, b) => a.year - b.year);
        const years = sortedData.map(d => d.year);
        const totalSelectedM = sortedData.map(d => parseInt(d.totalSelectedM) || 0);
        const totalSelectedF = sortedData.map(d => parseInt(d.totalSelectedF) || 0);

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Total Selected Male',
                        data: totalSelectedM,
                        borderColor: 'rgba(102, 126, 234, 1)',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Total Selected Female',
                        data: totalSelectedF,
                        borderColor: 'rgba(118, 75, 162, 1)',
                        backgroundColor: 'rgba(118, 75, 162, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    },
                    title: {
                        display: true,
                        text: 'PSLCE Selection Trends by Year',
                        color: 'white',
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Clear all localStorage data to start fresh
    localStorage.removeItem('mzimba_zones');
    localStorage.removeItem('mzimba_schools');
    localStorage.removeItem('mzimba_enrollment');
    localStorage.removeItem('mzimba_pslce');
    localStorage.removeItem('mzimba_particulars');
    localStorage.removeItem('mzimba_uploads');
    
    Screens.init();
    SplashScreen.init();
    DistrictPasswordScreen.init();
    ZoneSearchScreen.init();
    AdminPanel.init();
});
