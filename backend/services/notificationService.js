const Notification = require('../models/Notification');

// Notification Templates
const notificationTemplates = {
    // ============ EMPLOYER NOTIFICATIONS ============
    JOB_POSTED: (jobTitle) => ({
        icon: '✅',
        title: 'Job Posted!',
        message: `Your ${jobTitle} job has been successfully posted and is now visible to potential candidates.`,
        priority: 'HIGH',
    }),

    NEW_APPLICATION: (jobTitle, candidateName) => ({
        icon: '📩',
        title: 'New Application Alert',
        message: `You have received a new application for ${jobTitle} from ${candidateName}.`,
        priority: 'HIGH',
    }),

    MULTIPLE_APPLICATIONS: (jobTitle, count) => ({
        icon: '👥',
        title: 'Applications Update',
        message: `Your job ${jobTitle} has received ${count} new applications. Review them now.`,
        priority: 'MEDIUM',
    }),

    CANDIDATE_SHORTLISTED: (candidateName, jobTitle) => ({
        icon: '⭐',
        title: 'Candidate Shortlisted',
        message: `You have successfully shortlisted ${candidateName} for ${jobTitle}.`,
        priority: 'MEDIUM',
    }),

    CANDIDATE_REJECTED: (candidateName, jobTitle) => ({
        icon: '❌',
        title: 'Application Rejected',
        message: `You have rejected ${candidateName} for ${jobTitle}.`,
        priority: 'LOW',
    }),

    JOB_EXPIRED: (jobTitle) => ({
        icon: '⏰',
        title: 'Job Closed',
        message: `Your job posting ${jobTitle} has expired or been closed.`,
        priority: 'MEDIUM',
    }),

    INTERVIEW_SCHEDULED: (candidateName, dateTime, jobTitle) => ({
        icon: '📅',
        title: 'Interview Scheduled',
        message: `Interview scheduled with ${candidateName} on ${dateTime} for ${jobTitle}.`,
        priority: 'HIGH',
    }),

    NO_APPLICATIONS_REMINDER: (jobTitle) => ({
        icon: '⚠️',
        title: 'No Applications Yet',
        message: `Your job ${jobTitle} hasn't received applications yet. Consider updating details for better reach.`,
        priority: 'MEDIUM',
    }),

    // ============ EMPLOYEE NOTIFICATIONS ============
    JOB_ALERT: (jobTitle, companyName) => ({
        icon: '📢',
        title: 'New Job Alert',
        message: `A new job "${jobTitle}" at ${companyName} has been posted. Check it out!`,
        priority: 'MEDIUM',
    }),

    APPLICATION_SUBMITTED: (jobTitle, companyName) => ({
        icon: '✅',
        title: 'Application Submitted',
        message: `You have successfully applied for ${jobTitle} at ${companyName}.`,
        priority: 'MEDIUM',
    }),

    APPLICATION_VIEWED: (jobTitle) => ({
        icon: '👀',
        title: 'Application Viewed',
        message: `Your application for ${jobTitle} has been viewed by the employer.`,
        priority: 'LOW',
    }),

    SHORTLISTED: (jobTitle, companyName) => ({
        icon: '🎉',
        title: "You're Shortlisted!",
        message: `Congratulations! You've been shortlisted for ${jobTitle} at ${companyName}.`,
        priority: 'URGENT',
    }),

    INTERVIEW_INVITATION: (jobTitle, dateTime) => ({
        icon: '📅',
        title: 'Interview Invitation',
        message: `You've been invited for an interview for ${jobTitle} on ${dateTime}.`,
        priority: 'URGENT',
    }),

    APPLICATION_REJECTED: (jobTitle) => ({
        icon: '❌',
        title: 'Application Update',
        message: `Unfortunately, your application for ${jobTitle} was not selected this time.`,
        priority: 'MEDIUM',
    }),

    JOB_RECOMMENDATION: (jobType, jobTitle) => ({
        icon: '🔍',
        title: 'New Job Match Found',
        message: `A new ${jobType} job matching your profile is available: ${jobTitle}.`,
        priority: 'LOW',
    }),

    JOB_CLOSED_APPLIED: (jobTitle) => ({
        icon: '🚫',
        title: 'Job Closed',
        message: `The job ${jobTitle} you applied for is no longer accepting applications.`,
        priority: 'MEDIUM',
    }),

    PROFILE_COMPLETION: () => ({
        icon: '📝',
        title: 'Complete Your Profile',
        message: 'Complete your profile to get better job recommendations and faster hiring.',
        priority: 'LOW',
    }),

    // ============ VERIFICATION SYSTEM NOTIFICATIONS ============
    WORK_CONFIRMED: (jobTitle, confirmedBy) => ({
        icon: '✅',
        title: 'Work Completion Confirmed',
        message: `${confirmedBy} has confirmed work completion for "${jobTitle}".`,
        priority: 'HIGH',
    }),

    PAYMENT_CONFIRMED: (jobTitle, amount) => ({
        icon: '💰',
        title: 'Payment Confirmed',
        message: `Payment of ₹${amount || 'N/A'} has been confirmed for "${jobTitle}".`,
        priority: 'HIGH',
    }),

    WORK_SUBMITTED: (jobTitle, employeeName) => ({
        icon: '✅',
        title: 'Work Submitted',
        message: `${employeeName} has submitted work for "${jobTitle}". Please review.`,
        priority: 'HIGH',
    }),

    WORK_COMPLETION_REMINDER: (jobTitle, employeeName) => ({
        icon: '⏰',
        title: 'Pending Work Confirmation',
        message: `Please confirm work completion for ${employeeName} on "${jobTitle}". Action required within 48 hours.`,
        priority: 'URGENT',
    }),

    PAYMENT_REMINDER: (jobTitle) => ({
        icon: '⚠️',
        title: 'Payment Confirmation Pending',
        message: `Payment confirmation for "${jobTitle}" is still pending. Please confirm or raise a dispute.`,
        priority: 'URGENT',
    }),

    ESCROW_LOCKED: (jobTitle, amount) => ({
        icon: '🔒',
        title: 'Payment Secured in Escrow',
        message: `₹${amount} has been locked in escrow for "${jobTitle}". Payment will be released after mutual confirmation.`,
        priority: 'HIGH',
    }),

    ESCROW_RELEASED: (jobTitle, amount) => ({
        icon: '🔓',
        title: 'Payment Released from Escrow',
        message: `₹${amount} has been released from escrow for "${jobTitle}".`,
        priority: 'HIGH',
    }),

    PENALTY_APPLIED: (reason, percentage) => ({
        icon: '⚠️',
        title: 'Penalty Applied',
        message: `A ${percentage}% late payment penalty has been applied: ${reason}.`,
        priority: 'URGENT',
    }),

    DISPUTE_OPENED: (jobTitle, raisedByName) => ({
        icon: '🚨',
        title: 'Dispute Opened',
        message: `A dispute has been raised for "${jobTitle}" by ${raisedByName}. Please review.`,
        priority: 'URGENT',
    }),

    DISPUTE_RESOLVED: (jobTitle, resolution) => ({
        icon: '✅',
        title: 'Dispute Resolved',
        message: `The dispute for "${jobTitle}" has been resolved. Resolution: ${resolution}.`,
        priority: 'HIGH',
    }),

    LATE_PAYMENT_WARNING: (jobTitle, hoursOverdue) => ({
        icon: '🔴',
        title: 'Late Payment Warning',
        message: `Payment for "${jobTitle}" is ${hoursOverdue} hours overdue. A penalty may be applied.`,
        priority: 'URGENT',
    }),

    ADMIN_ALERT: (message) => ({
        icon: '🔔',
        title: 'Admin Alert',
        message: message,
        priority: 'URGENT',
    }),

    // ============ SYSTEM NOTIFICATIONS ============
    LOGIN_ALERT: () => ({
        icon: '🔐',
        title: 'New Login Detected',
        message: 'You have logged in successfully from a new device.',
        priority: 'MEDIUM',
    }),

    ACCOUNT_CREATED: () => ({
        icon: '🎉',
        title: 'Welcome to QuickHire!',
        message: 'Your account has been created successfully. Start exploring jobs now!',
        priority: 'HIGH',
    }),

    // ============ JOINING SYSTEM NOTIFICATIONS ============
    JOINING_CONFIRMED: (jobTitle) => ({
        icon: '✅',
        title: 'Joining Confirmed',
        message: `Your joining for "${jobTitle}" has been confirmed by the employer.`,
        priority: 'HIGH',
    }),

    JOINING_NOT_CONFIRMED: (jobTitle) => ({
        icon: '⚠️',
        title: 'Joining Not Confirmed',
        message: `The employer marked you as Not Joined for "${jobTitle}". You can dispute this within 3 days.`,
        priority: 'URGENT',
    }),

    JOINING_DISPUTED: (jobTitle, employeeName) => ({
        icon: '🚨',
        title: 'Joining Status Disputed',
        message: `${employeeName} has disputed the "Not Joined" status for "${jobTitle}".`,
        priority: 'HIGH',
    }),

    WORK_MARKED_COMPLETED: (jobTitle) => ({
        icon: '✅',
        title: 'Work Marked Done',
        message: `Your employer has marked the job "${jobTitle}" as completed. Please confirm payment or report if there's an issue.`,
        priority: 'HIGH',
    }),
};

