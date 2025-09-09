const express = require('express');
const router = express.Router();
const backupManager = require('../utils/backupManager');

router.get('/list', (req, res) => {
    try {
        const backups = backupManager.getBackupList();
        res.json({ success: true, backups });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/create', (req, res) => {
    backupManager.manualBackup((result) => {
        if (result.success) {
            res.json({ success: true, message: 'Backup created successfully.', backup: result });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    });
});

router.post('/restore-latest', (req, res) => {
    const latestBackup = backupManager.getBackupList()[0];
    if (!latestBackup) {
        return res.status(404).json({ success: false, error: 'No backups found.' });
    }

    backupManager.restoreFromBackup(latestBackup.filename, (result) => {
        if (result.success) {
            res.json({ success: true, message: `Restored from ${latestBackup.filename}` });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    });
});

router.post('/restore/:filename', (req, res) => {
    const { filename } = req.params;
    backupManager.restoreFromBackup(filename, (result) => {
        if (result.success) {
            res.json({ success: true, message: `Restored from ${filename}` });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    });
});

module.exports = router;