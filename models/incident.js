// In-memory storage for incidents (replace with database in production)
let incidents = [];
let nextId = 1;

class Incident {
    static create(incidentData) {
        const incident = {
            id: nextId++,
            lat: parseFloat(incidentData.lat),
            lng: parseFloat(incidentData.lng),
            description: incidentData.description,
            type: incidentData.type,
            impact: parseInt(incidentData.impact),
            timestamp: incidentData.timestamp,
            verified: incidentData.verified || false,
            imageUrl: incidentData.imageUrl || null,
            createdAt: new Date().toISOString()
        };
        
        incidents.push(incident);
        console.log('Incident created:', incident);
        return incident;
    }
    
    static getAll() {
        return incidents;
    }
    
    static getById(id) {
        return incidents.find(incident => incident.id === parseInt(id));
    }
    
    static delete(id) {
        const index = incidents.findIndex(incident => incident.id === parseInt(id));
        if (index !== -1) {
            return incidents.splice(index, 1)[0];
        }
        return null;
    }
    
    static update(id, updateData) {
        const incident = this.getById(id);
        if (incident) {
            Object.assign(incident, updateData);
            return incident;
        }
        return null;
    }
}

module.exports = Incident;