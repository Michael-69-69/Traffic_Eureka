const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const cloudinary = require('cloudinary').v2;

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

// Configure Cloudinary (move to env vars in production)
cloudinary.config({
    cloud_name: 'djdl8lpzs', // Replace with your Cloudinary cloud name
    api_key: '445997324341426',      // Replace with your Cloudinary API key
    api_secret: 'GwUeGrX5bLX8ZheeV97sLRIWxc8' // Replace with your Cloudinary API secret
});
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
                timestamp: incidentData.timestamp || new Date().toISOString(),
                verified: incidentData.verified || false,
                imageUrl: null,
                createdAt: new Date().toISOString()
            };

            // Save to Firestore
            const docRef = await addDoc(collection(db, "incidents"), incident);
            console.log("Incident saved to Firestore with ID: ", docRef.id);

            // Handle image upload to Cloudinary
            if (incidentData.image && incidentData.image.buffer) {
                console.log('Attempting to upload image to Cloudinary');
                const uploadPromise = new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { folder: 'incidents', public_id: docRef.id, resource_type: 'image' },
                        (error, result) => {
                            if (error) {
                                console.error('Cloudinary upload error:', error);
                                reject(error);
                            } else {
                                console.log('Cloudinary upload success:', result);
                                resolve(result);
                            }
                        }
                    ).end(incidentData.image.buffer);
                });

                const uploadResult = await uploadPromise;
                incident.imageUrl = uploadResult.secure_url;
                await updateDoc(docRef, { imageUrl: incident.imageUrl });
                console.log('Updated incident with imageUrl:', incident.imageUrl);
            } else {
                console.log('No image provided or buffer missing, skipping upload');
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