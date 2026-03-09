const express = require('express');
const router = express.Router();
const DataModel = require('../models/DataModel');
const { TIME_RANGES, WARNING_THRESHOLDS } = require('../config/constants');

// Get warning thresholds — must be BEFORE /:userId to avoid route conflict
router.get('/thresholds', (req, res) => {
    res.json(WARNING_THRESHOLDS);
});

// Get data by time range
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { timeRange } = req.query;

        console.log(`API Request - userId: ${userId}, timeRange: ${timeRange}`);

        if (!timeRange || !TIME_RANGES[timeRange]) {
            console.log(`Invalid time range: ${timeRange}`);
            return res.status(400).json({ error: 'Invalid time range' });
        }

        const startTime = new Date(Date.now() - TIME_RANGES[timeRange]);

        // Only query by exact userId — no backwards compat fallback
        const data = await DataModel.find({
            userId,
            timestamp: { $gte: startTime }
        }).sort({ timestamp: 1 }).lean();

        console.log(`Returned ${data.length} records for ${userId} / ${timeRange}`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get latest value for a user
router.get('/:userId/latest', async (req, res) => {
    try {
        const { userId } = req.params;
        const latest = await DataModel.findOne({ userId })
            .sort({ timestamp: -1 })
            .lean();
        res.json(latest || {});
    } catch (error) {
        console.error('Error fetching latest:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ONE-TIME MIGRATION
router.post('/migrate/add-userid', async (req, res) => {
    try {
        const result = await DataModel.updateMany(
            { $or: [{ userId: { $exists: false } }, { userId: null }] },
            { $set: { userId: 'user1' } }
        );
        console.log(`Migration complete: Updated ${result.modifiedCount} records`);
        res.json({
            success: true,
            modifiedCount: result.modifiedCount,
            message: `Updated ${result.modifiedCount} records to have userId='user1'`
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;