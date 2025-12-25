const { getFirestore } = require('../config/firebase-admin');

// Temporary in-memory storage for development
const inMemoryStorage = new Map();

const normalizeDates = (data) => {
  if (!data || typeof data !== 'object') return data;
  const fields = ['requestTimestamp', 'completedTimestamp', 'createdAt', 'updatedAt'];
  const normalized = { ...data };
  fields.forEach((field) => {
    const v = normalized[field];
    if (v && typeof v.toDate === 'function') {
      normalized[field] = v.toDate();
    }
  });
  return normalized;
};

class AnalysisRequest {
  constructor(data) {
    this.url = data.url;
    this.userId = data.userId || null;
    this.status = data.status || 'pending'; // pending, processing, completed, failed
    this.requestTimestamp = data.requestTimestamp || new Date();
    this.completedTimestamp = data.completedTimestamp || null;
    this.metadata = data.metadata || {};
    this.settings = data.settings || {
      includeAxeCore: true,
      includeMlAnalysis: false,
      wcagLevel: 'AA'
    };
  }

  // Create a new analysis request
  static async create(data) {
    try {
      // Try Firebase first, fallback to in-memory storage
      try {
        const db = getFirestore();
        const analysisRequest = new AnalysisRequest(data);

        const docRef = await db.collection('analysisRequests').add({
          ...analysisRequest,
          requestTimestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log(`✅ Analysis request created with ID: ${docRef.id}`);
        return {
          id: docRef.id,
          ...analysisRequest
        };
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable, using in-memory storage:', firebaseError.message);

        // Fallback to in-memory storage
        const analysisRequest = new AnalysisRequest(data);
        const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const requestData = {
          id,
          ...analysisRequest,
          requestTimestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        inMemoryStorage.set(id, requestData);
        console.log(`✅ Analysis request created in memory with ID: ${id}`);

        return requestData;
      }
    } catch (error) {
      console.error('Error creating analysis request:', error);
      throw error;
    }
  }

  // Get analysis request by ID
  static async getById(id) {
    try {
      // Check in-memory storage first for memory-based IDs
      if (id.startsWith('mem_') && inMemoryStorage.has(id)) {
        return normalizeDates(inMemoryStorage.get(id));
      }

      // Try Firebase
      try {
        const db = getFirestore();
        const doc = await db.collection('analysisRequests').doc(id).get();

        if (!doc.exists) {
          return null;
        }

        return normalizeDates({
          id: doc.id,
          ...doc.data()
        });
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for getById, checking in-memory storage');
        return normalizeDates(inMemoryStorage.get(id)) || null;
      }
    } catch (error) {
      console.error('Error getting analysis request:', error);
      throw error;
    }
  }

  // Update analysis request
  static async update(id, data) {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      // Check if it's an in-memory record
      if (id.startsWith('mem_') && inMemoryStorage.has(id)) {
        const existing = inMemoryStorage.get(id);
        const updated = { ...existing, ...updateData };
        inMemoryStorage.set(id, updated);
        console.log(`✅ Analysis request updated in memory: ${id}`);
        return updated;
      }

      // Try Firebase
      try {
        const db = getFirestore();
        await db.collection('analysisRequests').doc(id).update(updateData);
        return await this.getById(id);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase unavailable for update, checking in-memory storage');
        if (inMemoryStorage.has(id)) {
          const existing = inMemoryStorage.get(id);
          const updated = { ...existing, ...updateData };
          inMemoryStorage.set(id, updated);
          return updated;
        }
        throw firebaseError;
      }
    } catch (error) {
      console.error('Error updating analysis request:', error);
      throw error;
    }
  }

  // Get analysis requests by user ID
  static async getByUserId(userId, limit = 10, offset = 0) {
    try {
      const db = getFirestore();
      let query = db.collection('analysisRequests')
        .where('userId', '==', userId)
        .orderBy('requestTimestamp', 'desc')
        .limit(limit);

      if (offset > 0) {
        // For pagination, you might want to use cursor-based pagination
        // This is a simple offset approach
        const offsetSnapshot = await db.collection('analysisRequests')
          .where('userId', '==', userId)
          .orderBy('requestTimestamp', 'desc')
          .limit(offset)
          .get();
        
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => normalizeDates({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting analysis requests by user:', error);
      throw error;
    }
  }

  // Get analysis requests by URL
  static async getByUrl(url, limit = 10) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('analysisRequests')
        .where('url', '==', url)
        .orderBy('requestTimestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => normalizeDates({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting analysis requests by URL:', error);
      throw error;
    }
  }

  // Delete analysis request
  static async delete(id) {
    try {
      const db = getFirestore();
      await db.collection('analysisRequests').doc(id).delete();
      return true;
    } catch (error) {
      console.error('Error deleting analysis request:', error);
      throw error;
    }
  }

  // Get recent analysis requests (public)
  static async getRecent(limit = 20) {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('analysisRequests')
        .where('status', '==', 'completed')
        .orderBy('completedTimestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => {
        const data = normalizeDates({ id: doc.id, ...doc.data() });
        return {
          id: data.id,
          url: data.url,
          status: data.status || 'completed',
          createdAt: data.completedTimestamp || data.createdAt || null,
          completedTimestamp: data.completedTimestamp || null,
          metadata: data.metadata
        };
      });
    } catch (error) {
      console.error('Error getting recent analysis requests:', error);
      throw error;
    }
  }
}

module.exports = AnalysisRequest;
