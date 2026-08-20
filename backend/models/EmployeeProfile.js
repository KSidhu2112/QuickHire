const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },

        // --- Personal Information ---
        profilePhoto: {
            type: String,
            default: '',
        },
        currentLocation: {
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            pincode: { type: String, default: '' },
        },
        languages: {
            type: [String],
            default: [],
        },

        // --- Job Preferences ---
        preferredCategories: {
            type: [String],
            enum: [
                'Driver', 'Delivery Executive', 'Security Guard', 'Housekeeping',
                'Waiter', 'Helper', 'Warehouse Worker', 'Retail Staff', 'Cook',
                'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mechanic',
                'Gardener', 'Office Boy', 'Receptionist', 'Data Entry', 'Other'
            ],
            default: [],
        },
        preferredWorkType: {
            type: [String],
            enum: ['Full-Time', 'Part-Time', 'Daily Wage', 'Contract'],
            default: [],
        },
        expectedSalary: {
            min: { type: Number, default: 0 },
            max: { type: Number, default: 0 },
            type_period: { type: String, enum: ['monthly', 'daily', 'hourly'], default: 'monthly' },
        },
        preferredShift: {
            type: String,
            enum: ['Day Shift', 'Night Shift', 'Flexible', ''],
            default: '',
        },
        immediateJoining: {
            type: Boolean,
            default: false,
        },

        // --- Skills & Experience ---
        skills: {
            type: [String],
            default: [],
        },
        yearsOfExperience: {
            type: Number,
            default: 0,
        },
        previousWorkExperience: [
            {
                jobTitle: String,
                company: String,
                duration: String,
                description: String,
            },
        ],
        certifications: {
            type: [String],
            default: [],
        },
        vehicleOwnership: {
            type: Boolean,
            default: false,
        },

        // --- Candidate Summary for RAG ---
        candidateSummary: {
            type: String,
            default: '',
        },

        // --- Profile Completeness ---
        profileCompleteness: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        isProfileComplete: {
            type: Boolean,
            default: false,
        },

        // --- Trust Score ---
        trustScore: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },

        // --- Attendance & Reliability ---
        attendanceHistory: {
            totalAssigned: { type: Number, default: 0 },
            totalAttended: { type: Number, default: 0 },
            noShows: { type: Number, default: 0 },
        },
        rehireCount: {
            type: Number,
            default: 0,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },

        // --- Granular Ratings ---
        ratings: {
            workQuality: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            punctuality: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            reliability: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            behavior: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
            communication: { total: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
        },
        overallRating: {
            type: Number,
            default: 0,
        },
        totalRatingsCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Calculate profile completeness
employeeProfileSchema.methods.calculateCompleteness = function () {
    let filled = 0;
    const totalFields = 10;

    if (this.profilePhoto) filled++;
    if (this.currentLocation?.city) filled++;
    if (this.languages.length > 0) filled++;
    if (this.preferredCategories.length > 0) filled++;
    if (this.preferredWorkType.length > 0) filled++;
    if (this.expectedSalary?.min > 0) filled++;
    if (this.preferredShift) filled++;
    if (this.skills.length > 0) filled++;
    if (this.yearsOfExperience > 0) filled++;
    if (this.certifications.length > 0 || this.previousWorkExperience.length > 0) filled++;

    this.profileCompleteness = Math.round((filled / totalFields) * 100);
    this.isProfileComplete = this.profileCompleteness >= 60;
    return this.profileCompleteness;
};

// Generate candidate summary for RAG
employeeProfileSchema.methods.generateSummary = async function () {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    if (!user) return '';

    const avgWorkQuality = this.ratings.workQuality.count > 0
        ? (this.ratings.workQuality.total / this.ratings.workQuality.count).toFixed(1) : 'N/A';
    const avgPunctuality = this.ratings.punctuality.count > 0
        ? (this.ratings.punctuality.total / this.ratings.punctuality.count).toFixed(1) : 'N/A';
    const avgReliability = this.ratings.reliability.count > 0
        ? (this.ratings.reliability.total / this.ratings.reliability.count).toFixed(1) : 'N/A';
    const avgBehavior = this.ratings.behavior.count > 0
        ? (this.ratings.behavior.total / this.ratings.behavior.count).toFixed(1) : 'N/A';
    const avgCommunication = this.ratings.communication.count > 0
        ? (this.ratings.communication.total / this.ratings.communication.count).toFixed(1) : 'N/A';

    const attendanceRate = this.attendanceHistory.totalAssigned > 0
        ? Math.round((this.attendanceHistory.totalAttended / this.attendanceHistory.totalAssigned) * 100)
        : 100;

    const summary = [
        `Employee ID: ${this.user.toString().slice(-6).toUpperCase()}`,
        `Name: ${user.name}`,
        `Preferred Jobs: ${this.preferredCategories.length > 0 ? this.preferredCategories.join(', ') : 'Not specified'}`,
        `Work Type: ${this.preferredWorkType.length > 0 ? this.preferredWorkType.join(', ') : 'Not specified'}`,
        `Experience: ${this.yearsOfExperience} Years`,
        `Skills: ${this.skills.length > 0 ? this.skills.join(', ') : 'Not specified'}`,
        `Languages: ${this.languages.length > 0 ? this.languages.join(', ') : 'Not specified'}`,
        `Location: ${this.currentLocation?.city || 'Not specified'}${this.currentLocation?.state ? ', ' + this.currentLocation.state : ''}`,
        `Availability: ${this.immediateJoining ? 'Immediate' : 'Not Immediate'}`,
        `Shift Preference: ${this.preferredShift || 'Not specified'}`,
        `Vehicle: ${this.vehicleOwnership ? 'Yes' : 'No'}`,
        `Expected Salary: ₹${this.expectedSalary?.min || 0} - ₹${this.expectedSalary?.max || 0} ${this.expectedSalary?.type_period || 'monthly'}`,
        `Certifications: ${this.certifications.length > 0 ? this.certifications.join(', ') : 'None'}`,
        `Completed Jobs: ${user.stats?.jobsCompleted || 0}`,
        `Average Rating: ${this.overallRating || 0}`,
        `Work Quality: ${avgWorkQuality}`,
        `Punctuality: ${avgPunctuality}`,
        `Reliability: ${avgReliability}`,
        `Behavior: ${avgBehavior}`,
        `Communication: ${avgCommunication}`,
        `Trust Score: ${this.trustScore}`,
        `Attendance Rate: ${attendanceRate}%`,
        `No Shows: ${this.attendanceHistory.noShows}`,
        `Rehire Count: ${this.rehireCount}`,
        `Verified: ${this.isVerified ? 'Yes' : 'No'}`,
        `Profile Completeness: ${this.profileCompleteness}%`,
    ].join('\n');

    this.candidateSummary = summary;
    return summary;
};

// Calculate trust score
employeeProfileSchema.methods.calculateTrustScore = async function () {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);
    if (!user) return 50;

    let score = 50; // Base score

    // 1. Employer Ratings (max +20)
    if (this.overallRating > 0) {
        score += Math.min(20, (this.overallRating / 5) * 20);
    }

    // 2. Completed Jobs (max +15)
    const completedJobs = user.stats?.jobsCompleted || 0;
    score += Math.min(15, completedJobs * 1.5);

    // 3. Profile Completeness (max +10)
    score += (this.profileCompleteness / 100) * 10;

    // 4. Attendance History (max +10, penalize no-shows)
    if (this.attendanceHistory.totalAssigned > 0) {
        const attendanceRate = this.attendanceHistory.totalAttended / this.attendanceHistory.totalAssigned;
        score += attendanceRate * 10;
        // Penalize no-shows
        score -= this.attendanceHistory.noShows * 2;
    }

    // 5. Rehire Rate (max +5)
    if (completedJobs > 0) {
        const rehireRate = this.rehireCount / completedJobs;
        score += Math.min(5, rehireRate * 5);
    }

    // 6. Verification Status (+5)
    if (this.isVerified) {
        score += 5;
    }

    // Clamp between 0 and 100
    this.trustScore = Math.max(0, Math.min(100, Math.round(score)));

    // Also update user trustScore
    await User.findByIdAndUpdate(this.user, { trustScore: this.trustScore });

    return this.trustScore;
};

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
