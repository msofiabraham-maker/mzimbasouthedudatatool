const AppState = {
    currentScreen: 'splash-screen',
    selectedZone: null,
    selectedSchool: null,
    selectedAdmissionZone: null,
    selectedAdmissionSchool: null,
    admissionDistrictNumber: null,
    admissionWindow: null,
    admissionFormStep: 1,
    admissionFormData: {},
    isAdminLoggedIn: false,
    isSchoolLoggedIn: false,
    districtPassword: Config.districtPassword,
    adminUsername: Config.adminUsername,
    adminPassword: Config.adminPassword,
    recoveryEmail: Config.recoveryEmail
};

const sanitizeExportLin = (lin) => String(lin || '').replace(/\D/g, '');
const isValidExportLin = (lin) => /^\d+$/.test(String(lin));

const formatAdmissionLin = (admission) => {
    if (!admission || typeof admission !== 'object') return '';
    const year = String(admission.yearAdmission || '').replace(/\D/g, '');
    const district = String(admission.districtNumber || '').replace(/\D/g, '');
    const emis = String(admission.emis || '').replace(/\D/g, '');
    const rawLin = String(admission.lin || '').replace(/\D/g, '');
    const sequence = String(rawLin.slice(-4)).padStart(4, '0');

    if (!year || year.length !== 4 || !district || !emis || sequence.length !== 4) {
        return sanitizeExportLin(admission.lin);
    }

    let emisCode = emis;
    if (district && emis.startsWith(district)) {
        emisCode = emis.slice(district.length);
    }
    if (!emisCode) {
        emisCode = emis;
    }

    return `${year}${district}${emisCode}${sequence}`;
};

const Screens = {
    screens: {},
    
    init() {
        this.screens = {
            'splash-screen': document.getElementById('splash-screen'),
            'district-password-screen': document.getElementById('district-password-screen'),
            'district-options-screen': document.getElementById('district-options-screen'),
            'zone-search-screen': document.getElementById('zone-search-screen'),
            'emis-search-screen': document.getElementById('emis-search-screen'),
            'school-password-screen': document.getElementById('school-password-screen'),
            'school-dashboard-screen': document.getElementById('school-dashboard-screen'),
            'category-data-screen': document.getElementById('category-data-screen'),
            'admission-zone-screen': document.getElementById('admission-zone-screen'),
            'admission-school-screen': document.getElementById('admission-school-screen'),
            'admission-school-password-screen': document.getElementById('admission-school-password-screen'),
            'admission-district-number-screen': document.getElementById('admission-district-number-screen'),
            'admission-main-screen': document.getElementById('admission-main-screen'),
            'admission-form-screen': document.getElementById('admission-form-screen'),
            'admission-learners-school-select-screen': document.getElementById('admission-learners-school-select-screen'),
            'admission-learners-list-screen': document.getElementById('admission-learners-list-screen'),
            'admin-login-screen': document.getElementById('admin-login-screen'),
            'admin-dashboard-screen': document.getElementById('admin-dashboard-screen'),
            'admin-recovery-screen': document.getElementById('admin-recovery-screen'),
            'admin-admission-school-select-screen': document.getElementById('admin-admission-school-select-screen'),
            'admin-admission-exports-screen': document.getElementById('admin-admission-exports-screen')
        };
        console.log('Screens.init: registered screens ->', Object.keys(this.screens));
    },
    
    show(screenName) {
        if (!screenName) {
            console.warn('Screens.show: Invalid screen name', screenName);
            return;
        }

        let screen = this.screens[screenName];
        if (!screen) {
            screen = document.getElementById(screenName);
            if (screen) {
                console.warn('Screens.show: screen was not registered; falling back to DOM element', screenName);
                this.screens[screenName] = screen;
            }
        }

        if (!screen) {
            console.warn('Screens.show: Invalid screen', screenName);
            try {
                console.log('Screens.show: available screens ->', Object.keys(this.screens));
            } catch (e) {
                console.error('Screens.show: failed to list screens', e);
            }
            return;
        }

        Object.values(this.screens).forEach(screenEntry => {
            if (screenEntry && screenEntry.classList) screenEntry.classList.remove('active');
        });
        if (screen.classList) {
            screen.classList.add('active');
            AppState.currentScreen = screenName;
            // Update admission status card when screen changes
            AdmissionUtils.updateStatusCard();
        }
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
                Screens.show('district-options-screen');
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

const AdmissionUtils = {
    // legacy helpers removed: timer-based auto-closing is disabled

    safeDate(value) {
        if (value === null || value === undefined || value === '') return null;
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    },

    isAdmissionWorkflowScreen() {
        const allowedScreens = new Set([
            'admission-zone-screen',
            'admission-school-screen',
            'admission-school-password-screen',
            'admission-district-number-screen',
            'admission-main-screen',
            'admission-form-screen'
        ]);
        return allowedScreens.has(AppState.currentScreen);
    },

    refreshAdmissionWindow() {
        const latest = typeof DataStore.getLatestAdmissionWindow === 'function'
            ? DataStore.getLatestAdmissionWindow()
            : null;

        AppState.admissionWindow = latest || null;
        // update UI elements to reflect manual-open/manual-close state
        this.updateBanner();
        this.updateStatusCard();
    },

    // Admission is open when the latest window record exists and has no closeTimestamp
    isOpen() {
        if (!AppState.admissionWindow) return false;
        return AppState.admissionWindow.closeTimestamp === null || AppState.admissionWindow.closeTimestamp === undefined;
    },

    updateStatusCard() {
        const statusCard = document.getElementById('admission-status-card');
        const title = document.getElementById('admission-status-title');
        const message = document.getElementById('admission-status-message');
        const closeBtn = document.getElementById('close-status-card');

        if (!statusCard) return;

        if (this.isAdmissionWorkflowScreen()) {
            if (this.isOpen()) {
                title.textContent = 'Admission Registration Open';
                message.textContent = 'Primary School Admission Registration Is Now Open';
                statusCard.style.display = 'block';
            } else {
                title.textContent = 'Admission Window Closed';
                message.textContent = 'Admission Window Is Currently Closed';
                statusCard.style.display = 'block';
                // If user is currently inside admission workflow, immediately block access
                if (this.isAdmissionWorkflowScreen() && !this.isOpen()) {
                    // navigate user out to options screen to prevent further admission actions
                    Screens.show('district-options-screen');
                }
            }

            if (!closeBtn.hasListener) {
                closeBtn.addEventListener('click', () => {
                    statusCard.classList.add('hide');
                    setTimeout(() => {
                        statusCard.style.display = 'none';
                        statusCard.classList.remove('hide');
                    }, 500);
                });
                closeBtn.hasListener = true;
            }
        } else {
            statusCard.style.display = 'none';
        }
    },

    // Keep the banner hidden; the status card is the single source of admission status in the workflow
    updateBanner() {
        const banner = document.getElementById('admission-banner');
        if (!banner) return;
        banner.style.display = 'none';
    }
};

const AdmissionOptionScreen = {
    init() {
        const admissionCard = document.getElementById('admission-option-card');
        const districtCard = document.getElementById('district-data-option-card');
        const message = document.getElementById('admission-option-message');

        admissionCard.addEventListener('click', async () => {
            message.textContent = '';
            await AdmissionUtils.refreshAdmissionWindow();
            if (AdmissionUtils.isOpen()) {
                AdminPanel.showSuccess('Primary School Admission Registration Is Now Open');
                setTimeout(() => {
                    AppState.selectedAdmissionZone = null;
                    AppState.selectedAdmissionSchool = null;
                    AppState.admissionDistrictNumber = null;
                    Screens.show('admission-zone-screen');
                    AdmissionZoneScreen.init();
                }, 600);
            } else {
                AdminPanel.showSuccess('Admission Window Is Currently Closed');
            }
        });

        districtCard.addEventListener('click', () => {
            Screens.show('zone-search-screen');
        });
    }
};

const AdmissionZoneScreen = {
    init() {
        const searchInput = document.getElementById('admission-zone-search');
        const resultsContainer = document.getElementById('admission-zone-results');

        const renderZones = (zones) => {
            resultsContainer.innerHTML = zones.length === 0
                ? '<p class="no-data">No zones found</p>'
                : zones.map(zone => `
                    <div class="result-item" data-zone="${zone}">
                        <h3>${zone}</h3>
                    </div>
                `).join('');

            resultsContainer.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                    AppState.selectedAdmissionZone = item.dataset.zone;
                    Screens.show('admission-school-screen');
                    AdmissionSchoolScreen.init();
                });
            });
        };

        const loadZones = () => {
            const zones = DataStore.getZones().map(z => z.name).filter(Boolean);
            renderZones(zones);
        };

        searchInput.value = '';
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const zones = DataStore.getZones()
                .map(z => z.name)
                .filter(Boolean)
                .filter(zone => zone.toLowerCase().includes(query));
            renderZones(zones);
        });

        loadZones();
    }
};

