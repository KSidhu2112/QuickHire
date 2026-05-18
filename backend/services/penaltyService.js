const Application = require('../models/Application');
const User = require('../models/User');
const {
    notifyWorkCompletionReminder,
    notifyPaymentReminder,
    notifyPenaltyApplied,
    notifyAdmin,
} = require('./notificationService');

exports.runPenaltyCheck = async () => {
    try {
        console.log('🕒 Running Penalty Check...');
        const results = {
            reminders: 0,
            penalties: 0,
            adminAlerts: 0,
        };

        // Find applications where employee confirmed but employer hasn't - for reminders/penalties
        const pendingApplications = await Application.find({
            status: 'ACCEPTED',
            'employeeConfirmation.confirmed': true,
            'employerConfirmation.confirmed': { $ne: true },
            'employeeConfirmation.timestamp': { $exists: true },
        }).populate('job employer jobseeker');

        for (const app of pendingApplications) {
            const confirmationTime = new Date(app.employeeConfirmation.timestamp);
            const hoursSinceConfirmation = (Date.now() - confirmationTime.getTime()) / (1000 * 60 * 60);

            // After 24 hours: Send reminder
            if (hoursSinceConfirmation >= 24 && app.remindersSent < 1) {
                try {
                    if (app.employer && app.job && app.jobseeker) {
                        await notifyWorkCompletionReminder(
                            app.employer._id,
                            app.job._id,
                            app._id,
                            app.job.title,
                            app.jobseeker.name
                        );
                        app.remindersSent = (app.remindersSent || 0) + 1;
                        app.lastReminderAt = new Date();
                        await app.save();
                        results.reminders++;
                    }
                } catch (e) { console.error('Reminder error:', e); }
            }

            // After 48 hours: Apply penalty
            if (hoursSinceConfirmation >= 48 && !app.penalty?.applied) {
                const penaltyPercentage = 5; // 5% late penalty
                const penaltyAmount = (app.escrowAmount || app.job.salaryMin || 0) * (penaltyPercentage / 100);

                app.penalty = {
                    applied: true,
                    percentage: penaltyPercentage,
                    amount: penaltyAmount,
                    reason: 'Late confirmation (48+ hours)',
                    appliedAt: new Date(),
                };

                // Update employer trust score
                const employer = await User.findById(app.employer._id);
                if (employer) {
                    employer.trustScore = Math.max(0, employer.trustScore - 5);
                    employer.stats.latePayments = (employer.stats.latePayments || 0) + 1;
                    await employer.save();
                }

                await app.save();
                results.penalties++;

                // Notify employer of penalty
                try {
                    if (app.employer && app.job) {
                        await notifyPenaltyApplied(
                            app.employer._id,
                            app.job._id,
                            app._id,
                            'Late work confirmation',
                            penaltyPercentage
                        );
                    }
                } catch (e) { console.error('Penalty notification error:', e); }

                // Notify admins
                try {
                    const admins = await User.find({ role: 'admin' }).select('_id');
                    for (const admin of admins) {
                        await notifyAdmin(admin._id, `Late penalty applied: ${app.employer.name} — Job: ${app.job.title}. ${penaltyPercentage}% penalty (₹${penaltyAmount})`);
                    }
                    results.adminAlerts++;
                } catch (e) { console.error('Admin notification error:', e); }
            }
        }

        // Also check for employer confirmed but employee hasn't
        const pendingEmployeeConfirmations = await Application.find({
            status: 'ACCEPTED',
            'employerConfirmation.confirmed': true,
            'employeeConfirmation.confirmed': { $ne: true },
            'employerConfirmation.timestamp': { $exists: true },
        }).populate('job employer jobseeker');

        for (const app of pendingEmployeeConfirmations) {
            const confirmationTime = new Date(app.employerConfirmation.timestamp);
            const hoursSinceConfirmation = (Date.now() - confirmationTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceConfirmation >= 24 && app.remindersSent < 1) {
                try {
                    if (app.jobseeker && app.job) {
                        await notifyPaymentReminder(
                            app.jobseeker._id,
                            app.job._id,
                            app._id,
                            app.job.title
                        );
                        app.remindersSent = (app.remindersSent || 0) + 1;
                        app.lastReminderAt = new Date();
                        await app.save();
                        results.reminders++;
                    }
                } catch (e) { console.error('Reminder error:', e); }
            }
        }

        console.log(`✅ Penalty Check Complete: ${results.reminders} reminders, ${results.penalties} penalties.`);
        return results;
    } catch (error) {
        console.error('Penalty Check Logic Error:', error);
        throw error;
    }
};
