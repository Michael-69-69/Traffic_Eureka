const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase configuration (move to env vars in production)
const firebaseConfig = {
    apiKey: "AIzaSyD7t3T4mTw7PoW4NVMGXZ8yQ7r_Mv6uglE",
    authDomain: "trafficmanaging.firebaseapp.com",
    projectId: "trafficmanaging",
    storageBucket: "trafficmanaging.firebasestorage.app",
    messagingSenderId: "745287485470",
    appId: "1:745287485470:web:bbe19f41ad4be3c8cd460f",
    measurementId: "G-KLHD9NZT5R"
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class Incident {
    static async create(incidentData) {
        try {
            const nextId = Date.now(); // Using timestamp as ID for uniqueness
            const incident = {
                id: nextId,
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

            // Save to Firestore
            const docRef = await addDoc(collection(db, "incidents"), incident);
            console.log("Incident saved to Firestore with ID: ", docRef.id);

            // Handle image storage locally
            if (incidentData.image && incidentData.image.buffer) {
                const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'incidents');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const fileExtension = path.extname(incidentData.image.originalname) || '.jpg';
                const filename = `${incident.id}${fileExtension}`;
                const filePath = path.join(uploadDir, filename);

                fs.writeFileSync(filePath, incidentData.image.buffer);
                incident.imageUrl = `/uploads/incidents/${filename}`;
                
                // Update Firestore with image URL
                await updateDoc(docRef, { imageUrl: incident.imageUrl });
            }

            console.log('Incident created:', incident);
            return incident;
        } catch (error) {
            console.error('Error creating incident:', error);
            throw error;
        }
    }

    static async getAll() {
        try {
            const incidentsSnapshot = await getDocs(collection(db, "incidents"));
            return incidentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting incidents:', error);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const docRef = doc(db, "incidents", id.toString());
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error('Error getting incident by ID:', error);
            throw error;
        }
    }

    static async delete(id) {
        try {
            const docRef = doc(db, "incidents", id.toString());
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await deleteDoc(docRef);
                return { id, ...docSnap.data() };
            }
            return null;
        } catch (error) {
            console.error('Error deleting incident:', error);
            throw error;
        }
    }

    static async update(id, updateData) {
        try {
            const docRef = doc(db, "incidents", id.toString());
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                await updateDoc(docRef, updateData);
                const updatedDoc = await getDoc(docRef);
                return { id: updatedDoc.id, ...updatedDoc.data() };
            }
            return null;
        } catch (error) {
            console.error('Error updating incident:', error);
            throw error;
        }
    }
}

module.exports = Incident;