const AdmissionSchoolScreen = {
    init() {
        const searchInput = document.getElementById('admission-school-search');
        const resultsContainer = document.getElementById('admission-school-results');
        const zoneDisplay = document.getElementById('admission-selected-zone-display');

        zoneDisplay.textContent = AppState.selectedAdmissionZone ? `Selected Zone: ${AppState.selectedAdmissionZone}` : '';
        searchInput.value = '';

        const renderSchools = (schools) => {
            resultsContainer.innerHTML = schools.length === 0
                ? '<p class="no-data">No schools found in this zone</p>'
                : schools.map(school => `
                    <div class="result-item" data-emis="${school.emis}" data-name="${school.name}" data-password="${school.password}">
                        <h3>${school.name}</h3>
                        <p>EMIS: ${school.emis}</p>
                    </div>
                `).join('');

            resultsContainer.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', () => {
                    AppState.selectedAdmissionSchool = {
                        emis: item.dataset.emis,
                        name: item.dataset.name,
                        password: item.dataset.password
                    };
                    Screens.show('admission-school-password-screen');
                    AdmissionSchoolPasswordScreen.init();
                });
            });
        };

        const loadSchools = () => {
            const schools = AppState.selectedAdmissionZone ? DataStore.getSchoolsByZone(AppState.selectedAdmissionZone) : [];
            renderSchools(schools);
        };

        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLowerCase();
            const schools = AppState.selectedAdmissionZone ? DataStore.getSchoolsByZone(AppState.selectedAdmissionZone) : [];
            const filtered = schools.filter(school => {
                return school.name.toLowerCase().includes(query) || String(school.emis).toLowerCase().includes(query);
            });
            renderSchools(filtered);
        });

        loadSchools();
    }
};

