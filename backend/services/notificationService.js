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
        actionUrl: `/employee/applications`, // Updated to point to My Applications
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
};
