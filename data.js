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

    async init() {
        this.useSupabase = Boolean(Config.supabaseUrl && Config.supabaseAnonKey);
        this.connectionStatus = this.useSupabase ? 'Connecting to Supabase...' : 'Local storage fallback';

        if (this.useSupabase) {
            if (typeof supabase === 'undefined') {
                console.warn('Supabase client is not loaded. Falling back to localStorage.');
                this.useSupabase = false;
                this.connectionStatus = 'Supabase client missing, using local storage';
                this.initLocalStorage();
                return;
            }

            this.supabase = supabase.createClient(Config.supabaseUrl, Config.supabaseAnonKey);
            await this.loadAllFromSupabase();
        } else {
            this.initLocalStorage();
        }
    },

    initLocalStorage() {
        if (!localStorage.getItem('mzimba_zones')) {
            localStorage.setItem('mzimba_zones', JSON.stringify(this.zones));
        }
        if (!localStorage.getItem('mzimba_schools')) {
            localStorage.setItem('mzimba_schools', JSON.stringify(this.schools));
        }
        if (!localStorage.getItem('mzimba_enrollment')) {
            localStorage.setItem('mzimba_enrollment', JSON.stringify(this.enrollment));
        }
        if (!localStorage.getItem('mzimba_pslce')) {
            localStorage.setItem('mzimba_pslce', JSON.stringify(this.pslceResults));
        }
        if (!localStorage.getItem('mzimba_particulars')) {
            localStorage.setItem('mzimba_particulars', JSON.stringify(this.schoolParticulars));
        }
        if (!localStorage.getItem('mzimba_uploads')) {
            localStorage.setItem('mzimba_uploads', JSON.stringify(this.uploadHistory));
        }

        this.zones = JSON.parse(localStorage.getItem('mzimba_zones')) || [];
        this.schools = JSON.parse(localStorage.getItem('mzimba_schools')) || [];
        this.enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        this.pslceResults = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        this.schoolParticulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        this.uploadHistory = JSON.parse(localStorage.getItem('mzimba_uploads')) || [];
    },

    async loadAllFromSupabase() {
        try {
            const zonesResponse = await this.supabase.from('zones').select('*').order('name');
            const schoolsResponse = await this.supabase.from('schools').select('*').order('name');
            const enrollmentResponse = await this.supabase.from('enrollment').select('*').order('timestamp', { ascending: false });
            const pslceResponse = await this.supabase.from('pslce_results').select('*').order('timestamp', { ascending: false });
            const particularsResponse = await this.supabase.from('school_particulars').select('*').order('timestamp', { ascending: false });
            const uploadsResponse = await this.supabase.from('upload_history').select('*').order('timestamp', { ascending: false });

            if (zonesResponse.error) {
                console.error('Supabase zones load error:', zonesResponse.error);
            }
            if (schoolsResponse.error) {
                console.error('Supabase schools load error:', schoolsResponse.error);
            }
            if (enrollmentResponse.error) {
                console.error('Supabase enrollment load error:', enrollmentResponse.error);
            }
            if (pslceResponse.error) {
                console.error('Supabase PSLCE load error:', pslceResponse.error);
            }
            if (particularsResponse.error) {
                console.error('Supabase particulars load error:', particularsResponse.error);
            }
            if (uploadsResponse.error) {
                console.error('Supabase upload history load error:', uploadsResponse.error);
            }

            this.zones = zonesResponse.data || [];
            this.schools = schoolsResponse.data || [];
            this.enrollment = enrollmentResponse.data || [];
            this.pslceResults = pslceResponse.data || [];
            this.schoolParticulars = particularsResponse.data || [];
            this.uploadHistory = uploadsResponse.data || [];

            localStorage.setItem('mzimba_zones', JSON.stringify(this.zones));
            localStorage.setItem('mzimba_schools', JSON.stringify(this.schools));
            localStorage.setItem('mzimba_enrollment', JSON.stringify(this.enrollment));
            localStorage.setItem('mzimba_pslce', JSON.stringify(this.pslceResults));
            localStorage.setItem('mzimba_particulars', JSON.stringify(this.schoolParticulars));
            localStorage.setItem('mzimba_uploads', JSON.stringify(this.uploadHistory));

            this.connectionStatus = 'Supabase connected';
        } catch (error) {
            console.error('Failed to load data from Supabase:', error);
            this.connectionStatus = 'Supabase load failed, using local storage';
            this.initLocalStorage();
        }
    },

    _typeConfig(type) {
        const map = {
            zone: { table: 'zones', storage: 'mzimba_zones', array: 'zones' },
            school: { table: 'schools', storage: 'mzimba_schools', array: 'schools' },
            enrollment: { table: 'enrollment', storage: 'mzimba_enrollment', array: 'enrollment' },
            pslce: { table: 'pslce_results', storage: 'mzimba_pslce', array: 'pslceResults' },
            particulars: { table: 'school_particulars', storage: 'mzimba_particulars', array: 'schoolParticulars' },
            history: { table: 'upload_history', storage: 'mzimba_uploads', array: 'uploadHistory' }
        };
        return map[type];
    },

    _syncLocal(key, array) {
        localStorage.setItem(key, JSON.stringify(array));
    },

    getConnectionStatus() {
        return this.connectionStatus;
    },

    getZones() {
        return [...this.zones].sort((a, b) => a.name.localeCompare(b.name));
    },

    getSchools() {
        return [...this.schools].sort((a, b) => a.name.localeCompare(b.name));
    },

    getSchoolsByZone(zoneName) {
        return this.getSchools().filter(s => s.zone === zoneName);
    },

    getSchoolByEMIS(emis) {
        return this.getSchools().find(s => s.emis === emis);
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

    getParticularsByEMIS(emis) {
        return this.getSchoolParticulars().filter(p => p.emis === emis);
    },

    addZone(zoneName) {
        const zones = this.getZones();
        const existingZone = zones.find(z => z.name.toLowerCase() === zoneName.toLowerCase());
        if (existingZone) {
            throw new Error('Zone with this name already exists');
        }

        if (this.useSupabase) {
            return this.supabase.from('zones').insert([{ name: zoneName }]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.zones.push(saved);
                this._syncLocal('mzimba_zones', this.zones);
                return saved;
            });
        }

        const newZone = { id: Date.now(), name: zoneName };
        zones.push(newZone);
        this.zones = zones;
        this._syncLocal('mzimba_zones', zones);
        return newZone;
    },

    addSchool(emis, name, zone, password, districtNumber, divisionNumber, constituency, ta, postalAddress, distanceFromNearestPrimary, distanceToTDC, distanceToDEM, yearEstablished) {
        const schools = this.getSchools();
        const existingSchool = schools.find(s => s.emis === emis || s.name.toLowerCase() === name.toLowerCase());
        if (existingSchool) {
            throw new Error('School with this EMIS number or name already exists in the database');
        }

        if (this.useSupabase) {
            return this.supabase.from('schools').insert([{
                emis,
                name,
                zone,
                password,
                districtNumber,
                divisionNumber,
                constituency,
                ta,
                postalAddress,
                distanceFromNearestPrimary,
                distanceToTDC,
                distanceToDEM,
                yearEstablished
            }]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.schools.push(saved);
                this._syncLocal('mzimba_schools', this.schools);
                return saved;
            });
        }

        const newSchool = {
            id: Date.now(),
            emis,
            name,
            zone,
            password,
            districtNumber,
            divisionNumber,
            constituency,
            ta,
            postalAddress,
            distanceFromNearestPrimary,
            distanceToTDC,
            distanceToDEM,
            yearEstablished
        };
        schools.push(newSchool);
        this.schools = schools;
        this._syncLocal('mzimba_schools', schools);
        return newSchool;
    },

    addEnrollment(data) {
        const school = this.getSchoolByEMIS(data.emis);
        const record = {
            id: Date.now(),
            ...data,
            schoolName: school ? school.name : '',
            zone: school ? school.zone : '',
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            return this.supabase.from('enrollment').insert([record]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.enrollment.unshift(saved);
                this._syncLocal('mzimba_enrollment', this.enrollment);
                this.addToUploadHistory('Enrollment', data.emis);
                return saved;
            });
        }

        this.enrollment.unshift(record);
        this._syncLocal('mzimba_enrollment', this.enrollment);
        this.addToUploadHistory('Enrollment', data.emis);
        return record;
    },

    addPSLCEResult(data) {
        const school = this.getSchoolByEMIS(data.emis);
        const record = {
            id: Date.now(),
            ...data,
            schoolName: school ? school.name : '',
            zone: school ? school.zone : '',
            timestamp: new Date().toISOString()
        };

        if (this.useSupabase) {
            return this.supabase.from('pslce_results').insert([record]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.pslceResults.unshift(saved);
                this._syncLocal('mzimba_pslce', this.pslceResults);
                this.addToUploadHistory('PSLCE Results', data.emis);
                return saved;
            });
        }

        this.pslceResults.unshift(record);
        this._syncLocal('mzimba_pslce', this.pslceResults);
        this.addToUploadHistory('PSLCE Results', data.emis);
        return record;
    },

    addSchoolParticulars(data) {
        const record = { id: Date.now(), ...data, timestamp: new Date().toISOString() };

        if (this.useSupabase) {
            return this.supabase.from('school_particulars').insert([record]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.schoolParticulars.unshift(saved);
                this._syncLocal('mzimba_particulars', this.schoolParticulars);
                this.addToUploadHistory('School Particulars', data.emis);
                return saved;
            });
        }

        this.schoolParticulars.unshift(record);
        this._syncLocal('mzimba_particulars', this.schoolParticulars);
        this.addToUploadHistory('School Particulars', data.emis);
        return record;
    },

    addToUploadHistory(category, emis) {
        const record = { id: Date.now(), category, emis, timestamp: new Date().toISOString() };

        if (this.useSupabase) {
            return this.supabase.from('upload_history').insert([record]).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                const saved = result.data[0];
                this.uploadHistory.unshift(saved);
                this._syncLocal('mzimba_uploads', this.uploadHistory);
                return saved;
            });
        }

        this.uploadHistory.unshift(record);
        this._syncLocal('mzimba_uploads', this.uploadHistory);
        return record;
    },

    getUploadHistory() {
        return [...this.uploadHistory];
    },

    getEnrollmentByEMIS(emis) {
        return this.enrollment.filter(e => e.emis === emis);
    },

    getPSLCEByEMIS(emis) {
        return this.pslceResults.filter(p => p.emis === emis);
    },

    deleteRecord(type, id) {
        const config = this._typeConfig(type);
        if (!config) {
            return;
        }

        const removeFromArray = (array) => array.filter(item => item.id !== id);

        if (this.useSupabase) {
            return this.supabase.from(config.table).delete().eq('id', id).then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                this[config.array] = removeFromArray(this[config.array]);
                this._syncLocal(config.storage, this[config.array]);
                return true;
            });
        }

        this[config.array] = removeFromArray(this[config.array]);
        this._syncLocal(config.storage, this[config.array]);
        return true;
    },

    editRecord(type, id, newData) {
        const config = this._typeConfig(type);
        if (!config) {
            return;
        }

        const updateArray = (array) => {
            const index = array.findIndex(item => item.id === id);
            if (index !== -1) {
                array[index] = { ...array[index], ...newData };
            }
            return array;
        };

        if (this.useSupabase) {
            return this.supabase.from(config.table).update(newData).eq('id', id).select().then(result => {
                if (result.error) {
                    throw new Error(result.error.message);
                }
                this[config.array] = updateArray(this[config.array]);
                this._syncLocal(config.storage, this[config.array]);
                return result.data[0];
            });
        }

        this[config.array] = updateArray(this[config.array]);
        this._syncLocal(config.storage, this[config.array]);
        return this[config.array].find(item => item.id === id);
    }
};
