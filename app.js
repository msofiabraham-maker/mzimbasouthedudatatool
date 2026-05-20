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

const ZoneSearchScreen = {
    init() {
        const searchInput = document.getElementById('zone-search');
        const resultsContainer = document.getElementById('zone-results');

        const renderZones = (zones) => {
            if (!resultsContainer) return;
            if (!zones || zones.length === 0) {
                resultsContainer.innerHTML = '<p class="no-data">No zones found</p>';
                return;
            }
            resultsContainer.innerHTML = zones.map(zone => `
                <div class="result-item" data-zone="${zone}">
                    <h3>${zone}</h3>
                </div>
            `).join('');
            resultsContainer.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                        AppState.selectedZone = item.dataset.zone;
                    Screens.show('emis-search-screen');
                    if (typeof EmisSearchScreen !== 'undefined') {
                        EmisSearchScreen.refresh();
                    }
                });
            });
        };

        const loadZones = () => {
            const zones = DataStore.getZones().map(z => z.name).filter(Boolean);
            renderZones(zones);
        };

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const query = searchInput.value.trim().toLowerCase();
                const zones = DataStore.getZones()
                    .map(z => z.name)
                    .filter(Boolean)
                    .filter(name => name.toLowerCase().includes(query));
                renderZones(zones);
            });
        }

        loadZones();
    }
};

