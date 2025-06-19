const { getFirestore } = require('../config/firebase-admin');

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
      const db = getFirestore();
      const analysisRequest = new AnalysisRequest(data);
      
      const docRef = await db.collection('analysisRequests').add({
        ...analysisRequest,
        requestTimestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: docRef.id,
        ...analysisRequest
      };
    } catch (error) {
      console.error('Error creating analysis request:', error);
      throw error;
    }
  }

  // Get analysis request by ID
  static async getById(id) {
    try {
      const db = getFirestore();
      const doc = await db.collection('analysisRequests').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error getting analysis request:', error);
      throw error;
    }
  }

  // Update analysis request
  static async update(id, data) {
    try {
      const db = getFirestore();
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      await db.collection('analysisRequests').doc(id).update(updateData);
      
      return await this.getById(id);
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
      
      return snapshot.docs.map(doc => ({
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

      return snapshot.docs.map(doc => ({
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

      return snapshot.docs.map(doc => ({
        id: doc.id,
        url: doc.data().url,
        completedTimestamp: doc.data().completedTimestamp,
        metadata: doc.data().metadata
      }));
    } catch (error) {
      console.error('Error getting recent analysis requests:', error);
      throw error;
    }
  }
}

module.exports = AnalysisRequest;
