const DataStore = {
    supabase: null,
    useSupabase: false,
    connectionStatus: 'Unknown',

    zones: [],
    schools: [],
    enrollment: [],
    pslceResults: [],
    schoolParticulars: [],
    uploadHistory: [],

    // =========================
    // INITIALIZATION (SAFE)
    // =========================
    async init() {
        if (typeof Config === 'undefined') {
            console.error('Config.js not loaded');
            this.initLocalStorage();
            this.expose();
            return;
        }

        this.expose();
        this.useSupabase = Boolean(Config.supabaseUrl && Config.supabaseAnonKey);
        this.connectionStatus = this.useSupabase
            ? 'Connecting to Supabase...'
            : 'Local storage fallback';

        if (this.useSupabase) {
            if (typeof supabase === 'undefined') {
                console.warn('Supabase client missing, switching to localStorage');
                this.useSupabase = false;
                this.initLocalStorage();
                return;
            }

            this.supabase = supabase.createClient(
                Config.supabaseUrl,
                Config.supabaseAnonKey
            );

            await this.loadAllFromSupabase();
        } else {
            this.initLocalStorage();
        }
    },

    // =========================
    // GLOBAL EXPOSURE (CRITICAL FIX)
    // =========================
    expose() {
        window.DataStore = this;
    },

    // =========================
    // MAPPERS (CLEAN CONTRACT)
    // =========================
    _mapSchoolToDB(s) {
        const payload = {
            emis: s.emis,
            name: s.name,
            zone: s.zone,
            password: s.password,
            districtNumber: s.districtNumber,
            divisionNumber: s.divisionNumber,
            constituency: s.constituency,
            ta: s.ta,
            postalAddress: s.postalAddress,
            distanceFromNearestPrimary: s.distanceFromNearestPrimary,
            distanceToTDC: s.distanceToTDC,
            distanceToDEM: s.distanceToDEM,
            yearEstablished: s.yearEstablished
        };
        return this._stripNullValues(payload);
    },

    _mapSchoolFromDB(s) {
        if (!s || typeof s !== 'object') return s;
        return {
            ...s,
            districtNumber: s.districtNumber ?? s.districtnumber ?? null,
            divisionNumber: s.divisionNumber ?? s.divisionnumber ?? null,
            constituency: s.constituency ?? null,
            ta: s.ta ?? null,
            postalAddress: s.postalAddress ?? s.postaladdress ?? null,
            distanceFromNearestPrimary: s.distanceFromNearestPrimary ?? s.distancefromnearestprimary ?? null,
            distanceToTDC: s.distanceToTDC ?? s.distancetotdc ?? null,
            distanceToDEM: s.distanceToDEM ?? s.distancetodem ?? null,
            yearEstablished: s.yearEstablished ?? s.yearestablished ?? null
        };
    },

    // =========================
    // LOCAL STORAGE
    // =========================
    initLocalStorage() {
        const keys = [
            'mzimba_zones',
            'mzimba_schools',
            'mzimba_enrollment',
            'mzimba_pslce',
            'mzimba_particulars',
            'mzimba_uploads'
        ];

        keys.forEach(k => {
            if (!localStorage.getItem(k)) {
                localStorage.setItem(k, JSON.stringify([]));
            }
        });

        try {
            this.zones = JSON.parse(localStorage.getItem('mzimba_zones')) || [];
        } catch {
            this.zones = [];
        }

        try {
            this.schools = JSON.parse(localStorage.getItem('mzimba_schools')) || [];
        } catch {
            this.schools = [];
        }

        try {
            this.enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        } catch {
            this.enrollment = [];
        }

        try {
            this.pslceResults = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        } catch {
            this.pslceResults = [];
        }

        try {
            this.schoolParticulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        } catch {
            this.schoolParticulars = [];
        }

        try {
            this.uploadHistory = JSON.parse(localStorage.getItem('mzimba_uploads')) || [];
        } catch {
            this.uploadHistory = [];
        }
        this.connectionStatus = 'Local storage fallback';
    },

    // =========================
    // INTERNAL HELPERS
    // =========================
    _syncLocal(type) {
        const keyMap = {
            zone: 'mzimba_zones',
            school: 'mzimba_schools',
            enrollment: 'mzimba_enrollment',
            pslce: 'mzimba_pslce',
            particulars: 'mzimba_particulars',
            history: 'mzimba_uploads'
        };

        const arrayMap = {
            zone: this.zones,
            school: this.schools,
            enrollment: this.enrollment,
            pslce: this.pslceResults,
            particulars: this.schoolParticulars,
            history: this.uploadHistory
        };

        const storageKey = keyMap[type];
        const payload = arrayMap[type];
        if (!storageKey || !payload) return;

        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch (err) {
            console.error('Failed to sync local storage:', err);
        }
    },

    _typeConfig(type) {
        const config = {
            zone: { table: 'zones', array: 'zones' },
            school: { table: 'schools', array: 'schools' },
            enrollment: { table: 'enrollment', array: 'enrollment' },
            pslce: { table: 'pslce_results', array: 'pslceResults' },
            particulars: { table: 'school_particulars', array: 'schoolParticulars' },
            history: { table: 'upload_history', array: 'uploadHistory' }
        };
        return config[type] || null;
    },

    _normalizeRecord(record) {
        if (!record || typeof record !== 'object') return record;
        return {
            ...record,
            districtNumber: record.districtNumber ?? record.districtnumber ?? null,
            divisionNumber: record.divisionNumber ?? record.divisionnumber ?? null,
            postalAddress: record.postalAddress ?? record.postaladdress ?? null,
            distanceFromNearestPrimary: record.distanceFromNearestPrimary ?? record.distancefromnearestprimary ?? null,
            distanceToTDC: record.distanceToTDC ?? record.distancetotdc ?? null,
            distanceToDEM: record.distanceToDEM ?? record.distancetodem ?? null,
            yearEstablished: record.yearEstablished ?? record.yearestablished ?? null
        };
    },

    _stripNullValues(payload) {
        return Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
        );
    },

    _stripEmptyStrings(payload) {
        return Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== '')
        );
    },

    async _safeSupabaseInsert(table, rows) {
        let insertRows = rows.map(row => this._stripEmptyStrings(this._stripNullValues(row)));

        while (true) {
            const result = await this.supabase.from(table).insert(insertRows).select('id');
            if (!result.error) {
                return result;
            }

            const missingField = result.error.message.match(/could not find\s+the\s+'(.*?)'\s+column/i)?.[1];
            if (!missingField) {
                return result;
            }

            const nextRows = insertRows.map(row => {
                if (Object.prototype.hasOwnProperty.call(row, missingField)) {
                    const copy = { ...row };
                    delete copy[missingField];
                    return copy;
                }
                return row;
            });

            if (JSON.stringify(nextRows) === JSON.stringify(insertRows)) {
                return result;
            }
            insertRows = nextRows;
        }
    },

    // =========================
    // SUPABASE LOADING
    // =========================
    async loadAllFromSupabase() {
        try {
            const [zones, enrollment, pslce, particulars, uploads] =
                await Promise.all([
                    this.supabase.from('zones').select('*'),
                    this.supabase.from('enrollment').select('*'),
                    this.supabase.from('pslce_results').select('*'),
                    this.supabase.from('school_particulars').select('*'),
                    this.supabase.from('upload_history').select('*')
                ]);

            const schoolCoreFields = [
                'id', 'emis', 'name', 'zone', 'password',
                'districtNumber', 'divisionNumber', 'constituency', 'ta', 'postalAddress',
                'yearEstablished'
            ];
            const optionalSchoolFields = [
                'distanceFromNearestPrimary', 'distanceToTDC', 'distanceToDEM'
            ];

            let schools = await this.supabase.from('schools').select('*');
            let remainingOptionalFields = [...optionalSchoolFields];
            while (schools.error) {
                const missingField = schools.error.message.match(/could not find\s+the\s+'(.*?)'\s+column/i)?.[1];
                if (!missingField || !remainingOptionalFields.includes(missingField)) {
                    break;
                }
                remainingOptionalFields = remainingOptionalFields.filter(field => field !== missingField);
                const selectFields = schoolCoreFields.concat(remainingOptionalFields).join(',');
                console.warn(`Supabase schools query failed on optional column '${missingField}', retrying with safe fields`);
                schools = await this.supabase.from('schools').select(selectFields);
            }

            const errors = [zones, schools, enrollment, pslce, particulars, uploads]
                .map(r => r.error)
                .filter(Boolean);
            if (errors.length > 0) {
                console.error('Supabase query error', errors);
                throw new Error('Supabase query failure');
            }

            this.zones = zones.data || [];
            this.schools = (schools.data || []).map(this._mapSchoolFromDB.bind(this));
            this.enrollment = enrollment.data || [];
            this.pslceResults = pslce.data || [];
            this.schoolParticulars = particulars.data || [];
            this.uploadHistory = uploads.data || [];
            this.connectionStatus = 'Supabase connected';
            this._syncLocal('zone');
            this._syncLocal('school');
            this._syncLocal('enrollment');
            this._syncLocal('pslce');
            this._syncLocal('particulars');
            this._syncLocal('history');
        } catch (err) {
            console.error('Supabase load failed:', err);
            this.useSupabase = false;
            this.initLocalStorage();
        }
    },

    // =========================
    // APP.JS COMPATIBILITY API (FIX CRASHES)
    // =========================
    getUploadHistory() {
        return [...this.uploadHistory];
    },

    getEnrollment() {
        return [...this.enrollment];
    },

    getPSLCE() {
        return [...this.pslceResults];
    },

    getSchoolParticulars() {
        return [...this.schoolParticulars];
    },

    // =========================
    // BASIC GETTERS
    // =========================
    getZones() {
        return [...this.zones];
    },

    getSchools() {
        return [...this.schools];
    },

    getSchoolsByZone(zone) {
        if (!zone) return [];
        return this.schools.filter(s => s.zone === zone);
    },

    _matchEMIS(value, target) {
        if (value === null || value === undefined || target === null || target === undefined) {
            return false;
        }
        return String(value).trim() === String(target).trim();
    },

    getSchoolByEMIS(emis) {
        return this.schools.find(s => this._matchEMIS(s.emis, emis));
    },

    getEnrollmentByEMIS(emis) {
        if (!emis) return [];
        return this.enrollment.filter(item => this._matchEMIS(item.emis, emis));
    },

    getPSLCEByEMIS(emis) {
        if (!emis) return [];
        return this.pslceResults.filter(item => this._matchEMIS(item.emis, emis));
    },

    getParticularsByEMIS(emis) {
        if (!emis) return [];
        return this.schoolParticulars.filter(item => this._matchEMIS(item.emis, emis));
    },

    getConnectionStatus() {
        return this.connectionStatus;
    },

    // =========================
    // ADD / UPDATE / DELETE
    // =========================
    async addSchool(
        emis, name, zone, password,
        districtNumber, divisionNumber, constituency, ta, postalAddress,
        distanceFromNearestPrimary, distanceToTDC, distanceToDEM, yearEstablished
    ) {
        if (!emis || !name || !zone || !password) {
            throw new Error('EMIS, school name, zone, and password are required');
        }

        const exists = this.schools.find(
            s => s.emis === emis || s.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            throw new Error('School already exists');
        }

        const school = {
            emis,
            name,
            zone,
            password,
            districtNumber: districtNumber || null,
            divisionNumber: divisionNumber || null,
            constituency: constituency || null,
            ta: ta || null,
            postalAddress: postalAddress || null,
            distanceFromNearestPrimary: distanceFromNearestPrimary || null,
            distanceToTDC: distanceToTDC || null,
            distanceToDEM: distanceToDEM || null,
            yearEstablished: yearEstablished ? parseInt(yearEstablished, 10) || null : null
        };

        if (this.useSupabase) {
            const payload = this._mapSchoolToDB(school);
            const res = await this._safeSupabaseInsert('schools', [payload]);
            if (res.error) {
                throw new Error(res.error.message);
            }
            const saved = { id: res.data?.[0]?.id || Date.now(), ...school };
            this.schools.push(saved);
            this._syncLocal('school');
            return saved;
        }

        school.id = Date.now();
        this.schools.push(school);
        this._syncLocal('school');
        return school;
    },

    async addZone(zoneName) {
        if (!zoneName || !zoneName.trim()) {
            throw new Error('Zone name is required');
        }

        const normalizedName = zoneName.trim();
        if (this.zones.some(z => z.name.toLowerCase() === normalizedName.toLowerCase())) {
            throw new Error('Zone already exists');
        }

        const zone = { name: normalizedName };
        if (this.useSupabase) {
            const result = await this._safeSupabaseInsert('zones', [zone]);
            if (result.error) {
                throw new Error(result.error.message);
            }
            const saved = { id: result.data?.[0]?.id || Date.now(), ...zone };
            this.zones.push(saved);
            this._syncLocal('zone');
            return saved;
        }

        zone.id = Date.now();
        this.zones.push(zone);
        this._syncLocal('zone');
        return zone;
    },

    async addEnrollment(data) {
        if (!data || !data.emis || !data.year) {
            throw new Error('EMIS and year are required for enrollment');
        }

        const school = this.getSchoolByEMIS(data.emis);
        const record = {
            emis: data.emis,
            year: parseInt(data.year, 10) || null,
            std1m: parseInt(data.std1m, 10) || 0,
            std1f: parseInt(data.std1f, 10) || 0,
            std2m: parseInt(data.std2m, 10) || 0,
            std2f: parseInt(data.std2f, 10) || 0,
            std3m: parseInt(data.std3m, 10) || 0,
            std3f: parseInt(data.std3f, 10) || 0,
            std4m: parseInt(data.std4m, 10) || 0,
            std4f: parseInt(data.std4f, 10) || 0,
            std5m: parseInt(data.std5m, 10) || 0,
            std5f: parseInt(data.std5f, 10) || 0,
            std6m: parseInt(data.std6m, 10) || 0,
            std6f: parseInt(data.std6f, 10) || 0,
            std7m: parseInt(data.std7m, 10) || 0,
            std7f: parseInt(data.std7f, 10) || 0,
            std8m: parseInt(data.std8m, 10) || 0,
            std8f: parseInt(data.std8f, 10) || 0,
            totalM: parseInt(data.totalM, 10) || 0,
            totalF: parseInt(data.totalF, 10) || 0,
            schoolName: school ? school.name : undefined,
            zone: school ? school.zone : undefined,
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            const result = await this._safeSupabaseInsert('enrollment', [record]);
            if (result.error) {
                throw new Error(result.error.message);
            }
            const saved = { id: result.data?.[0]?.id || Date.now(), ...record };
            this.enrollment.unshift(saved);
            this._syncLocal('enrollment');
            await this.addToUploadHistory('Enrollment', data.emis);
            return saved;
        }

        record.id = Date.now();
        this.enrollment.unshift(record);
        this._syncLocal('enrollment');
        await this.addToUploadHistory('Enrollment', data.emis);
        return record;
    },

    async addPSLCEResult(data) {
        if (!data || !data.emis || !data.year) {
            throw new Error('EMIS and year are required for PSLCE results');
        }

        const school = this.getSchoolByEMIS(data.emis);
        const record = {
            emis: data.emis,
            year: parseInt(data.year, 10) || null,
            enteredM: parseInt(data.enteredM, 10) || 0,
            enteredF: parseInt(data.enteredF, 10) || 0,
            satM: parseInt(data.satM, 10) || 0,
            satF: parseInt(data.satF, 10) || 0,
            passedM: parseInt(data.passedM, 10) || 0,
            passedF: parseInt(data.passedF, 10) || 0,
            failedM: parseInt(data.failedM, 10) || 0,
            failedF: parseInt(data.failedF, 10) || 0,
            nationalSecM: parseInt(data.nationalSecM, 10) || 0,
            nationalSecF: parseInt(data.nationalSecF, 10) || 0,
            districtSsM: parseInt(data.districtSsM, 10) || 0,
            districtSsF: parseInt(data.districtSsF, 10) || 0,
            daySecM: parseInt(data.daySecM, 10) || 0,
            daySecF: parseInt(data.daySecF, 10) || 0,
            cdssM: parseInt(data.cdssM, 10) || 0,
            cdssF: parseInt(data.cdssF, 10) || 0,
            totalSelectedM: parseInt(data.totalSelectedM, 10) || 0,
            totalSelectedF: parseInt(data.totalSelectedF, 10) || 0,
            schoolName: school ? school.name : undefined,
            zone: school ? school.zone : undefined,
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            const result = await this._safeSupabaseInsert('pslce_results', [record]);
            if (result.error) {
                throw new Error(result.error.message);
            }
            const saved = { id: result.data?.[0]?.id || Date.now(), ...record };
            this.pslceResults.unshift(saved);
            this._syncLocal('pslce');
            await this.addToUploadHistory('PSLCE', data.emis);
            return saved;
        }

        record.id = Date.now();
        this.pslceResults.unshift(record);
        this._syncLocal('pslce');
        await this.addToUploadHistory('PSLCE', data.emis);
        return record;
    },

    async addSchoolParticulars(data) {
        if (!data || !data.emis || !data.headmaster || !data.phone || !data.email || !data.address) {
            throw new Error('All school particulars fields are required');
        }

        const record = {
            emis: data.emis,
            headmaster: data.headmaster,
            phone: data.phone,
            email: data.email,
            address: data.address,
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            const result = await this._safeSupabaseInsert('school_particulars', [record]);
            if (result.error) {
                throw new Error(result.error.message);
            }
            const saved = { id: result.data?.[0]?.id || Date.now(), ...record };
            this.schoolParticulars.unshift(saved);
            this._syncLocal('particulars');
            await this.addToUploadHistory('School Particulars', data.emis);
            return saved;
        }

        record.id = Date.now();
        this.schoolParticulars.unshift(record);
        this._syncLocal('particulars');
        await this.addToUploadHistory('School Particulars', data.emis);
        return record;
    },

    async addToUploadHistory(category, emis) {
        const record = {
            category,
            emis,
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            const result = await this._safeSupabaseInsert('upload_history', [record]);
            if (result.error) {
                throw new Error(result.error.message);
            }
            const saved = { id: result.data?.[0]?.id || Date.now(), ...record };
            this.uploadHistory.unshift(saved);
            this._syncLocal('history');
            return saved;
        }

        record.id = Date.now();
        this.uploadHistory.unshift(record);
        this._syncLocal('history');
        return record;
    },

    async deleteRecord(type, id) {
        const config = this._typeConfig(type);
        if (!config) {
            throw new Error('Invalid record type');
        }

        if (this.useSupabase) {
            const result = await this.supabase.from(config.table).delete().eq('id', id);
            if (result.error) {
                throw new Error(result.error.message);
            }
        }

        this[config.array] = this[config.array].filter(item => item.id !== id);
        this._syncLocal(type);
    },

    async editRecord(type, id, changes) {
        const config = this._typeConfig(type);
        if (!config) {
            throw new Error('Invalid record type');
        }

        let payload = { ...changes };
        if (type === 'school') {
            payload = this._mapSchoolToDB(payload);
        }

        if (this.useSupabase) {
            let updatePayload = { ...payload };
            while (true) {
                const result = await this.supabase.from(config.table).update(updatePayload).eq('id', id).select('id');
                if (!result.error) {
                    break;
                }
                const missingField = result.error.message.match(/could not find\s+the\s+'(.*?)'\s+column/i)?.[1];
                if (!missingField || !Object.prototype.hasOwnProperty.call(updatePayload, missingField)) {
                    throw new Error(result.error.message);
                }
                delete updatePayload[missingField];
            }
            const updated = { id, ...changes };
            this[config.array] = this[config.array].map(item => item.id === id
                ? { ...item, ...updated }
                : item
            );
            this._syncLocal(type);
            return this[config.array].find(item => item.id === id);
        }

        this[config.array] = this[config.array].map(item => item.id === id ? { ...item, ...changes } : item);
        this._syncLocal(type);
        return this[config.array].find(item => item.id === id);
    }
};

// 🔥 CRITICAL: expose globally
window.DataStore = DataStore;