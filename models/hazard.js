// In-memory storage for hazards (replace with database in production)
let hazards = [];
let nextId = 1;

class Hazard {
    static create(hazardData) {
        const hazard = {
            id: nextId++,
            lat: parseFloat(hazardData.lat),
            lng: parseFloat(hazardData.lng),
            cause: hazardData.cause,
            severity: parseInt(hazardData.severity),
            notes: hazardData.notes,
            timestamp: hazardData.timestamp,
            imageUrl: hazardData.imageUrl || null,
            createdAt: new Date().toISOString()
        };
        
        hazards.push(hazard);
        console.log('Hazard created:', hazard);
        return hazard;
    }
    
    static getAll() {
        return hazards;
    }
    
    static getById(id) {
        return hazards.find(hazard => hazard.id === parseInt(id));
    }
    
    static delete(id) {
        const index = hazards.findIndex(hazard => hazard.id === parseInt(id));
        if (index !== -1) {
            return hazards.splice(index, 1)[0];
        }
        return null;
    }
    
    static update(id, updateData) {
        const hazard = this.getById(id);
        if (hazard) {
            Object.assign(hazard, updateData);
            return hazard;
        }
        return null;
    }
}

module.exports = Hazard;