const AdmissionSchoolPasswordScreen = {
    init() {
        const schoolDisplay = document.getElementById('admission-school-name-display');
        const passwordInput = document.getElementById('admission-school-password');
        const toggleBtn = document.getElementById('toggle-admission-school-password');
        const loginBtn = document.getElementById('admission-school-login-btn');
        const errorDisplay = document.getElementById('admission-school-error');

        schoolDisplay.textContent = AppState.selectedAdmissionSchool ? AppState.selectedAdmissionSchool.name : '';
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
            if (passwordInput.value === AppState.selectedAdmissionSchool.password) {
                errorDisplay.textContent = '';
                AppState.admissionDistrictNumber = null;
                Screens.show('admission-district-number-screen');
                AdmissionDistrictNumberScreen.init();
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

const AdmissionDistrictNumberScreen = {
    init() {
        const input = document.getElementById('admission-district-number');
        const button = document.getElementById('admission-district-number-btn');
        const errorDisplay = document.getElementById('admission-district-number-error');

        input.value = '';
        errorDisplay.textContent = '';

        button.addEventListener('click', () => {
            const value = input.value.trim();
            if (!/^0\d+$/.test(value)) {
                errorDisplay.textContent = 'District number must start with 0 and contain digits only';
                return;
            }
            AppState.admissionDistrictNumber = value;
            errorDisplay.textContent = '';
            Screens.show('admission-main-screen');
            AdmissionMainScreen.init();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                button.click();
            }
        });
    }
};

const AdmissionMainScreen = {
    init() {
        const schoolDisplay = document.getElementById('admission-dashboard-school-display');
        const newAdmissionBtn = document.getElementById('new-admission-btn');
        const showRegisteredBtn = document.getElementById('show-registered-btn');
        const submitBtn = document.getElementById('admission-submit-btn');

        schoolDisplay.textContent = AppState.selectedAdmissionSchool ? `${AppState.selectedAdmissionSchool.name} (${AppState.selectedAdmissionSchool.emis})` : '';
        
        const registeredContainer = document.getElementById('admission-registered-learners');
        if (registeredContainer) {
            registeredContainer.innerHTML = '';
            registeredContainer.style.display = 'none';
        }

        if (newAdmissionBtn) {
            newAdmissionBtn.onclick = () => {
                console.log('New Admission clicked');
                AppState.admissionFormStep = 1;
                AppState.admissionFormData = {
                    district: AppState.selectedAdmissionZone,
                    school: AppState.selectedAdmissionSchool.name,
                    emis: AppState.selectedAdmissionSchool.emis
                };
                AdmissionFormScreen.init();
                Screens.show('admission-form-screen');
            };
        }

        if (showRegisteredBtn) {
            showRegisteredBtn.onclick = () => {
                console.log('Show Registered Learners button clicked');
                LearnersSelectionScreen.init();
                Screens.show('admission-learners-school-select-screen');
            };
            showRegisteredBtn.setAttribute('role', 'button');
            showRegisteredBtn.tabIndex = 0;
        } else {
            console.warn('AdmissionMainScreen.init: show-registered-btn not found');
        }

        if (submitBtn) {
            submitBtn.onclick = () => {
                console.log('Admission submit button clicked');
                const learners = DataStore.getAdmissionsBySchool(AppState.selectedAdmissionSchool.emis);
                if (learners.length === 0) {
                    alert('No learners registered yet for this school. Please add learner admissions first.');
                    return;
                }
                AdminPanel.showSuccess('Learner records saved. Use the admin admission section to download Excel.');
            };
        }

    },

    toggleRegisteredLearners() {
        const container = document.getElementById('admission-registered-learners');
        const btn = document.getElementById('show-registered-btn');
        
        if (container.style.display === 'none') {
            this.renderRegisteredLearners();
            container.style.display = 'block';
            btn.querySelector('h3').textContent = 'Hide Registered Learners';
        } else {
            container.innerHTML = '';
            container.style.display = 'none';
            btn.querySelector('h3').textContent = 'Show Registered Learners';
        }
    },

    renderRegisteredLearners() {
        const container = document.getElementById('admission-registered-learners');
        const learners = DataStore.getAdmissionsBySchool(AppState.selectedAdmissionSchool.emis);
        if (!learners.length) {
            container.innerHTML = '<p class="no-data">No registered learners for this school.</p>';
            return;
        }
        container.innerHTML = learners.map(learner => `
            <div class="admission-learner-card">
                <div class="admission-learner-details">
                    <h4>${learner.childName}</h4>
                    <p>LIN: ${learner.lin}</p>
                    <p>Admission Year: ${learner.yearAdmission}</p>
                </div>
                <button class="btn-delete" data-id="${learner.id}">Delete</button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete').forEach(button => {
            button.addEventListener('click', async () => {
                const id = parseInt(button.dataset.id, 10);
                if (confirm('Remove this registered learner?')) {
                    await DataStore.deleteRecord('admission', id);
                    this.renderRegisteredLearners();
                }
            });
        });
    }
};

const LearnersSelectionScreen = {
    init() {
        console.log('LearnersSelectionScreen.init called');
        const searchInput = document.getElementById('learners-school-search');
        const resultsContainer = document.getElementById('learners-school-results');
        const backBtn = document.getElementById('back-to-admission-main');

        if (!searchInput || !resultsContainer || !backBtn) {
            console.error('LearnersSelectionScreen.init: missing DOM elements', { searchInput, resultsContainer, backBtn });
            return;
        }

        searchInput.value = '';
        resultsContainer.innerHTML = '';
        this.renderSchools();

        searchInput.oninput = () => this.filterSchools();
        backBtn.onclick = () => {
            console.log('Back button clicked from learner school select screen');
            AdmissionMainScreen.init();
            Screens.show('admission-main-screen');
        };
    },

    renderSchools() {
        const schools = DataStore.getSchools();
        const container = document.getElementById('learners-school-results');
        if (!schools.length) {
            container.innerHTML = '<p class="no-data">No schools available.</p>';
            return;
        }
        container.innerHTML = schools.map(school => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${school.name}</h4>
                    <p>EMIS: ${school.emis}</p>
                </div>
                <button class="btn-primary select-school-btn" data-emis="${school.emis}">Select</button>
            </div>
        `).join('');

        this.attachSchoolSelectButtons(container);
    },

    attachSchoolSelectButtons(container) {
        const buttons = container.querySelectorAll('.select-school-btn');
        if (!buttons.length) {
            console.warn('LearnersSelectionScreen.attachSchoolSelectButtons: no buttons found');
            return;
        }

        buttons.forEach(btn => {
            btn.onclick = () => {
                const emis = btn.dataset.emis;
                console.log('LearnersSelectionScreen: school selected', emis);
                const school = DataStore.getSchoolByEMIS(emis);
                if (school) {
                    AppState.selectedAdmissionSchool = school;
                    LearnersListScreen.init(school);
                    Screens.show('admission-learners-list-screen');
                } else {
                    console.error('LearnersSelectionScreen: selected school not found', emis);
                    container.innerHTML = '<p class="no-data">Selected school was not found.</p>';
                }
            };
        });
    },

    filterSchools() {
        const searchInput = document.getElementById('learners-school-search');
        const container = document.getElementById('learners-school-results');
        if (!searchInput || !container) {
            console.error('LearnersSelectionScreen.filterSchools: missing DOM elements', { searchInput, container });
            return;
        }

        const query = searchInput.value.toLowerCase().trim();
        const schools = DataStore.getSchools();
        console.log('LearnersSelectionScreen.filterSchools query:', query, 'schoolCount:', schools.length);

        if (!query) {
            this.renderSchools();
            return;
        }

        const filtered = schools.filter(s => 
            s.name.toLowerCase().includes(query) || 
            String(s.emis).includes(query)
        );

        if (!filtered.length) {
            container.innerHTML = '<p class="no-data">No schools found.</p>';
            return;
        }

        container.innerHTML = filtered.map(school => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${school.name}</h4>
                    <p>EMIS: ${school.emis}</p>
                </div>
                <button class="btn-primary select-school-btn" data-emis="${school.emis}">Select</button>
            </div>
        `).join('');

        this.attachSchoolSelectButtons(container);
    }
};

const LearnersListScreen = {
    init(school) {
        if (!school) return;
        const schoolDisplay = document.getElementById('learners-school-name-display');
        const container = document.getElementById('learners-list-container');
        const backBtn = document.getElementById('back-to-learners-select');

        schoolDisplay.textContent = `${school.name} (${school.emis})`;
        
        this.renderLearners(school.emis);

        backBtn.addEventListener('click', () => {
            LearnersSelectionScreen.init();
            Screens.show('admission-learners-school-select-screen');
        });
    },

    renderLearners(schoolEmis) {
        const learners = DataStore.getAdmissionsBySchool(schoolEmis);
        const container = document.getElementById('learners-list-container');

        if (!learners.length) {
            container.innerHTML = '<p class="no-data">No registered learners for this school.</p>';
            return;
        }

        container.innerHTML = learners.map(learner => `
            <div class="admission-learner-card">
                <div class="admission-learner-details">
                    <h4>${learner.childName}</h4>
                    <p><strong>LIN:</strong> ${String(learner.lin || '').replace(/-/g, '')}</p>
                    <p><strong>Admission Year:</strong> ${learner.yearAdmission}</p>
                    <p><strong>Sex:</strong> ${learner.sex}</p>
                </div>
                <div class="admission-learner-actions">
                    <button class="btn-delete" data-id="${learner.id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id, 10);
                if (!isNaN(id) && confirm('Delete this learner?')) {
                    try {
                        await DataStore.deleteRecord('admission', id);
                        AdminPanel.showSuccess('Learner deleted successfully.');
                        this.renderLearners(schoolEmis);
                    } catch (err) {
                        console.error(err);
                        alert('Failed to delete learner. Please try again.');
                    }
                }
            });
        });
    }
};

