const DataStore = {
    zones: [
        { id: 1, name: 'Emfeni Zone' },
        { id: 2, name: 'Kamwendo Zone' },
        { id: 3, name: 'Mzimba Zone' },
        { id: 4, name: 'Euthini Zone' },
        { id: 5, name: 'Manyamula Zone' },
        { id: 6, name: 'Kaporo Zone' },
        { id: 7, name: 'Mbalachanda Zone' },
        { id: 8, name: 'Mzuzu Zone' }
    ],

    schools: [
        { id: 1, emis: '1001', name: 'Emfeni Primary School', zone: 'Emfeni Zone', password: 'school123', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 2, emis: '1002', name: 'Kamwendo Primary School', zone: 'Kamwendo Zone', password: 'school456', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 3, emis: '1003', name: 'Mzimba Primary School', zone: 'Mzimba Zone', password: 'school789', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 4, emis: '1004', name: 'Euthini Primary School', zone: 'Euthini Zone', password: 'school101', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 5, emis: '1005', name: 'Manyamula Primary School', zone: 'Manyamula Zone', password: 'school202', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 6, emis: '1006', name: 'Kaporo Primary School', zone: 'Kaporo Zone', password: 'school303', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 7, emis: '1007', name: 'Mbalachanda Primary School', zone: 'Mbalachanda Zone', password: 'school404', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 8, emis: '1008', name: 'Mzuzu Primary School', zone: 'Mzuzu Zone', password: 'school505', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 9, emis: '1009', name: 'Chiradzulu Primary School', zone: 'Emfeni Zone', password: 'school606', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' },
        { id: 10, emis: '1010', name: 'Nkhata Bay Primary School', zone: 'Kamwendo Zone', password: 'school707', districtNumber: '', divisionNumber: '', constituency: '', ta: '', postalAddress: '', distanceFromNearestPrimary: '', distanceToTDC: '', yearEstablished: '' }
    ],

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
        return JSON.parse(localStorage.getItem('mzimba_zones')) || this.zones;
    },

    getSchools() {
        return JSON.parse(localStorage.getItem('mzimba_schools')) || this.schools;
    },

    getSchoolsByZone(zoneName) {
        const schools = this.getSchools();
        return schools.filter(s => s.zone === zoneName);
    },

    getSchoolByEMIS(emis) {
        const schools = this.getSchools();
        return schools.find(s => s.emis === emis);
    },

    addZone(zoneName) {
        const zones = this.getZones();
        const newZone = { id: Date.now(), name: zoneName };
        zones.push(newZone);
        localStorage.setItem('mzimba_zones', JSON.stringify(zones));
        return newZone;
    },

    addSchool(emis, name, zone, password, districtNumber, divisionNumber, constituency, ta, postalAddress, distanceFromNearestPrimary, distanceToTDC, yearEstablished) {
        const schools = this.getSchools();
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
        enrollment.push({ id: Date.now(), ...data, timestamp: new Date().toISOString() });
        localStorage.setItem('mzimba_enrollment', JSON.stringify(enrollment));
        this.addToUploadHistory('Enrollment', data.emis);
    },

    addPSLCEResult(data) {
        const pslce = JSON.parse(localStorage.getItem('mzimba_pslce')) || [];
        pslce.push({ id: Date.now(), ...data, timestamp: new Date().toISOString() });
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