// Create notification function
const createNotification = async ({
    recipientId,
    type,
    templateData = {},
    relatedJob = null,
    relatedApplication = null,
    relatedUser = null,
    actionUrl = null,
    additionalData = {},
}) => {
    try {
        // Get template function
        const templateFn = notificationTemplates[type];
        if (!templateFn) {
            console.error(`No template found for notification type: ${type}`);
            return null;
        }

        // Generate notification content from template
        const content = templateFn(...Object.values(templateData));

        // Create notification
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title: content.title,
            message: content.message,
            icon: content.icon,
            priority: content.priority,
            relatedJob,
            relatedApplication,
            relatedUser,
            actionUrl,
            data: additionalData,
        });

        console.log(`✅ Notification created: ${type} for user ${recipientId}`);
        return notification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        return null;
    }
};

// Bulk create notifications
const createBulkNotifications = async (notifications) => {
    try {
        const created = await Notification.insertMany(notifications);
        console.log(`✅ Created ${created.length} notifications`);
        return created;
    } catch (error) {
        console.error('Bulk Create Notifications Error:', error);
        return [];
    }
};

// Send notification to employer when job is posted
const notifyJobPosted = async (employerId, jobId, jobTitle) => {
    return await createNotification({
        recipientId: employerId,
        type: 'JOB_POSTED',
        templateData: { jobTitle },
        relatedJob: jobId,
        actionUrl: `/employer/manage-jobs`,
    });
};

