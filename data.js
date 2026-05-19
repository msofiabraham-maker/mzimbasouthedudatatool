const DataStore = {
    zones: [],
    schools: [],
    enrollment: [],
    pslceResults: [],
    schoolParticulars: [],
    uploadHistory: [],

    init() {
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
    },

    getZones() {
        const zones = JSON.parse(localStorage.getItem('mzimba_zones')) || this.zones;
        return zones.sort((a, b) => a.name.localeCompare(b.name));
    },

    getSchools() {
        const schools = JSON.parse(localStorage.getItem('mzimba_schools')) || this.schools;
        return schools.sort((a, b) => a.name.localeCompare(b.name));
    },

    getSchoolsByZone(zoneName) {
        const schools = this.getSchools();
        return schools.filter(s => s.zone === zoneName);
    },

    getSchoolByEMIS(emis) {
        const schools = this.getSchools();
        return schools.find(s => s.emis === emis);
    },

    getParticularsByEMIS(emis) {
        const particulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        return particulars.filter(p => p.emis === emis);
    },

    addZone(zoneName) {
        const zones = this.getZones();
        const existingZone = zones.find(z => z.name.toLowerCase() === zoneName.toLowerCase());
        if (existingZone) {
            throw new Error('Zone with this name already exists');
        }
        const newZone = { id: Date.now(), name: zoneName };
        zones.push(newZone);
        localStorage.setItem('mzimba_zones', JSON.stringify(zones));
        return newZone;
    },

    addSchool(emis, name, zone, password, districtNumber, divisionNumber, constituency, ta, postalAddress, distanceFromNearestPrimary, distanceToTDC, yearEstablished) {
        const schools = this.getSchools();
        const existingSchool = schools.find(s => s.emis === emis || s.name.toLowerCase() === name.toLowerCase());
        if (existingSchool) {
            throw new Error('School with this EMIS or name already exists');
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
            yearEstablished 
        };
        schools.push(newSchool);
        localStorage.setItem('mzimba_schools', JSON.stringify(schools));
        return newSchool;
    },

    addEnrollment(data) {
        const enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        const school = this.getSchoolByEMIS(data.emis);
        enrollment.push({ 
            id: Date.now(), 
            ...data, 
            schoolName: school ? school.name : '',
            zone: school ? school.zone : '',
            timestamp: new Date().toISOString() 
        });
        localStorage.setItem('mzimba_enrollment', JSON.stringify(enrollment));
        this.addToUploadHistory('Enrollment', data.emis);
    },

    addPSLCEResult(data) {
        const pslce = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        const school = this.getSchoolByEMIS(data.emis);
        pslce.push({ 
            id: Date.now(), 
            ...data, 
            schoolName: school ? school.name : '',
            zone: school ? school.zone : '',
            timestamp: new Date().toISOString() 
        });
        localStorage.setItem('mzimba_pslce', JSON.stringify(pslce));
        this.addToUploadHistory('PSLCE Results', data.emis);
    },

    addSchoolParticulars(data) {
        const particulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        particulars.push({ id: Date.now(), ...data, timestamp: new Date().toISOString() });
        localStorage.setItem('mzimba_particulars', JSON.stringify(particulars));
        this.addToUploadHistory('School Particulars', data.emis);
    },

    addToUploadHistory(category, emis) {
        const history = JSON.parse(localStorage.getItem('mzimba_uploads')) || [];
        history.push({ id: Date.now(), category, emis, timestamp: new Date().toISOString() });
        localStorage.setItem('mzimba_uploads', JSON.stringify(history));
    },

    getUploadHistory() {
        return JSON.parse(localStorage.getItem('mzimba_uploads')) || [];
    },

    getEnrollmentByEMIS(emis) {
        const enrollment = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
        return enrollment.filter(e => e.emis === emis);
    },

    getPSLCEByEMIS(emis) {
        const pslce = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        return pslce.filter(p => p.emis === emis);
    },

    getParticularsByEMIS(emis) {
        const particulars = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
        return particulars.filter(p => p.emis === emis);
    },

    deleteRecord(type, id) {
        let data;
        let key;
        
        switch(type) {
            case 'enrollment':
                data = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
                key = 'mzimba_enrollment';
                break;
            case 'pslce':
                data = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
                key = 'mzimba_pslce';
                break;
            case 'particulars':
                data = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
                key = 'mzimba_particulars';
                break;
            case 'zone':
                data = this.getZones();
                key = 'mzimba_zones';
                break;
            case 'school':
                data = this.getSchools();
                key = 'mzimba_schools';
                break;
            default:
                return;
        }
        
        const filtered = data.filter(item => item.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
    },

    editRecord(type, id, newData) {
        let data;
        let key;
        
        switch(type) {
            case 'enrollment':
                data = JSON.parse(localStorage.getItem('mzimba_enrollment')) || [];
                key = 'mzimba_enrollment';
                break;
            case 'pslce':
                data = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
                key = 'mzimba_pslce';
                break;
            case 'particulars':
                data = JSON.parse(localStorage.getItem('mzimba_particulars')) || [];
                key = 'mzimba_particulars';
                break;
            case 'zone':
                data = this.getZones();
                key = 'mzimba_zones';
                break;
            case 'school':
                data = this.getSchools();
                key = 'mzimba_schools';
                break;
            default:
                return;
        }
        
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...newData };
            localStorage.setItem(key, JSON.stringify(data));
        }
    }
};

DataStore.init();
