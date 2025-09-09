const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} = require("firebase/firestore");
const cloudinary = require("cloudinary").v2;

// Firebase configuration (move to env vars in production)
const firebaseConfig = {
  apiKey: "AIzaSyD7t3T4mTw7PoW4NVMGXZ8yQ7r_Mv6uglE",
  authDomain: "trafficmanaging.firebaseapp.com",
  projectId: "trafficmanaging",
  storageBucket: "trafficmanaging.firebasestorage.app",
  messagingSenderId: "745287485470",
  appId: "1:745287485470:web:bbe19f41ad4be3c8cd460f",
  measurementId: "G-KLHD9NZT5R",
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configure Cloudinary (move to env vars in production)
cloudinary.config({
  cloud_name: "djdl8lpzs",
  api_key: "445997324341426",
  api_secret: "GwUeGrX5bLX8ZheeV97sLRIWxc8",
});

class Incident {
  static async create(incidentData) {
    try {
      console.log('Creating incident with data:', incidentData);

      // Validate required fields
      if (!incidentData.lat || !incidentData.lng || !incidentData.description || 
          !incidentData.type || !incidentData.impact || !incidentData.timestamp) {
        throw new Error('Missing required fields: lat, lng, description, type, impact, timestamp');
      }

      const incident = {
        lat: parseFloat(incidentData.lat),
        lng: parseFloat(incidentData.lng),
        description: incidentData.description,
        type: incidentData.type,
        impact: parseInt(incidentData.impact),
        timestamp: incidentData.timestamp || new Date().toISOString(),
        status: "pending", // "pending", "accepted", "rejected"
        verified: incidentData.verified || false,
        imageUrl: null,
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, "incidents"), incident);
      console.log("Incident saved to Firestore with ID: ", docRef.id);

      // Add the Firestore document ID to the incident object
      incident.id = docRef.id;

      // Handle image upload to Cloudinary
      if (incidentData.image && incidentData.image.buffer) {
        console.log("Attempting to upload image to Cloudinary");
        try {
          const uploadPromise = new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload_stream(
                {
                  folder: "incidents",
                  public_id: docRef.id,
                  resource_type: "image",
                },
                (error, result) => {
                  if (error) {
                    console.error("Cloudinary upload error:", error);
                    reject(error);
                  } else {
                    console.log("Cloudinary upload success:", result);
                    resolve(result);
                  }
                }
              )
              .end(incidentData.image.buffer);
          });

          const uploadResult = await uploadPromise;
          incident.imageUrl = uploadResult.secure_url;
          await updateDoc(docRef, { imageUrl: incident.imageUrl });
          console.log("Updated incident with imageUrl:", incident.imageUrl);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          // Continue without image if upload fails
        }
      } else {
        console.log("No image provided or buffer missing, skipping upload");
      }

      console.log("Incident created successfully:", incident);
      return incident;
    } catch (error) {
      console.error("Error creating incident:", error);
      throw error;
    }
  }

  static async getAll() {
    try {
      console.log("Fetching all incidents from Firestore");
      const incidentsSnapshot = await getDocs(collection(db, "incidents"));
      const incidents = incidentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(`Retrieved ${incidents.length} incidents from Firestore`);
      return incidents;
    } catch (error) {
      console.error("Error getting incidents:", error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      console.log(`Fetching incident with ID: ${id}`);
      const docRef = doc(db, "incidents", id.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const incident = { id: docSnap.id, ...docSnap.data() };
        console.log("Found incident:", incident);
        return incident;
      } else {
        console.log("Incident not found");
        return null;
      }
    } catch (error) {
      console.error("Error getting incident by ID:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      console.log(`Deleting incident with ID: ${id}`);
      const docRef = doc(db, "incidents", id.toString());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const incidentData = docSnap.data();
        await deleteDoc(docRef);
        console.log("Incident deleted successfully");
        return { id, ...incidentData };
      } else {
        console.log("Incident not found for deletion");
        return null;
      }
    } catch (error) {
      console.error("Error deleting incident:", error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      console.log(`Updating incident with ID: ${id}`, updateData);
      
      if (!id) {
        throw new Error('Invalid incident ID provided');
      }

      const docRef = doc(db, "incidents", id.toString());
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log("Incident not found for update");
        return null;
      }

      // Add updatedAt timestamp
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updatePayload);
      console.log("Incident updated successfully");
      
      // Fetch and return the updated document
      const updatedDoc = await getDoc(docRef);
      const updatedIncident = { id: updatedDoc.id, ...updatedDoc.data() };
      console.log("Updated incident data:", updatedIncident);
      
      return updatedIncident;
    } catch (error) {
      console.error("Error updating incident:", error);
      throw error;
    }
  }

  static async updateStatus(id, status, verified = null) {
    try {
      console.log(`Updating incident status - ID: ${id}, Status: ${status}, Verified: ${verified}`);
      
      const updateData = { 
        status,
        updatedAt: new Date().toISOString()
      };
      
      // Only update verified field if explicitly provided
      if (verified !== null) {
        updateData.verified = verified;
      }
      
      return await this.update(id, updateData);
    } catch (error) {
      console.error("Error updating incident status:", error);
      throw error;
    }
  }
}

module.exports = Incident;