// Broadcast notification to jobseekers when new job is posted
const notifyJobseekers = async (jobId, jobTitle, companyName, category) => {
    try {
        const User = require('../models/User'); // Lazy load to avoid circular dependency

        // Find all jobseekers (in a real app, you'd filter by preferences/location)
        const jobseekers = await User.find({ role: 'jobseeker' }).select('_id');

        if (!jobseekers.length) return;

        const notifications = jobseekers.map(user => {
            const templateFn = notificationTemplates['JOB_ALERT'];
            const content = templateFn(jobTitle, companyName);

            return {
                recipient: user._id,
                type: 'JOB_ALERT',
                title: content.title,
                message: content.message,
                icon: content.icon,
                priority: content.priority,
                relatedJob: jobId,
                actionUrl: `/dashboard`,
                read: false
            };
        });

        return await createBulkNotifications(notifications);
    } catch (error) {
        console.error('Notify Jobseekers Error:', error);
    }
};

// Send notification to employer when new application received
const notifyNewApplication = async (employerId, jobId, applicationId, jobTitle, candidateName) => {
    return await createNotification({
        recipientId: employerId,
        type: 'NEW_APPLICATION',
        templateData: { jobTitle, candidateName },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employer/applications?job=${jobId}`,
    });
};

// Send notification to jobseeker when application submitted
const notifyApplicationSubmitted = async (jobseekerId, jobId, applicationId, jobTitle, companyName) => {
    return await createNotification({
        recipientId: jobseekerId,
        type: 'APPLICATION_SUBMITTED',
        templateData: { jobTitle, companyName },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employee/applications`,
    });
};

// Send notification to jobseeker when shortlisted
const notifyShortlisted = async (jobseekerId, jobId, applicationId, jobTitle, companyName) => {
    return await createNotification({
        recipientId: jobseekerId,
        type: 'SHORTLISTED',
        templateData: { jobTitle, companyName },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employee/applications`,
    });
};

// Send notification to jobseeker when rejected
const notifyRejected = async (jobseekerId, jobId, applicationId, jobTitle) => {
    return await createNotification({
        recipientId: jobseekerId,
        type: 'APPLICATION_REJECTED',
        templateData: { jobTitle },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employee/applications`,
    });
};

// Send welcome notification
const notifyAccountCreated = async (userId) => {
    return await createNotification({
        recipientId: userId,
        type: 'ACCOUNT_CREATED',
        templateData: {},
        actionUrl: '/dashboard',
    });
};

// ===== VERIFICATION SYSTEM NOTIFICATIONS =====

const notifyWorkConfirmed = async (recipientId, jobId, applicationId, jobTitle, confirmedBy) => {
    return await createNotification({
        recipientId,
        type: 'WORK_CONFIRMED',
        templateData: { jobTitle, confirmedBy },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employer/verification`,
    });
};

const notifyPaymentConfirmed = async (recipientId, jobId, applicationId, jobTitle, amount) => {
    return await createNotification({
        recipientId,
        type: 'PAYMENT_CONFIRMED',
        templateData: { jobTitle, amount },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyWorkSubmitted = async (recipientId, jobId, applicationId, jobTitle, employeeName) => {
    return await createNotification({
        recipientId,
        type: 'WORK_SUBMITTED',
        templateData: { jobTitle, employeeName },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employer/verification`, // Assumes employer route for checking this
    });
};

