const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employer is required'],
        },
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
            minlength: [20, 'Description must be at least 20 characters'],
        },
        company: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },
        jobType: {
            type: String,
            enum: {
                values: ['PART_TIME', 'FULL_TIME', 'DAILY', 'ON_CALL', 'EVENT_BASED', 'SHIFT_BASED'],
                message: '{VALUE} is not a valid job type',
            },
            required: [true, 'Job type is required'],
        },
        // Vacancy Information
        vacancyType: {
            type: String,
            enum: ['SINGLE', 'BULK'],
            default: 'SINGLE',
        },
        autoApprove: {
            type: Boolean,
            default: false,
        },
        // Salary Information
        salaryType: {
            type: String,
            enum: ['HOURLY', 'DAILY', 'MONTHLY', 'FIXED'],
            required: [true, 'Salary type is required'],
        },
        salaryMin: {
            type: Number,
            required: [true, 'Minimum salary is required'],
            min: [0, 'Salary cannot be negative'],
        },
        salaryMax: {
            type: Number,
            validate: {
                validator: function (value) {
                    return value >= this.salaryMin;
                },
                message: 'Maximum salary must be greater than or equal to minimum salary',
            },
        },
        // Location
        location: {
            city: {
                type: String,
                required: [true, 'City is required'],
                trim: true,
            },
            state: {
                type: String,
                trim: true,
            },
            address: {
                type: String,
                trim: true,
            },
            zipCode: {
                type: String,
                trim: true,
            },
        },
        // For DAILY and EVENT_BASED jobs
        workDate: {
            type: Date,
            required: function () {
                return ['DAILY', 'EVENT_BASED'].includes(this.jobType);
            },
            validate: {
                validator: function (value) {
                    if (['DAILY', 'EVENT_BASED'].includes(this.jobType)) {
                        return value >= new Date().setHours(0, 0, 0, 0);
                    }
                    return true;
                },
                message: 'Work date cannot be in the past',
            },
        },
        startTime: {
            type: String,
            required: function () {
                return ['DAILY', 'EVENT_BASED'].includes(this.jobType);
            },
        },
        endTime: {
            type: String,
            required: function () {
                return ['DAILY', 'EVENT_BASED'].includes(this.jobType);
            },
        },
        workersRequired: {
            type: Number,
            default: 1,
            min: [1, 'At least 1 worker is required'],
        },
        workersHired: {
            type: Number,
            default: 0,
            min: [0, 'Workers hired cannot be negative'],
        },
        // Requirements
        skills: {
            type: [String],
            default: [],
        },
        experience: {
            type: String,
            enum: ['FRESHER', 'ENTRY', 'MID', 'SENIOR', 'ANY'],
            default: 'ANY',
        },
        education: {
            type: String,
            trim: true,
        },
        // Job Status
        status: {
            type: String,
            enum: ['ACTIVE', 'CLOSED', 'EXPIRED'],
            default: 'ACTIVE',
        },
        deadline: {
            type: Date,
        },
        // Analytics
        views: {
            type: Number,
            default: 0,
        },
        applicants: {
            type: Number,
            default: 0,
        },
        // Additional Features
        isUrgent: {
            type: Boolean,
            default: false,
        },
        category: {
            type: String,
            default: 'OTHER',
        },
        foodProvided: {
            type: Boolean,
            default: false,
        },
        shift: {
            type: String,
            enum: ['DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE'],
        },
        daysPerWeek: {
            type: Number,
            min: 1,
            max: 7,
        },
        workingHours: {
            type: String,
            trim: true,
            required: function () {
                return this.jobType === 'PART_TIME';
            },
        },
        joiningDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
jobSchema.index({ employer: 1, createdAt: -1 });
jobSchema.index({ jobType: 1, status: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ workDate: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

// Virtual for checking if job is full (for daily/event jobs)
jobSchema.virtual('isFull').get(function () {
    if (['DAILY', 'EVENT_BASED'].includes(this.jobType)) {
        return this.workersHired >= this.workersRequired;
    }
    return false;
});

// Auto-expire daily/event jobs after work date
jobSchema.pre('save', async function () {
    if (['DAILY', 'EVENT_BASED'].includes(this.jobType) && this.workDate) {
        const today = new Date().setHours(0, 0, 0, 0);
        const workDay = new Date(this.workDate).setHours(0, 0, 0, 0);

        if (workDay < today && this.status === 'ACTIVE') {
            this.status = 'EXPIRED';
        }
    }
});

// Method to increment view count
jobSchema.methods.incrementViews = async function () {
    this.views += 1;
    await this.save();
};

// Method to increment applicants count
jobSchema.methods.incrementApplicants = async function () {
    this.applicants += 1;
    await this.save();
};

// Method to decrement applicants count
jobSchema.methods.decrementApplicants = async function () {
    if (this.applicants > 0) {
        this.applicants -= 1;
        await this.save();
    }
};

// Method to hire worker (for all jobs)
jobSchema.methods.hireWorker = async function () {
    this.workersHired += 1;
    if (this.workersHired >= this.workersRequired) {
        this.status = 'CLOSED';
    }
    await this.save();
};

module.exports = mongoose.model('Job', jobSchema);