const AdminAdmissionSchoolSelect = {
    init() {
        const searchInput = document.getElementById('admin-admission-school-search');
        const resultsContainer = document.getElementById('admin-admission-school-results');
        const backBtn = document.getElementById('back-to-admin-panel');

        searchInput.value = '';
        resultsContainer.innerHTML = '';
        this.renderSchools();

        searchInput.addEventListener('input', () => this.filterSchools());
        backBtn.addEventListener('click', () => {
            AdminPanel.init();
            Screens.show('admin-main-screen');
        });
    },

    renderSchools() {
        const schools = DataStore.getSchools();
        const container = document.getElementById('admin-admission-school-results');
        if (!schools.length) {
            container.innerHTML = '<p class="no-data">No schools available.</p>';
            return;
        }
        container.innerHTML = schools.map(school => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${school.name}</h4>
                    <p>EMIS: ${school.emis}</p>
                </div>
                <button class="btn-primary select-school-btn" data-emis="${school.emis}">View Exports</button>
            </div>
        `).join('');

        container.querySelectorAll('.select-school-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emis = btn.dataset.emis;
                const school = DataStore.getSchoolByEMIS(emis);
                if (school) {
                    AppState.selectedAdmissionSchool = school;
                    AdminAdmissionExportsScreen.init(school);
                    Screens.show('admin-admission-exports-screen');
                }
            });
        });
    },

    filterSchools() {
        const searchInput = document.getElementById('admin-admission-school-search');
        const query = searchInput.value.toLowerCase().trim();
        const container = document.getElementById('admin-admission-school-results');
        const schools = DataStore.getSchools();

        if (!query) {
            this.renderSchools();
            return;
        }

        const filtered = schools.filter(s => 
            s.name.toLowerCase().includes(query) || 
            String(s.emis).includes(query)
        );

        if (!filtered.length) {
            container.innerHTML = '<p class="no-data">No schools found.</p>';
            return;
        }

        container.innerHTML = filtered.map(school => `
            <div class="list-item">
                <div class="list-item-info">
                    <h4>${school.name}</h4>
                    <p>EMIS: ${school.emis}</p>
                </div>
                <button class="btn-primary select-school-btn" data-emis="${school.emis}">View Exports</button>
            </div>
        `).join('');

        container.querySelectorAll('.select-school-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emis = btn.dataset.emis;
                const school = DataStore.getSchoolByEMIS(emis);
                if (school) {
                    AppState.selectedAdmissionSchool = school;
                    AdminAdmissionExportsScreen.init(school);
                    Screens.show('admin-admission-exports-screen');
                }
            });
        });
    }
};

const AdminAdmissionExportsScreen = {
    init(school) {
        if (!school) return;
        AppState.selectedAdmissionSchool = school;
        const schoolDisplay = document.getElementById('admin-exports-school-name-display');
        const container = document.getElementById('admin-exports-list-container');
        const backBtn = document.getElementById('back-to-admin-admission-select');

        schoolDisplay.textContent = `${school.name} (${school.emis})`;
        container.innerHTML = '';
        this.renderExports(school.emis);

        backBtn.addEventListener('click', () => {
            AdminAdmissionSchoolSelect.init();
            Screens.show('admin-admission-school-select-screen');
        });
    },


    renderExports(schoolEmis) {
        const exports = DataStore.getAdmissionExportsBySchool(schoolEmis);
        const container = document.getElementById('admin-exports-list-container');

        if (!exports.length) {
            container.innerHTML = '<p class="no-data">No exports for this school.</p>';
            return;
        }

        container.innerHTML = exports.map((exp, idx) => `
            <div class="export-item">
                <div class="export-info">
                    <h4>${exp.filename || 'Export ' + (idx + 1)}</h4>
                    <p>Learners: ${exp.totalLearners || exp.totallearners}</p>
                    <p>Date: ${new Date(exp.timestamp || exp.created_at).toLocaleDateString()}</p>
                </div>
                <div class="export-actions">
                    <button class="btn-download" data-id="${exp.id}" data-filename="${exp.filename}">Download</button>
                    <button class="btn-delete" data-id="${exp.id}">Delete</button>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const filename = btn.dataset.filename;
                this.downloadExport(id, filename);
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Delete this export? This action cannot be undone.')) {
                    this.deleteExport(id);
                }
            });
        });
    },

    async downloadExport(id, filename) {
        const export_data = DataStore.getAdmissionExportById(id);
        const fileBase64 = export_data ? (export_data.fileBase64 || export_data.filebase64) : null;
        if (!export_data || !fileBase64) {
            alert('Export file not found.');
            return;
        }

        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${fileBase64}`;
        link.download = filename || 'admission_export.xlsx';
        link.click();
    },

    async deleteExport(id) {
        try {
            await DataStore.deleteRecord('admission_export', id);
            AdminPanel.showSuccess('Export deleted successfully.');
            const emis = AppState.selectedAdmissionSchool ? AppState.selectedAdmissionSchool.emis : null;
            this.renderExports(emis);
        } catch (err) {
            alert('Failed to delete export. Please try again.');
            console.error(err);
        }
    }
};



const AdmissionFormScreen = {
    init() {
        const backBtn = document.getElementById('admission-form-back-btn');
        const nextBtn = document.getElementById('admission-form-next-btn');
        document.getElementById('admission-form-error').textContent = '';
        if (!AppState.admissionFormStep) {
            AppState.admissionFormStep = 1;
            AppState.admissionFormData = {
                district: AppState.selectedAdmissionZone,
                school: AppState.selectedAdmissionSchool.name,
                emis: AppState.selectedAdmissionSchool.emis
            };
        }
        backBtn.disabled = AppState.admissionFormStep === 1;
        backBtn.addEventListener('click', () => this.previousStep());
        nextBtn.addEventListener('click', () => this.nextStep());
        this.renderStep();
    },

    renderStep() {
        const container = document.getElementById('admission-form-step');
        const step = AppState.admissionFormStep;
        const data = AppState.admissionFormData || {};
        let html = '';

        switch (step) {
            case 1:
                html = `
                    <h3>Step 1: School Details</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>District</label>
                            <input type="text" id="form-district" value="${data.district || ''}" placeholder="District">
                        </div>
                        <div class="admission-form-field">
                            <label>School</label>
                            <input type="text" id="form-school" value="${data.school || ''}" placeholder="School">
                        </div>
                        <div class="admission-form-field">
                            <label>School EMIS Code</label>
                            <input type="text" id="form-emis" value="${data.emis || ''}" placeholder="School EMIS Code">
                        </div>
                    </div>
                `;
                break;
            case 2:
                html = `
                    <h3>Step 2: Admission Date</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>School Year of Admission</label>
                            <input type="text" id="form-yearAdmission" value="${data.yearAdmission || new Date().getFullYear()}" readonly>
                        </div>
                        <div class="admission-form-field">
                            <label>Date of Admission</label>
                            <input type="date" id="form-dateOfAdmission" value="${data.dateOfAdmission || ''}">
                        </div>
                    </div>
                `;
                break;
            case 3:
                html = `
                    <h3>Step 3: Child Details</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>Child Name (Surname First)</label>
                            <input type="text" id="form-childName" value="${data.childName || ''}" placeholder="Surname First">
                        </div>
                        <div class="admission-form-field">
                            <label>Sex</label>
                            <select id="form-sex">
                                <option value="">Select sex</option>
                                <option value="Male" ${data.sex === 'Male' ? 'selected' : ''}>Male</option>
                                <option value="Female" ${data.sex === 'Female' ? 'selected' : ''}>Female</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
            case 4:
                html = `
                    <h3>Step 4: Birth Details</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>Date of Birth</label>
                            <input type="date" id="form-dateOfBirth" value="${data.dateOfBirth || ''}">
                        </div>
                        <div class="admission-form-field">
                            <label>Age (yrs)</label>
                            <input type="number" id="form-ageYears" value="${data.ageYears || ''}" placeholder="Age">
                        </div>
                        <div class="admission-form-field">
                            <label>Special Needs (If any)</label>
                            <input type="text" id="form-specialNeeds" value="${data.specialNeeds || ''}" placeholder="Special needs details">
                        </div>
                    </div>
                `;
                break;
            case 5:
                html = `
                    <h3>Step 5: Additional Background</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>District of Origin</label>
                            <input type="text" id="form-originDistrict" value="${data.originDistrict || ''}" placeholder="District of Origin">
                        </div>
                        <div class="admission-form-field">
                            <label>Religious Denomination</label>
                            <input type="text" id="form-religiousDenomination" value="${data.religiousDenomination || ''}" placeholder="Religious Denomination">
                        </div>
                    </div>
                `;
                break;
            case 6:
                html = `
                    <h3>Step 6: Orphan Status</h3>
                    <div class="admission-form-grid">
                        <label class="admission-form-field">
                            <input type="checkbox" id="form-orphanDouble" ${data.orphanStatus === 'Double' ? 'checked' : ''}> Double Orphan
                        </label>
                        <label class="admission-form-field">
                            <input type="checkbox" id="form-orphanSingle" ${data.orphanStatus === 'Single' ? 'checked' : ''}> Single Orphan
                        </label>
                    </div>
                `;
                break;
            case 7:
                html = `
                    <h3>Step 7: ECD Education</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>ECD Education Attendance</label>
                            <select id="form-ecdAttendance">
                                <option value="">Select</option>
                                <option value="Yes" ${data.ecdAttendance === 'Yes' ? 'selected' : ''}>Yes</option>
                                <option value="No" ${data.ecdAttendance === 'No' ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                        <div id="cin-field-wrapper" class="cin-field-wrapper" style="max-height: ${data.ecdAttendance === 'Yes' ? '500px' : '0'}; opacity: ${data.ecdAttendance === 'Yes' ? '1' : '0'}; overflow: hidden; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);">
                            <div class="admission-form-field">
                                <label>CIN</label>
                                <input type="text" id="form-cinNumber" value="${data.cinNumber || ''}" placeholder="CIN">
                            </div>
                        </div>
                    </div>
                `;
                break;
            case 8:
                html = `
                    <h3>Step 8: Parent / Guardian</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>Parent/Guardian Name</label>
                            <input type="text" id="form-parentGuardianName" value="${data.parentGuardianName || ''}" placeholder="Parent or guardian">
                        </div>
                        <div class="admission-form-field">
                            <label>Phone Number</label>
                            <input type="text" id="form-parentGuardianPhone" value="${data.parentGuardianPhone || ''}" placeholder="Phone number">
                        </div>
                    </div>
                `;
                break;
            case 9:
                html = `
                    <h3>Step 9: Head Teacher</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>Head Teacher Name</label>
                            <input type="text" id="form-headTeacherName" value="${data.headTeacherName || ''}" placeholder="Head teacher name">
                        </div>
                        <div class="admission-form-field">
                            <label>Phone Number</label>
                            <input type="text" id="form-headTeacherPhone" value="${data.headTeacherPhone || ''}" placeholder="Phone number">
                        </div>
                    </div>
                `;
                break;
            case 10:
                html = `
                    <h3>Step 10: LIN Generation</h3>
                    <div class="admission-form-grid" style="margin-top:20px;">
                        <div class="admission-form-field">
                            <label>Generated LIN</label>
                            <input type="text" id="form-lin" value="${data.lin || 'Generating...'}" readonly>
                        </div>
                    </div>
                `;
                break;
            case 11:
                html = `
                    <h3>Step 11: zEMIS Officer</h3>
                    <div class="admission-form-grid">
                        <div class="admission-form-field">
                            <label>Name</label>
                            <input type="text" id="form-zemisOfficerName" value="${data.zemisOfficerName || ''}" placeholder="zEMIS officer name">
                        </div>
                        <div class="admission-form-field">
                            <label>Date</label>
                            <input type="date" id="form-zemisOfficerDate" value="${data.zemisOfficerDate || ''}">
                        </div>
                        <div class="admission-form-field">
                            <label>Phone</label>
                            <input type="text" id="form-zemisOfficerPhone" value="${data.zemisOfficerPhone || ''}" placeholder="Phone number">
                        </div>
                    </div>
                `;
                break;
            default:
                html = '<p class="no-data">Invalid step.</p>';
        }

        container.innerHTML = html;
        const nextBtn = document.getElementById('admission-form-next-btn');
        if (nextBtn) {
            nextBtn.textContent = step === 11 ? 'Save' : 'Next';
        }
        document.getElementById('admission-form-back-btn').disabled = step === 1;

        // Add ECD attendance listener for smooth CIN field transitions
        if (step === 7) {
            const ecdSelect = document.getElementById('form-ecdAttendance');
            const cinWrapper = document.getElementById('cin-field-wrapper');
            
            if (ecdSelect && cinWrapper) {
                ecdSelect.addEventListener('change', (e) => {
                    const isYes = e.target.value === 'Yes';
                    cinWrapper.style.maxHeight = isYes ? '500px' : '0';
                    cinWrapper.style.opacity = isYes ? '1' : '0';
                });
            }
        }
    },

    collectValues() {
        const data = AppState.admissionFormData || {};
        const values = {};

        const setValue = (key, selector) => {
            const el = document.getElementById(selector);
            if (el) {
                values[key] = el.value.trim();
            }
        };

        if (AppState.admissionFormStep === 1) {
            setValue('district', 'form-district');
            setValue('school', 'form-school');
            setValue('emis', 'form-emis');
        }
        if (AppState.admissionFormStep === 2) {
            setValue('yearAdmission', 'form-yearAdmission');
            setValue('dateOfAdmission', 'form-dateOfAdmission');
        }
        if (AppState.admissionFormStep === 3) {
            setValue('childName', 'form-childName');
            setValue('sex', 'form-sex');
        }
        if (AppState.admissionFormStep === 4) {
            setValue('dateOfBirth', 'form-dateOfBirth');
            setValue('ageYears', 'form-ageYears');
            setValue('specialNeeds', 'form-specialNeeds');
        }
        if (AppState.admissionFormStep === 5) {
            setValue('originDistrict', 'form-originDistrict');
            setValue('religiousDenomination', 'form-religiousDenomination');
        }
        if (AppState.admissionFormStep === 6) {
            const double = document.getElementById('form-orphanDouble');
            const single = document.getElementById('form-orphanSingle');
            values.orphanStatus = double && double.checked ? 'Double' : single && single.checked ? 'Single' : data.orphanStatus || '';
        }
        if (AppState.admissionFormStep === 7) {
            setValue('ecdAttendance', 'form-ecdAttendance');
            if (values.ecdAttendance === 'Yes') {
                setValue('cinNumber', 'form-cinNumber');
            } else {
                values.cinNumber = '';
            }
        }
        if (AppState.admissionFormStep === 8) {
            setValue('parentGuardianName', 'form-parentGuardianName');
            setValue('parentGuardianPhone', 'form-parentGuardianPhone');
        }
        if (AppState.admissionFormStep === 9) {
            setValue('headTeacherName', 'form-headTeacherName');
            setValue('headTeacherPhone', 'form-headTeacherPhone');
        }
        if (AppState.admissionFormStep === 10) {
            const linField = document.getElementById('form-lin');
            if (linField) {
                values.lin = linField.value.trim();
            }
        }
        if (AppState.admissionFormStep === 11) {
            setValue('zemisOfficerName', 'form-zemisOfficerName');
            setValue('zemisOfficerDate', 'form-zemisOfficerDate');
            setValue('zemisOfficerPhone', 'form-zemisOfficerPhone');
        }

        AppState.admissionFormData = { ...data, ...values };
    },

    validateStep() {
        const data = AppState.admissionFormData;
        if (AppState.admissionFormStep === 1) {
            if (!data.district || !data.school || !data.emis) return 'All fields are required in step 1';
        }
        if (AppState.admissionFormStep === 2) {
            if (!data.yearAdmission || !/^\d{4}$/.test(data.yearAdmission)) return 'Enter a valid admission year';
            if (!data.dateOfAdmission || !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfAdmission)) return 'Enter admission date in YYYY-MM-DD';
        }
        if (AppState.admissionFormStep === 3) {
            if (!data.childName || !data.sex) return 'Enter child name and sex';
        }
        if (AppState.admissionFormStep === 4) {
            if (!data.dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)) return 'Enter date of birth in YYYY-MM-DD';
            if (!data.ageYears || parseInt(data.ageYears, 10) <= 0) return 'Enter a valid age';
        }
        if (AppState.admissionFormStep === 5) {
            if (!data.originDistrict || !data.religiousDenomination) return 'Enter district of origin and religious denomination';
        }
        if (AppState.admissionFormStep === 6) {
            if (!data.orphanStatus) return 'Select orphan status';
        }
        if (AppState.admissionFormStep === 7) {
            if (!data.ecdAttendance) return 'Select ECD attendance';
            if (data.ecdAttendance === 'Yes' && !data.cinNumber) return 'Enter CIN when attendance is yes';
        }
        if (AppState.admissionFormStep === 8) {
            if (!data.parentGuardianName || !data.parentGuardianPhone) return 'Enter parent or guardian details';
        }
        if (AppState.admissionFormStep === 9) {
            if (!data.headTeacherName || !data.headTeacherPhone) return 'Enter head teacher details';
        }
        if (AppState.admissionFormStep === 11) {
            if (!data.zemisOfficerName || !data.zemisOfficerDate || !data.zemisOfficerPhone) return 'Enter zEMIS officer information';
        }
        return '';
    },

    async generateLin() {
        const data = AppState.admissionFormData || {};
        const year = String(data.yearAdmission || '').trim();
        const emis = String(data.emis || AppState.selectedAdmissionSchool?.emis || '').trim();
        const districtNumber = String(AppState.admissionDistrictNumber || data.district || data.districtNumber || '').trim();
        const nextLin = await DataStore.getLatestAdmissionLin(emis, year, districtNumber);
        return String(nextLin || '').replace(/\D/g, '');
    },

    async nextStep() {
        this.collectValues();
        const errorDisplay = document.getElementById('admission-form-error');
        errorDisplay.textContent = '';

        if (AppState.admissionFormStep === 10) {
            const splash = document.getElementById('lin-success-splash');
            if (splash) {
                const msgEl = document.getElementById('lin-success-message');
                const headingEl = splash.querySelector('h2');
                if (headingEl) headingEl.textContent = '';
                if (msgEl) msgEl.textContent = 'GENERATING LIN PLEASE WAIT...';
                splash.style.display = 'flex';

                await new Promise(res => setTimeout(res, 3000));

                const generatedLin = await this.generateLin();
                AppState.admissionFormData.lin = String(generatedLin || '').replace(/\D/g, '');

                const linField = document.getElementById('form-lin');
                if (linField) linField.value = AppState.admissionFormData.lin || '';

                if (headingEl) headingEl.textContent = 'LIN GENERATED SUCCESSFULLY';
                if (msgEl) msgEl.textContent = '';
                await new Promise(res => setTimeout(res, 2000));

                splash.style.display = 'none';
                AppState.admissionFormStep = 11;
                this.renderStep();
                return;
            }
        }

        const validationError = this.validateStep();
        if (validationError) {
            errorDisplay.textContent = validationError;
            return;
        }

        if (AppState.admissionFormStep === 11) {
            try {
                await this.submitAdmission();
                return;
            } catch (err) {
                errorDisplay.textContent = 'Failed to submit admission. Please try again.';
                console.error('AdmissionFormScreen.submitAdmission failed:', err);
                return;
            }
        }

        AppState.admissionFormStep += 1;
        this.renderStep();
    },

    previousStep() {
        if (AppState.admissionFormStep > 1) {
            AppState.admissionFormStep -= 1;
            this.renderStep();
        }
    },

    async submitAdmission() {
        this.collectValues();
        const record = {
            emis: AppState.selectedAdmissionSchool?.emis,
            schoolName: AppState.selectedAdmissionSchool?.name,
            zone: AppState.selectedAdmissionSchool?.zone,
            districtNumber: AppState.admissionDistrictNumber,
            yearAdmission: AppState.admissionFormData.yearAdmission,
            dateOfAdmission: AppState.admissionFormData.dateOfAdmission,
            childName: AppState.admissionFormData.childName,
            sex: AppState.admissionFormData.sex,
            dateOfBirth: AppState.admissionFormData.dateOfBirth,
            ageYears: AppState.admissionFormData.ageYears,
            specialNeeds: AppState.admissionFormData.specialNeeds,
            originDistrict: AppState.admissionFormData.originDistrict,
            religiousDenomination: AppState.admissionFormData.religiousDenomination,
            orphanStatus: AppState.admissionFormData.orphanStatus,
            ecdAttendance: AppState.admissionFormData.ecdAttendance,
            cinNumber: AppState.admissionFormData.cinNumber || null,
            parentGuardianName: AppState.admissionFormData.parentGuardianName,
            parentGuardianPhone: AppState.admissionFormData.parentGuardianPhone,
            headTeacherName: AppState.admissionFormData.headTeacherName,
            headTeacherPhone: AppState.admissionFormData.headTeacherPhone,
            lin: String(AppState.admissionFormData.lin || '').replace(/\D/g, ''),
            zemisOfficerName: AppState.admissionFormData.zemisOfficerName,
            zemisOfficerDate: AppState.admissionFormData.zemisOfficerDate,
            zemisOfficerPhone: AppState.admissionFormData.zemisOfficerPhone,
            timestamp: new Date().toISOString()
        };

        console.log('AdmissionFormScreen.submitAdmission payload:', record);
        const saved = await DataStore.addAdmission(record);
        console.log('AdmissionFormScreen.submitAdmission result:', saved);
        AdminPanel.showSuccess('Admission successfully saved.');
        Screens.show('admission-main-screen');
        AdmissionMainScreen.init();
    },

    async createExport() {
        const admissions = DataStore.getAdmissionsBySchool(AppState.selectedAdmissionSchool.emis);
        if (!admissions.length) throw new Error('No admissions available');
        const rows = admissions.map(item => ({
            'School Name': item.schoolName,
            'Child Name': item.childName,
            'Sex': item.sex,
            'Admission Year': item.yearAdmission,
            'District Number': item.districtNumber,
            'LIN': formatAdmissionLin(item),
            'Date of Birth': item.dateOfBirth,
            'Age (yrs)': item.ageYears,
            'Date of Admission': item.dateOfAdmission,
            'ECD Attendance': item.ecdAttendance,
            'CIN': item.cinNumber || '',
            'Religious Denomination': item.religiousDenomination,
            'Orphan Status': item.orphanStatus,
            'Special Needs': item.specialNeeds || '',
            'Parent/Guardian Name': item.parentGuardianName,
            'Parent/Guardian Phone': item.parentGuardianPhone,
            'Head Teacher Name': item.headTeacherName,
            'Head Teacher Phone': item.headTeacherPhone,
            'zEMIS Officer Name': item.zemisOfficerName,
            'zEMIS Officer Phone': item.zemisOfficerPhone,
            'Zone': item.zone,
            'District of Origin': item.originDistrict,
            'zEMIS Officer Date': item.zemisOfficerDate,
            'Timestamp': item.timestamp
        }));

        const invalidRow = rows.find(row => !isValidExportLin(row.LIN));
        if (invalidRow) {
            AdminPanel.showSuccess('Cannot export Excel: LIN contains invalid symbols.');
            return;
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Admissions');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const filename = `${AppState.selectedAdmissionSchool.name.replace(/[^a-zA-Z0-9]/g, '_')}_Admissions.xlsx`;

        await DataStore.addAdmissionExport({
            schoolEmis: String(AppState.selectedAdmissionSchool.emis).trim(),
            schoolName: AppState.selectedAdmissionSchool.name,
            filename,
            fileBase64: wbout,
            totalLearners: admissions.length
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
        if (progressIndicator) progressIndicator.classList.remove('active');
        if (progressBar) progressBar.style.width = '0%';
    },

    safeExecute(fn) {
        try {
            if (typeof fn === 'function') fn();
        } catch (error) {
            console.error('AdminPanel safeExecute error', error);
        }
    },

    safeExecuteAsync(fn) {
        if (typeof fn !== 'function') return Promise.resolve();
        return Promise.resolve()
            .then(() => fn())
            .catch(error => {
                console.error('AdminPanel safeExecuteAsync error', error);
            });
    },

    getScreenElement(screenName) {
        return Screens.screens[screenName] || document.getElementById(screenName);
    },

    activateDefaultAdminTab() {
        const tabs = document.querySelectorAll('.admin-tab');
        const panels = document.querySelectorAll('.admin-panel');
        const defaultTab = document.querySelector('.admin-tab[data-tab="zones"]');
        const defaultPanel = document.getElementById('admin-zones');

        tabs.forEach(tab => tab.classList.remove('active'));
        panels.forEach(panel => panel.classList.remove('active'));

        if (defaultTab) defaultTab.classList.add('active');
        if (defaultPanel) defaultPanel.classList.add('active');
    },

    openAdminDashboard() {
        const loginScreen = this.getScreenElement('admin-login-screen');
        const adminScreen = this.getScreenElement('admin-dashboard-screen');

        if (loginScreen && loginScreen.classList.contains('active')) {
            loginScreen.classList.remove('active');
        }

        if (adminScreen) {
            adminScreen.classList.add('active');
            AppState.currentScreen = 'admin-dashboard-screen';
        }

        this.activateDefaultAdminTab();
    },
    
    initAdminLogin() {
        const closeBtn = document.getElementById('close-admin-modal');
        const usernameInput = document.getElementById('admin-username');
        const passwordInput = document.getElementById('admin-password');
        const toggleBtn = document.getElementById('toggle-admin-password');
        const loginBtn = document.getElementById('admin-login-btn');
        const errorDisplay = document.getElementById('admin-error');
        const recoveryLink = document.getElementById('admin-recovery-link');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                Screens.show(AppState.currentScreen === 'admin-login-screen' ? 'district-password-screen' : AppState.currentScreen);
            });
        }
        
        if (toggleBtn && passwordInput) {
            toggleBtn.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleBtn.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    toggleBtn.textContent = '👁️';
                }
            });
        }
        
        if (loginBtn && usernameInput && passwordInput) {
            loginBtn.addEventListener('click', () => {
                const enteredUsername = usernameInput.value.trim();
                const enteredPassword = passwordInput.value;

                if (enteredUsername === String(AppState.adminUsername).trim() && enteredPassword === String(AppState.adminPassword)) {
                    if (errorDisplay) errorDisplay.textContent = '';
                    AppState.isAdminLoggedIn = true;
                    usernameInput.value = '';
                    passwordInput.value = '';
                    this.safeExecute(() => this.loadAdminData());
                    this.openAdminDashboard();
                } else {
                    if (errorDisplay) errorDisplay.textContent = 'Invalid username or password';
                    passwordInput.value = '';
                }
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    if (loginBtn) loginBtn.click();
                }
            });
        }
        
        if (recoveryLink) {
            recoveryLink.addEventListener('click', () => {
                AdminRecoveryScreen.init();
                Screens.show('admin-recovery-screen');
            });
        }
    },
    
    initAdminDashboard() {
        const logoutBtn = document.getElementById('admin-logout-btn');
        const tabs = document.querySelectorAll('.admin-tab');
        const panels = document.querySelectorAll('.admin-panel');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                AppState.isAdminLoggedIn = false;
                Screens.show('district-password-screen');
            });
        }

        const admissionAccessBtn = document.getElementById('admin-admission-btn');
        if (admissionAccessBtn) {
            admissionAccessBtn.addEventListener('click', () => {
                AdminAdmissionSchoolSelect.init();
                Screens.show('admin-admission-school-select-screen');
            });
        }
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                const panel = document.getElementById(`admin-${tab.dataset.tab}`);
                if (panel) panel.classList.add('active');
            });
        });
        
        this.safeExecute(() => this.initZonesPanel());
        this.safeExecute(() => this.initSchoolsPanel());
        this.safeExecute(() => this.initEnrollmentPanel());
        this.safeExecute(() => this.initPSLCEPanel());
        this.safeExecute(() => this.initParticularsPanel());
        this.safeExecute(() => this.initHistoryPanel());
        this.safeExecute(() => this.initAdmissionPanel());
    },
    
    loadAdminData() {
        this.safeExecute(() => this.loadZones());
        this.safeExecute(() => this.loadSchools());
        this.safeExecute(() => this.loadEnrollment());
        this.safeExecute(() => this.loadPSLCE());
        this.safeExecute(() => this.loadParticulars());
        this.safeExecute(() => this.loadHistory());
        this.safeExecute(() => this.loadAdmissionWindow());
        this.safeExecute(() => this.loadAdmissionExports());
        this.safeExecute(() => this.populateZoneSelect());
        this.safeExecute(() => this.populateYearSelects());
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

    initAdmissionPanel() {
        const openBtn = document.getElementById('open-admission-window-btn');
        const closeBtn = document.getElementById('close-admission-window-btn');

        openBtn.addEventListener('click', async () => {
            await DataStore.addAdmissionWindow({ openTimestamp: new Date().toISOString(), closeTimestamp: null });
            this.loadAdmissionWindow();
            AdminPanel.showSuccess('Admission Window Successfully Opened');
        });

        closeBtn.addEventListener('click', async () => {
            const latest = DataStore.getLatestAdmissionWindow();
            const openTimestamp = AdmissionUtils.safeDate(latest?.openTimestamp)
                ? latest.openTimestamp
                : new Date().toISOString();

            await DataStore.addAdmissionWindow({ openTimestamp, closeTimestamp: new Date().toISOString() });
            this.loadAdmissionWindow();
            AdminPanel.showSuccess('Admission Window Successfully Closed');
        });
    },

    updateAdmissionStatusDisplay() {
        const statusBadge = document.getElementById('admission-window-status');
        if (!statusBadge) return;
        if (AppState.admissionWindow && AdmissionUtils.isOpen()) {
            statusBadge.textContent = 'OPEN';
            statusBadge.className = 'status-badge status-open';
        } else {
            statusBadge.textContent = 'CLOSED';
            statusBadge.className = 'status-badge status-closed';
        }
    },

    updateAdmissionControls() {
        const openBtn = document.getElementById('open-admission-window-btn');
        const closeBtn = document.getElementById('close-admission-window-btn');
        if (!openBtn || !closeBtn) return;

        const isOpen = AppState.admissionWindow && AdmissionUtils.isOpen();
        openBtn.disabled = isOpen;
        closeBtn.disabled = !isOpen;
        openBtn.classList.toggle('btn-disabled', isOpen);
        closeBtn.classList.toggle('btn-disabled', !isOpen);
    },

    loadAdmissionWindow() {
        AdmissionUtils.refreshAdmissionWindow();
        this.updateAdmissionStatusDisplay();
        this.updateAdmissionControls();
    },

    loadAdmissionExports() {
        const list = document.getElementById('admission-exports-list');
        if (!list) return;

        // Prefer stored exports (saved files), render them with download and delete options
        const exports = DataStore.getAdmissionExports();
        if (exports && exports.length) {
            list.innerHTML = exports.map(exp => `
                <div class="list-item" data-id="${exp.id}">
                    <div class="list-item-info">
                        <h4>${exp.schoolName || 'Unknown School'}</h4>
                        <p>File: ${exp.filename}</p>
                        <p>Total Learners: ${exp.totalLearners || 0}</p>
                        <p>${new Date(exp.timestamp).toLocaleString()}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-primary export-download" data-id="${exp.id}"><span class="button-icon">⬇️</span>Download</button>
                        <button class="btn-delete export-delete" data-id="${exp.id}"><span class="button-icon">🗑️</span>Delete</button>
                    </div>
                </div>
            `).join('');

            // Hook download buttons
            list.querySelectorAll('.export-download').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.dataset.id, 10);
                    const record = DataStore.getAdmissionExports().find(r => r.id === id);
                    if (!record) return;

                    const fileBase64 = String(record.fileBase64 || record.filebase64 || '').trim();
                    const filename = String(record.filename || '').trim();
                    if (!fileBase64 || !filename) {
                        console.error('AdminPanel.loadAdmissionExports: export record missing file data', { id, record });
                        AdminPanel.showSuccess('Download failed: saved export file data is missing. Regenerate the file.');
                        return;
                    }

                    try {
                        await AdminPanel.downloadBase64File(fileBase64, filename);
                        AdminPanel.showSuccess('Download started');
                    } catch (err) {
                        console.error(err);
                        AdminPanel.showSuccess('Failed to download file');
                    }
                });
            });

            // Hook delete buttons
            list.querySelectorAll('.export-delete').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.id, 10);
                    AdminPanel.confirmDeleteExport(id);
                });
            });
            return;
        }

        // Fallback: show per-school quick-generate downloads if no saved exports
        const schools = DataStore.getSchools();
        if (!schools.length) {
            list.innerHTML = '<p class="no-data">No saved learner records available.</p>';
            return;
        }

        const summaryHtml = schools.map(school => {
            const learners = DataStore.getAdmissionsBySchool(school.emis);
            return `
                <div class="list-item">
                    <div class="list-item-info">
                        <h4>${school.name}</h4>
                        <p>EMIS: ${school.emis}</p>
                        <p>Total Learners: ${learners.length}</p>
                    </div>
                    <div class="list-item-actions">
                        <button class="btn-primary" data-emis="${school.emis}" ${learners.length === 0 ? 'disabled' : ''}>
                            Download Excel
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        list.innerHTML = summaryHtml || '<p class="no-data">No saved learner records available.</p>';
        list.querySelectorAll('.btn-primary').forEach(button => {
            button.addEventListener('click', async () => {
                const school = DataStore.getSchoolByEMIS(button.dataset.emis || '');
                const schoolEmis = String(school?.emis || button.dataset.emis || '').trim();
                const learners = DataStore.getAdmissionsBySchool(schoolEmis);
                if (!schoolEmis || !school || learners.length === 0) {
                    console.error('Missing or invalid school EMIS for export', { schoolEmis, school });
                    AdminPanel.showSuccess('Failed to generate Excel. Invalid school selection.');
                    return;
                }
                try {
                    await AdminPanel.showLoading('Generating Excel. Please wait...');
                    const rows = learners.map(item => ({
                        'School Name': item.schoolName,
                        'Child Name': item.childName,
                        'Sex': item.sex,
                        'Admission Year': item.yearAdmission,
                        'District Number': item.districtNumber,
                        'LIN': formatAdmissionLin(item),
                        'Date of Birth': item.dateOfBirth,
                        'Age (yrs)': item.ageYears,
                        'Date of Admission': item.dateOfAdmission,
                        'ECD Attendance': item.ecdAttendance,
                        'CIN': item.cinNumber || '',
                        'Religious Denomination': item.religiousDenomination,
                        'Orphan Status': item.orphanStatus,
                        'Special Needs': item.specialNeeds || '',
                        'Parent/Guardian Name': item.parentGuardianName,
                        'Parent/Guardian Phone': item.parentGuardianPhone,
                        'Head Teacher Name': item.headTeacherName,
                        'Head Teacher Phone': item.headTeacherPhone,
                        'zEMIS Officer Name': item.zemisOfficerName,
                        'zEMIS Officer Phone': item.zemisOfficerPhone,
                        'Zone': item.zone,
                        'District of Origin': item.originDistrict,
                        'zEMIS Officer Date': item.zemisOfficerDate,
                        'Timestamp': item.timestamp
                    }));
                    const invalidRow = rows.find(row => !isValidExportLin(row.LIN));
                    if (invalidRow) {
                        AdminPanel.showSuccess('Cannot export Excel: LIN contains invalid symbols.');
                        return;
                    }
                    const wb = XLSX.utils.book_new();
                    const ws = XLSX.utils.json_to_sheet(rows);
                    XLSX.utils.book_append_sheet(wb, ws, 'Admissions');
                    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
                    const filename = `${school.name.replace(/[^a-zA-Z0-9]/g, '_')}_Admissions.xlsx`;
                    // Save metadata and binary to DataStore for later downloads
                    await DataStore.addAdmissionExport({
                        schoolEmis,
                        schoolName: school.name,
                        filename,
                        fileBase64: wbout,
                        totalLearners: learners.length
                    });

                    // Use fetch-based base64 -> blob download for maximum browser compatibility
                    await AdminPanel.downloadBase64File(wbout, filename);
                    AdminPanel.showSuccess('Excel successfully generated.');
                    this.loadAdmissionExports();
                } catch (err) {
                    console.error(err);
                    AdminPanel.showSuccess('Failed to generate Excel.');
                }
            });
        });
    },

    base64ToBlob(base64, mime) {
        const binary = atob(base64);
        const length = binary.length;
        const array = new Uint8Array(length);
        for (let i = 0; i < length; i += 1) {
            array[i] = binary.charCodeAt(i);
        }
        return new Blob([array], { type: mime });
    },

    async downloadBase64File(base64, filename) {
        if (!base64 || !filename) throw new Error('Missing file data');
        const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const blob = this.base64ToBlob(base64, mime);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    },

    confirmDeleteExport(exportId) {
        const modal = document.getElementById('confirm-delete-export-modal');
        const closeBtn = document.getElementById('close-confirm-delete');
        const cancelBtn = document.getElementById('confirm-delete-cancel');
        const yesBtn = document.getElementById('confirm-delete-yes');
        const checkbox = document.getElementById('confirm-delete-associated');
        const text = document.getElementById('confirm-delete-text');
        if (!modal) return;

        const record = DataStore.getAdmissionExports().find(r => r.id === exportId);
        text.textContent = record && record.filename ? `Are you sure you want to delete '${record.filename}'?` : 'Are you sure you want to delete this admission sheet?';
        checkbox.checked = false;

        const closeModal = () => {
            modal.classList.remove('active');
        };

        const cleanupHandlers = () => {
            closeBtn.removeEventListener('click', closeModal);
            cancelBtn.removeEventListener('click', closeModal);
            yesBtn.removeEventListener('click', onConfirm);
        };

        const onConfirm = async () => {
            const alsoDeleteAdmissions = checkbox.checked;
            try {
                // delete metadata record
                await DataStore.deleteRecord('admission_export', exportId);

                if (alsoDeleteAdmissions && record && record.schoolEmis) {
                    const admissions = DataStore.getAdmissionsBySchool(record.schoolEmis);
                    for (const a of admissions) {
                        try { await DataStore.deleteRecord('admission', a.id); } catch (e) { console.error(e); }
                    }
                }

                AdminPanel.showSuccess('Admission Sheet Deleted Successfully');
                this.loadAdmissionExports();
            } catch (err) {
                console.error(err);
                AdminPanel.showSuccess('Failed to delete admission sheet');
            } finally {
                cleanupHandlers();
                closeModal();
            }
        };

        // attach handlers
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        yesBtn.addEventListener('click', onConfirm);

        modal.classList.add('active');
    },
    
    showLoading(message, duration = 3000) {
        return new Promise(resolve => {
            const overlay = document.getElementById('loading-overlay');
            const messageDisplay = document.getElementById('loading-message');
            if (!overlay || !messageDisplay) {
                resolve();
                return;
            }
            messageDisplay.textContent = message;
            overlay.classList.add('active');
            setTimeout(() => {
                overlay.classList.remove('active');
                resolve();
            }, duration);
        });
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
    AdmissionUtils.refreshAdmissionWindow();
    SplashScreen.init();
    DistrictPasswordScreen.init();
    AdmissionOptionScreen.init();
    ZoneSearchScreen.init();
    EmisSearchScreen.init();
    AdminPanel.init();
});