const notifyWorkCompletionReminder = async (employerId, jobId, applicationId, jobTitle, employeeName) => {
    return await createNotification({
        recipientId: employerId,
        type: 'WORK_COMPLETION_REMINDER',
        templateData: { jobTitle, employeeName },
        relatedJob: jobId,
        relatedApplication: applicationId,
        actionUrl: `/employer/verification`,
    });
};

const notifyPaymentReminder = async (recipientId, jobId, applicationId, jobTitle) => {
    return await createNotification({
        recipientId,
        type: 'PAYMENT_REMINDER',
        templateData: { jobTitle },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyEscrowLocked = async (recipientId, jobId, applicationId, jobTitle, amount) => {
    return await createNotification({
        recipientId,
        type: 'ESCROW_LOCKED',
        templateData: { jobTitle, amount },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyEscrowReleased = async (recipientId, jobId, applicationId, jobTitle, amount) => {
    return await createNotification({
        recipientId,
        type: 'ESCROW_RELEASED',
        templateData: { jobTitle, amount },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyPenaltyApplied = async (recipientId, jobId, applicationId, reason, percentage) => {
    return await createNotification({
        recipientId,
        type: 'PENALTY_APPLIED',
        templateData: { reason, percentage },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyDisputeOpened = async (recipientId, jobId, applicationId, jobTitle, raisedByName) => {
    return await createNotification({
        recipientId,
        type: 'DISPUTE_OPENED',
        templateData: { jobTitle, raisedByName },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyDisputeResolved = async (recipientId, jobId, applicationId, jobTitle, resolution) => {
    return await createNotification({
        recipientId,
        type: 'DISPUTE_RESOLVED',
        templateData: { jobTitle, resolution },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyLatePaymentWarning = async (recipientId, jobId, applicationId, jobTitle, hoursOverdue) => {
    return await createNotification({
        recipientId,
        type: 'LATE_PAYMENT_WARNING',
        templateData: { jobTitle, hoursOverdue },
        relatedJob: jobId,
        relatedApplication: applicationId,
    });
};

const notifyAdmin = async (adminId, message) => {
    return await createNotification({
        recipientId: adminId,
        type: 'ADMIN_ALERT',
        templateData: { message },
    });
};

module.exports = {
    createNotification,
    createBulkNotifications,
    notifyJobPosted,
    notifyJobseekers,
    notifyNewApplication,
    notifyApplicationSubmitted,
    notifyShortlisted,
    notifyRejected,
    notifyAccountCreated,
    // Verification system
    notifyWorkConfirmed,
    notifyPaymentConfirmed,
    notifyWorkSubmitted,
    notifyWorkCompletionReminder,
    notifyPaymentReminder,
    notifyEscrowLocked,
    notifyEscrowReleased,
    notifyPenaltyApplied,
    notifyDisputeOpened,
    notifyDisputeResolved,
    notifyLatePaymentWarning,
    notifyAdmin,
    // Joining system
    notifyJoiningConfirmed: async (recipientId, jobId, applicationId, jobTitle) => {
        return await createNotification({
            recipientId,
            type: 'JOINING_CONFIRMED',
            templateData: { jobTitle },
            relatedJob: jobId,
            relatedApplication: applicationId,
            actionUrl: '/employee/applications'
        });
    },
    notifyJoiningNotConfirmed: async (recipientId, jobId, applicationId, jobTitle) => {
        return await createNotification({
            recipientId,
            type: 'JOINING_NOT_CONFIRMED',
            templateData: { jobTitle },
            relatedJob: jobId,
            relatedApplication: applicationId,
            actionUrl: '/employee/applications'
        });
    },
    notifyJoiningDisputed: async (recipientId, jobId, applicationId, jobTitle, employeeName) => {
        return await createNotification({
            recipientId,
            type: 'JOINING_DISPUTED',
            templateData: { jobTitle, employeeName },
            relatedJob: jobId,
            relatedApplication: applicationId,
            actionUrl: `/employer/applications?job=${jobId}`
        });
    },
    notifyWorkMarkedCompleted: async (recipientId, jobId, applicationId, jobTitle) => {
        return await createNotification({
            recipientId,
            type: 'WORK_MARKED_COMPLETED',
            templateData: { jobTitle },
            relatedJob: jobId,
            relatedApplication: applicationId,
            actionUrl: '/employee/applications'
        });
    },
};