const EmisSearchScreen = {
    init() {
        this.searchInput = document.getElementById('emis-search');
        this.resultsContainer = document.getElementById('emis-results');
        this.selectedZoneDisplay = document.getElementById('selected-zone-display');

        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.renderResults());
        }

        this.refresh();
    },

    refresh() {
        if (this.selectedZoneDisplay) {
            this.selectedZoneDisplay.textContent = AppState.selectedZone ? `Selected Zone: ${AppState.selectedZone}` : '';
        }
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.renderResults();
    },

    renderResults() {
        if (!this.resultsContainer) return;

        const query = this.searchInput?.value.trim().toLowerCase() || '';
        const allSchools = AppState.selectedZone ? DataStore.getSchoolsByZone(AppState.selectedZone) : DataStore.getSchools();
        const filtered = allSchools.filter(school => {
            const emis = String(school.emis || '').toLowerCase();
            const name = String(school.name || '').toLowerCase();
            return !query || emis.includes(query) || name.includes(query);
        });

        if (filtered.length === 0) {
            this.resultsContainer.innerHTML = '<p class="no-data">No schools found in this zone</p>';
            return;
        }

        this.resultsContainer.innerHTML = filtered.map(school => `
            <div class="result-item" data-emis="${school.emis}" data-name="${school.name}" data-password="${school.password}">
                <h3>${school.name}</h3>
                <p>EMIS: ${school.emis}</p>
            </div>
        `).join('');

        this.resultsContainer.querySelectorAll('.result-item').forEach(item => {
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
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const totals = {
                std1m: data.reduce((sum, item) => sum + (parseInt(item.std1m) || 0), 0),
                std1f: data.reduce((sum, item) => sum + (parseInt(item.std1f) || 0), 0),
                std2m: data.reduce((sum, item) => sum + (parseInt(item.std2m) || 0), 0),
                std2f: data.reduce((sum, item) => sum + (parseInt(item.std2f) || 0), 0),
                std3m: data.reduce((sum, item) => sum + (parseInt(item.std3m) || 0), 0),
                std3f: data.reduce((sum, item) => sum + (parseInt(item.std3f) || 0), 0),
                std4m: data.reduce((sum, item) => sum + (parseInt(item.std4m) || 0), 0),
                std4f: data.reduce((sum, item) => sum + (parseInt(item.std4f) || 0), 0),
                std5m: data.reduce((sum, item) => sum + (parseInt(item.std5m) || 0), 0),
                std5f: data.reduce((sum, item) => sum + (parseInt(item.std5f) || 0), 0),
                std6m: data.reduce((sum, item) => sum + (parseInt(item.std6m) || 0), 0),
                std6f: data.reduce((sum, item) => sum + (parseInt(item.std6f) || 0), 0),
                std7m: data.reduce((sum, item) => sum + (parseInt(item.std7m) || 0), 0),
                std7f: data.reduce((sum, item) => sum + (parseInt(item.std7f) || 0), 0),
                std8m: data.reduce((sum, item) => sum + (parseInt(item.std8m) || 0), 0),
                std8f: data.reduce((sum, item) => sum + (parseInt(item.std8f) || 0), 0),
                totalM: data.reduce((sum, item) => sum + (parseInt(item.totalM) || 0), 0),
                totalF: data.reduce((sum, item) => sum + (parseInt(item.totalF) || 0), 0)
            };
            categoryContent.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name of School</th>
                            <th>EMIS Number</th>
                            <th>Zone</th>
                            <th>Year</th>
                            <th>STD1M</th>
                            <th>STD1F</th>
                            <th>STD2M</th>
                            <th>STD2F</th>
                            <th>STD3M</th>
                            <th>STD3F</th>
                            <th>STD4M</th>
                            <th>STD4F</th>
                            <th>STD5M</th>
                            <th>STD5F</th>
                            <th>STD6M</th>
                            <th>STD6F</th>
                            <th>STD7M</th>
                            <th>STD7F</th>
                            <th>STD8M</th>
                            <th>STD8F</th>
                            <th>TOTAL M</th>
                            <th>TOTAL F</th>
                            <th>Date Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.schoolName || 'N/A'}</td>
                                <td>${item.emis}</td>
                                <td>${item.zone || 'N/A'}</td>
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
                    <tfoot>
                        <tr>
                            <td colspan="4"><strong>Totals</strong></td>
                            <td>${totals.std1m}</td>
                            <td>${totals.std1f}</td>
                            <td>${totals.std2m}</td>
                            <td>${totals.std2f}</td>
                            <td>${totals.std3m}</td>
                            <td>${totals.std3f}</td>
                            <td>${totals.std4m}</td>
                            <td>${totals.std4f}</td>
                            <td>${totals.std5m}</td>
                            <td>${totals.std5f}</td>
                            <td>${totals.std6m}</td>
                            <td>${totals.std6f}</td>
                            <td>${totals.std7m}</td>
                            <td>${totals.std7f}</td>
                            <td>${totals.std8m}</td>
                            <td>${totals.std8f}</td>
                            <td>${totals.totalM}</td>
                            <td>${totals.totalF}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <canvas id="enrollment-chart" style="margin-top: 30px; max-height: 400px;"></canvas>
            `;
            AdminPanel.generateEnrollmentChart(data);
        } else if (category === 'pslce') {
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const totals = {
                enteredM: data.reduce((sum, item) => sum + (parseInt(item.enteredM) || 0), 0),
                enteredF: data.reduce((sum, item) => sum + (parseInt(item.enteredF) || 0), 0),
                satM: data.reduce((sum, item) => sum + (parseInt(item.satM) || 0), 0),
                satF: data.reduce((sum, item) => sum + (parseInt(item.satF) || 0), 0),
                passedM: data.reduce((sum, item) => sum + (parseInt(item.passedM) || 0), 0),
                passedF: data.reduce((sum, item) => sum + (parseInt(item.passedF) || 0), 0),
                failedM: data.reduce((sum, item) => sum + (parseInt(item.failedM) || 0), 0),
                failedF: data.reduce((sum, item) => sum + (parseInt(item.failedF) || 0), 0),
                nationalSecM: data.reduce((sum, item) => sum + (parseInt(item.nationalSecM) || 0), 0),
                nationalSecF: data.reduce((sum, item) => sum + (parseInt(item.nationalSecF) || 0), 0),
                districtSsM: data.reduce((sum, item) => sum + (parseInt(item.districtSsM) || 0), 0),
                districtSsF: data.reduce((sum, item) => sum + (parseInt(item.districtSsF) || 0), 0),
                daySecM: data.reduce((sum, item) => sum + (parseInt(item.daySecM) || 0), 0),
                daySecF: data.reduce((sum, item) => sum + (parseInt(item.daySecF) || 0), 0),
                cdssM: data.reduce((sum, item) => sum + (parseInt(item.cdssM) || 0), 0),
                cdssF: data.reduce((sum, item) => sum + (parseInt(item.cdssF) || 0), 0),
                totalSelectedM: data.reduce((sum, item) => sum + (parseInt(item.totalSelectedM) || 0), 0),
                totalSelectedF: data.reduce((sum, item) => sum + (parseInt(item.totalSelectedF) || 0), 0)
            };
            categoryContent.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name of School</th>
                            <th>EMIS Number</th>
                            <th>Zone</th>
                            <th>Year</th>
                            <th>ENTERED M</th>
                            <th>ENTERED F</th>
                            <th>SAT M</th>
                            <th>SAT F</th>
                            <th>PASSED M</th>
                            <th>PASSED F</th>
                            <th>FAILED M</th>
                            <th>FAILED F</th>
                            <th>NATIONAL SEC SCHOOL M</th>
                            <th>NATIONAL SEC SCHOOL F</th>
                            <th>DISTRICT SS M</th>
                            <th>DISTRICT SS F</th>
                            <th>DAY SEC SCHOOL M</th>
                            <th>DAY SEC SCHOOL F</th>
                            <th>CDSS M</th>
                            <th>CDSS F</th>
                            <th>TOTAL SELECTED M</th>
                            <th>TOTAL SELECTED F</th>
                            <th>Date Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.schoolName || 'N/A'}</td>
                                <td>${item.emis}</td>
                                <td>${item.zone || 'N/A'}</td>
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
                    <tfoot>
                        <tr>
                            <td colspan="4"><strong>Totals</strong></td>
                            <td>${totals.enteredM}</td>
                            <td>${totals.enteredF}</td>
                            <td>${totals.satM}</td>
                            <td>${totals.satF}</td>
                            <td>${totals.passedM}</td>
                            <td>${totals.passedF}</td>
                            <td>${totals.failedM}</td>
                            <td>${totals.failedF}</td>
                            <td>${totals.nationalSecM}</td>
                            <td>${totals.nationalSecF}</td>
                            <td>${totals.districtSsM}</td>
                            <td>${totals.districtSsF}</td>
                            <td>${totals.daySecM}</td>
                            <td>${totals.daySecF}</td>
                            <td>${totals.cdssM}</td>
                            <td>${totals.cdssF}</td>
                            <td>${totals.totalSelectedM}</td>
                            <td>${totals.totalSelectedF}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                <canvas id="pslce-chart" style="margin-top: 30px; max-height: 400px;"></canvas>
            `;
            AdminPanel.generatePSLCEChart(data);
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
                                    <label>Distance to the DEM's Office</label>
                                    <p>${school.distanceToDEM ? school.distanceToDEM + ' km' : 'N/A'}</p>
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

        // Allow both search and scroll
        let isSearching = false;
        
        searchInput.addEventListener('input', (e) => {
            isSearching = e.target.value.length > 0;
            const searchTerm = e.target.value.toLowerCase();
            const options = selectElement.options;
            let visibleCount = 0;
            
            for (let i = 1; i < options.length; i++) {
                const option = options[i];
                const text = option.text.toLowerCase();
                if (text.includes(searchTerm)) {
                    option.style.display = '';
                    visibleCount++;
                } else {
                    option.style.display = 'none';
                }
            }
            
            // If search returns results, auto-select the first match
            if (isSearching && visibleCount > 0) {
                for (let i = 1; i < options.length; i++) {
                    if (options[i].style.display !== 'none') {
                        selectElement.value = options[i].value;
                        break;
                    }
                }
            }
        });
        
        // Clear search on select
        selectElement.addEventListener('change', () => {
            if (!isSearching) {
                searchInput.value = '';
            }
        });
        
        // Allow manual text input in search box
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                selectElement.focus();
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
        
        addBtn.addEventListener('click', async () => {
            const zoneName = zoneNameInput.value.trim();
            if (zoneName) {
                try {
                    await DataStore.addZone(zoneName);
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
    
    async deleteZone(id) {
        if (confirm('Are you sure you want to delete this zone?')) {
            await DataStore.deleteRecord('zone', id);
            this.loadZones();
            this.populateZoneSelect();
        }
    },
    
    async editZone(id) {
        const zones = DataStore.getZones();
        const zone = zones.find(z => z.id === id);
        if (zone) {
            const newName = prompt('Enter new zone name:', zone.name);
            if (newName && newName.trim()) {
                await DataStore.editRecord('zone', id, { name: newName.trim() });
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
        const distanceDemInput = document.getElementById('new-school-distance-dem');
        const yearEstablishedInput = document.getElementById('new-school-year-established');
        
        addBtn.addEventListener('click', async () => {
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
            const distanceToDEM = distanceDemInput.value.trim();
            const yearEstablished = yearEstablishedInput.value.trim();
            
            if (emis && name && zone && password) {
                try {
                    await DataStore.addSchool(emis, name, zone, password, districtNumber, divisionNumber, constituency, ta, postalAddress, distanceFromNearestPrimary, distanceToTDC, distanceToDEM, yearEstablished);
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
                    distanceDemInput.value = '';
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
    
    async deleteSchool(id) {
        if (confirm('Are you sure you want to delete this school?')) {
            await DataStore.deleteRecord('school', id);
            this.loadSchools();
        }
    },
    
    async editSchool(id) {
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
            const newDistanceDEM = prompt("Distance to the DEM's Office (km):", school.distanceToDEM || '');
            if (newDistanceDEM === null) return;
            const newYearEstablished = prompt('Year Established:', school.yearEstablished || '');
            if (newYearEstablished === null) return;
            
            await DataStore.editRecord('school', id, {
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
                distanceToDEM: newDistanceDEM.trim(),
                yearEstablished: newYearEstablished.trim()
            });
            this.loadSchools();
            this.showSuccess('School updated successfully');
        }
    },
    
    initEnrollmentPanel() {
        const uploadBtn = document.getElementById('upload-enrollment-btn');
        const stdFields = [
            'enrollment-std1m', 'enrollment-std1f',
            'enrollment-std2m', 'enrollment-std2f',
            'enrollment-std3m', 'enrollment-std3f',
            'enrollment-std4m', 'enrollment-std4f',
            'enrollment-std5m', 'enrollment-std5f',
            'enrollment-std6m', 'enrollment-std6f',
            'enrollment-std7m', 'enrollment-std7f',
            'enrollment-std8m', 'enrollment-std8f'
        ];
        
        // Add auto-calculation listeners
        stdFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('input', () => this.calculateEnrollmentTotals());
            }
        });
        
        uploadBtn.addEventListener('click', async () => {
            const schoolEmis = document.getElementById('enrollment-school').value.trim();
            const year = document.getElementById('enrollment-year').value.trim();
            
            if (!schoolEmis || !year) {
                alert('Please select both school and year');
                return;
            }
            
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
                try {
                const totalM = (parseInt(std1m) || 0) + (parseInt(std2m) || 0) + (parseInt(std3m) || 0) + 
                               (parseInt(std4m) || 0) + (parseInt(std5m) || 0) + (parseInt(std6m) || 0) + 
                               (parseInt(std7m) || 0) + (parseInt(std8m) || 0);
                const totalF = (parseInt(std1f) || 0) + (parseInt(std2f) || 0) + (parseInt(std3f) || 0) + 
                               (parseInt(std4f) || 0) + (parseInt(std5f) || 0) + (parseInt(std6f) || 0) + 
                               (parseInt(std7f) || 0) + (parseInt(std8f) || 0);
                
                await DataStore.addEnrollment({ 
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
                document.getElementById('enrollment-total-m-display').textContent = '0';
                document.getElementById('enrollment-total-f-display').textContent = '0';
                
                this.loadEnrollment();
                this.showSuccess('Enrollment data uploaded successfully');
                } catch (err) {
                    alert(err.message || err);
                }
            }
        });
    },
    
    calculateEnrollmentTotals() {
        const stdFields = [
            ['enrollment-std1m', 'enrollment-std1f'],
            ['enrollment-std2m', 'enrollment-std2f'],
            ['enrollment-std3m', 'enrollment-std3f'],
            ['enrollment-std4m', 'enrollment-std4f'],
            ['enrollment-std5m', 'enrollment-std5f'],
            ['enrollment-std6m', 'enrollment-std6f'],
            ['enrollment-std7m', 'enrollment-std7f'],
            ['enrollment-std8m', 'enrollment-std8f']
        ];
        
        let totalM = 0, totalF = 0;
        stdFields.forEach(([maleId, femaleId]) => {
            totalM += parseInt(document.getElementById(maleId).value) || 0;
            totalF += parseInt(document.getElementById(femaleId).value) || 0;
        });
        
        document.getElementById('enrollment-total-m-display').textContent = totalM;
        document.getElementById('enrollment-total-f-display').textContent = totalF;
    },
    
    loadEnrollment() {
        const enrollmentList = document.getElementById('enrollment-list');
        const enrollment = DataStore.getEnrollment();
        
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
    
    async deleteEnrollment(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            await DataStore.deleteRecord('enrollment', id);
            this.loadEnrollment();
        }
    },
    
    editEnrollment(id) {
        const enrollment = DataStore.getEnrollment();
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
        const schoolFields = [
            'pslce-national-sec-m', 'pslce-national-sec-f',
            'pslce-district-ss-m', 'pslce-district-ss-f',
            'pslce-day-sec-m', 'pslce-day-sec-f',
            'pslce-cdss-m', 'pslce-cdss-f'
        ];
        
        // Add auto-calculation listeners
        schoolFields.forEach(fieldId => {
            const input = document.getElementById(fieldId);
            if (input) {
                input.addEventListener('input', () => this.calculatePSLCETotals());
            }
        });
        
        uploadBtn.addEventListener('click', async () => {
            const schoolEmis = document.getElementById('pslce-school').value.trim();
            const year = document.getElementById('pslce-year').value.trim();
            
            if (!schoolEmis || !year) {
                alert('Please select both school and year');
                return;
            }
            
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
            
            if (schoolEmis && year) {
                try {
                    const totalSelectedM = (parseInt(nationalSecM) || 0) + (parseInt(districtSsM) || 0) + 
                                          (parseInt(daySecM) || 0) + (parseInt(cdssM) || 0);
                    const totalSelectedF = (parseInt(nationalSecF) || 0) + (parseInt(districtSsF) || 0) + 
                                          (parseInt(daySecF) || 0) + (parseInt(cdssF) || 0);
                    
                    await DataStore.addPSLCEResult({ 
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
                    document.getElementById('pslce-total-selected-m-display').textContent = '0';
                    document.getElementById('pslce-total-selected-f-display').textContent = '0';
                    
                    this.loadPSLCE();
                    this.showSuccess('PSLCE results uploaded successfully');
                } catch (err) {
                    alert(err.message || err);
                }
            }
        });
    },
    
    calculatePSLCETotals() {
        const nationalSecM = parseInt(document.getElementById('pslce-national-sec-m').value) || 0;
        const nationalSecF = parseInt(document.getElementById('pslce-national-sec-f').value) || 0;
        const districtSsM = parseInt(document.getElementById('pslce-district-ss-m').value) || 0;
        const districtSsF = parseInt(document.getElementById('pslce-district-ss-f').value) || 0;
        const daySecM = parseInt(document.getElementById('pslce-day-sec-m').value) || 0;
        const daySecF = parseInt(document.getElementById('pslce-day-sec-f').value) || 0;
        const cdssM = parseInt(document.getElementById('pslce-cdss-m').value) || 0;
        const cdssF = parseInt(document.getElementById('pslce-cdss-f').value) || 0;
        
        const totalM = nationalSecM + districtSsM + daySecM + cdssM;
        const totalF = nationalSecF + districtSsF + daySecF + cdssF;
        
        document.getElementById('pslce-total-selected-m-display').textContent = totalM;
        document.getElementById('pslce-total-selected-f-display').textContent = totalF;
    },
    
    loadPSLCE() {
        const pslceList = document.getElementById('pslce-list');
        const pslce = DataStore.getPSLCE();
        
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
    
    async deletePSLCE(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            await DataStore.deleteRecord('pslce', id);
            this.loadPSLCE();
        }
    },
    
    editPSLCE(id) {
        const pslce = DataStore.getPSLCE();
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
        
        uploadBtn.addEventListener('click', async () => {
            const emis = document.getElementById('particulars-emis').value.trim();
            const headmaster = document.getElementById('particulars-headmaster').value.trim();
            const phone = document.getElementById('particulars-phone').value.trim();
            const email = document.getElementById('particulars-email').value.trim();
            const address = document.getElementById('particulars-address').value.trim();
            
            if (emis && headmaster && phone && email && address) {
                try {
                    await DataStore.addSchoolParticulars({ emis, headmaster, phone, email, address });
                    document.getElementById('particulars-emis').value = '';
                    document.getElementById('particulars-headmaster').value = '';
                    document.getElementById('particulars-phone').value = '';
                    document.getElementById('particulars-email').value = '';
                    document.getElementById('particulars-address').value = '';
                    this.loadParticulars();
                    this.showSuccess('School particulars uploaded successfully');
                } catch (err) {
                    alert(err.message || err);
                }
            }
        });
    },
    
    loadParticulars() {
        const particularsList = document.getElementById('particulars-list');
        const particulars = DataStore.getSchoolParticulars();
        
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
    
    async deleteParticulars(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            await DataStore.deleteRecord('particulars', id);
            this.loadParticulars();
        }
    },
    
    editParticulars(id) {
        const particulars = DataStore.getSchoolParticulars();
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
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Total Female',
                        data: totalF,
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.15)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#764ba2',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'Enrollment Trends by Year',
                        color: 'white',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: 'white',
                            font: {
                                size: 11
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { 
                            color: 'white',
                            font: {
                                size: 11
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        beginAtZero: true
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
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#667eea',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Total Selected Female',
                        data: totalSelectedF,
                        borderColor: '#764ba2',
                        backgroundColor: 'rgba(118, 75, 162, 0.15)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 6,
                        pointBackgroundColor: '#764ba2',
                        pointBorderColor: 'white',
                        pointBorderWidth: 2,
                        pointHoverRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white',
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            padding: 20
                        }
                    },
                    title: {
                        display: true,
                        text: 'PSLCE Selection Trends by Year',
                        color: 'white',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        ticks: { 
                            color: 'white',
                            font: {
                                size: 11
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    y: {
                        ticks: { 
                            color: 'white',
                            font: {
                                size: 11
                            }
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        beginAtZero: true
                    }
                }
            }
        });
    }
};

const SupabaseStatus = {
    update() {
        const message = DataStore.getConnectionStatus();
        document.querySelectorAll('.supabase-status-badge').forEach(el => {
            if (!el) return;
            el.textContent = message;
            el.classList.remove('connected', 'local', 'error');
            const text = message.toLowerCase();
            if (text.includes('connected')) el.classList.add('connected');
            else if (text.includes('local')) el.classList.add('local');
            else if (text.includes('failed') || text.includes('missing') || text.includes('error')) el.classList.add('error');
            else el.classList.add('local');
        });
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    await DataStore.init();
    SupabaseStatus.update();
    Screens.init();
    SplashScreen.init();
    DistrictPasswordScreen.init();
    ZoneSearchScreen.init();
    EmisSearchScreen.init();
    AdminPanel.init();
});
