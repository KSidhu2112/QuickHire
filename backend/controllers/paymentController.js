const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Job = require('../models/Job');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: (process.env.RAZ_API_KEY || '').trim(),
  key_secret: (process.env.RAZ_SECRET_KEY || '').trim(),
});

// Create Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    const { action, jobId, amount, paymentMethod } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // Check vacancies even before creating order if it's an application
    if (action === 'apply' && jobId) {
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }
      if (job.workersHired >= job.workersRequired) {
        return res.status(400).json({ success: false, message: 'This job is already full. No more vacancies left.' });
      }
    }

    // Get user details for denormalized storage
    const user = await User.findById(userId).select('name email');

    // Validate amount
    let expectedAmount = 0;
    if (action === 'apply') expectedAmount = 10;
    else if (action === 'post_job') expectedAmount = 20;

    const finalAmount = amount || expectedAmount;

    // Map action to paymentType
    const paymentType = action === 'apply' ? 'Job Apply' : 'Job Post';

    // Map role for admin display
    const displayRole = (role === 'jobseeker' || role === 'employee') ? 'Employee' : 'Employer';

    const options = {
      amount: finalAmount * 100, // Amount in paise
      currency: 'INR',
      receipt: `rect_${Date.now()}_${userId.toString().slice(-5)}`,
    };

    const order = await razorpay.orders.create(options);

    // Create payment record with enhanced fields
    const payment = new Payment({
      userId,
      userRole: displayRole,
      name: user?.name || '',
      email: user?.email || '',
      jobId: jobId || null,
      amount: finalAmount,
      paymentType,
      paymentMethod: paymentMethod || 'Razorpay',
      orderId: order.id,
      action,
      status: 'Pending',
      paymentStatus: 'pending',
    });

    await payment.save();

    res.status(200).json({
      success: true,
      order,
      paymentId: payment._id,
      key: process.env.RAZ_API_KEY
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZ_SECRET_KEY)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const payment = await Payment.findOne({ orderId: razorpay_order_id });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      payment.paymentStatus = 'completed';
      payment.status = 'Success';
      payment.transactionId = razorpay_payment_id;
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        transactionId: razorpay_payment_id
      });
    } else {
      // Mark as failed
      const payment = await Payment.findOne({ orderId: razorpay_order_id });
      if (payment) {
        payment.paymentStatus = 'failed';
        payment.status = 'Failed';
        await payment.save();
      }

      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
      error: error.message
    });
  }
};

// Check payment status for an action
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { action, jobId } = req.query;
    const userId = req.user.id;
    console.log(`🔍 Checking payment status: User=${userId}, Action=${action}, JobId=${jobId || 'N/A'}`);

    let query = {
      userId,
      action,
      paymentStatus: 'completed',
      used: false
    };

    if (jobId) {
      query.jobId = jobId;
    }

    const payment = await Payment.findOne(query).sort({ timestamp: -1 });

    if (payment) {
      return res.status(200).json({
        paid: true,
        payment
      });
    } else {
      return res.status(200).json({
        paid: false
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user's transaction history
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Normalize for frontend
    const normalized = transactions.map(txn => {
      let displayStatus = txn.status || 'Pending';
      if (txn.paymentStatus === 'completed' || txn.status === 'Success') {
          displayStatus = 'COMPLETED';
      } else if (txn.paymentStatus === 'failed' || txn.status === 'Failed') {
          displayStatus = 'REFUNDED'; // or failed
      }
      
      return {
          ...txn,
          description: txn.paymentType || (txn.action === 'post_job' ? 'Job Posting Fee' : 'Application Fee'),
          method: txn.paymentMethod || 'Razorpay',
          status: displayStatus,
          type: txn.paymentMethod || 'Razorpay'
      };
    });

    res.status(200).json({
      success: true,
      transactions: normalized
    });
  } catch (error) {
    console.error('Fetch History Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load transaction history' });
  }
};

// ==================== ADMIN PAYMENT APIs ====================

// Get all payments for admin with filters, search, pagination
exports.getAdminPayments = async (req, res) => {
  try {
    const {
      role,       // Employee / Employer
      status,     // Success / Failed / Pending
      startDate,
      endDate,
      search,     // name or email
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('--- FETCHING ADMIN PAYMENTS ---');
    console.log('Params:', { role, status, startDate, endDate, search, page, limit });

    // Build filter array for $and
    let andFilters = [];

    // Role filter
    if (role && role !== 'all') {
      if (role === 'Employee') {
        andFilters.push({
          $or: [
            { userRole: { $in: ['Employee', 'employee', 'jobseeker'] } },
            { role: { $in: ['Employee', 'employee', 'jobseeker'] } }
          ]
        });
      } else if (role === 'Employer') {
        andFilters.push({
          $or: [
            { userRole: { $in: ['Employer', 'employer'] } },
            { role: { $in: ['Employer', 'employer'] } }
          ]
        });
      }
    }

    // Status filter
    if (status && status !== 'all') {
      if (status === 'Success') {
        andFilters.push({
          $or: [
            { status: 'Success' },
            { paymentStatus: 'completed' }
          ]
        });
      } else if (status === 'Failed') {
        andFilters.push({
          $or: [
            { status: 'Failed' },
            { paymentStatus: 'failed' }
          ]
        });
      } else if (status === 'Pending') {
        andFilters.push({
          $or: [
            { status: 'Pending' },
            { paymentStatus: 'pending' }
          ]
        });
      }
    }

    // Date range filter
    if (startDate || endDate) {
      let dateQuery = { createdAt: {} };
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
      andFilters.push(dateQuery);
    }

    // Search by name or email
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      andFilters.push({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      });
    }

    // Combine all filters
    const query = andFilters.length > 0 ? { $and: andFilters } : {};
    console.log('Final Query:', JSON.stringify(query, null, 2));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sort = {};
    if (sortBy === 'name' || sortBy === 'email' || sortBy === 'amount' || sortBy === 'createdAt') {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sort['createdAt'] = -1;
    }

    // Execute queries in parallel
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email role phone')
        .populate('jobId', 'title')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(query)
    ]);

    console.log('Results Count:', payments.length);
    console.log('Total Count:', totalCount);

    // Normalize the payment data for frontend
    const normalizedPayments = payments.map(p => {
      // Determine display status
      let displayStatus = p.status || 'Pending';
      if (p.paymentStatus === 'completed' || displayStatus === 'Success') displayStatus = 'Success';
      else if (p.paymentStatus === 'failed' || displayStatus === 'Failed') displayStatus = 'Failed';
      else displayStatus = 'Pending';

      // Determine display role
      let displayRoleRaw = p.userRole || p.role || 'Employee';
      let displayRole = 'Employee';
      if (['employer', 'Employer', 'employ'].includes(displayRoleRaw)) displayRole = 'Employer';

      // Determine payment type
      let displayType = p.paymentType || (p.action === 'post_job' ? 'Job Post' : 'Job Apply');
      if (!displayType) displayType = 'Job Apply'; // Default

      return {
        _id: p._id,
        paymentId: p._id.toString(),
        userId: p.userId?._id || p.userId,
        userRole: displayRole,
        name: p.name || p.userId?.name || 'Unknown',
        email: p.email || p.userId?.email || 'N/A',
        amount: p.amount || 0,
        paymentType: displayType,
        paymentMethod: p.paymentMethod || 'Razorpay',
        transactionId: p.transactionId || p.orderId || 'N/A',
        orderId: p.orderId,
        status: displayStatus,
        jobTitle: p.jobId?.title || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      };
    });

    // Calculate summary stats (using both schema variants)
    const summaryPipeline = [
      {
        $facet: {
          totalRevenue: [
            {
              $match: {
                $or: [
                  { status: 'Success' },
                  { paymentStatus: 'completed' }
                ]
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          employeeRevenue: [
            {
              $match: {
                $and: [
                  { $or: [{ status: 'Success' }, { paymentStatus: 'completed' }] },
                  {
                    $or: [
                      { userRole: { $in: ['Employee', 'employee', 'jobseeker'] } },
                      { role: { $in: ['Employee', 'employee', 'jobseeker'] } }
                    ]
                  }
                ]
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          employerRevenue: [
            {
              $match: {
                $and: [
                  { $or: [{ status: 'Success' }, { paymentStatus: 'completed' }] },
                  {
                    $or: [
                      { userRole: { $in: ['Employer', 'employer'] } },
                      { role: { $in: ['Employer', 'employer'] } }
                    ]
                  }
                ]
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          pendingPayments: [
            {
              $match: {
                $and: [
                  { $or: [{ status: 'Pending' }, { paymentStatus: 'pending' }] },
                  { status: { $ne: 'Success' } },
                  { paymentStatus: { $ne: 'completed' } }
                ]
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          failedPayments: [
            {
              $match: {
                $or: [
                  { status: 'Failed' },
                  { paymentStatus: 'failed' }
                ]
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ];

    const [summaryResult] = await Payment.aggregate(summaryPipeline);
    const summary = {
      totalRevenue: summaryResult.totalRevenue[0]?.total || 0,
      totalSuccessCount: summaryResult.totalRevenue[0]?.count || 0,
      employeeRevenue: summaryResult.employeeRevenue[0]?.total || 0,
      employeeCount: summaryResult.employeeRevenue[0]?.count || 0,
      employerRevenue: summaryResult.employerRevenue[0]?.total || 0,
      employerCount: summaryResult.employerRevenue[0]?.count || 0,
      pendingAmount: summaryResult.pendingPayments[0]?.total || 0,
      pendingCount: summaryResult.pendingPayments[0]?.count || 0,
      failedAmount: summaryResult.failedPayments[0]?.total || 0,
      failedCount: summaryResult.failedPayments[0]?.count || 0,
      totalAllPayments: totalCount
    };

    res.status(200).json({
      success: true,
      data: normalizedPayments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalRecords: totalCount,
        perPage: limitNum,
        hasNext: pageNum < Math.ceil(totalCount / limitNum),
        hasPrev: pageNum > 1
      },
      summary
    });
  } catch (error) {
    console.error('Admin Get Payments Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
  }
};

// Export payments to CSV
exports.exportPaymentsCSV = async (req, res) => {
  try {
    const { role, status, startDate, endDate, search } = req.query;

    let query = {};

    if (role && role !== 'all') {
      if (role === 'Employee') {
        query.userRole = { $in: ['Employee', 'employee', 'jobseeker'] };
      } else if (role === 'Employer') {
        query.userRole = { $in: ['Employer', 'employer'] };
      }
    }

    if (status && status !== 'all') {
      if (status === 'Success') {
        query.$or = [{ status: 'Success' }, { paymentStatus: 'completed' }];
      } else if (status === 'Failed') {
        query.$or = [{ status: 'Failed' }, { paymentStatus: 'failed' }];
      } else if (status === 'Pending') {
        query.$or = [{ status: 'Pending' }, { paymentStatus: 'pending' }];
      }
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      if (query.$or) {
        const statusOr = query.$or;
        delete query.$or;
        query.$and = [
          { $or: statusOr },
          { $or: [{ name: searchRegex }, { email: searchRegex }] }
        ];
      } else {
        query.$or = [{ name: searchRegex }, { email: searchRegex }];
      }
    }

    const payments = await Payment.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV
    const headers = 'Payment ID,Name,Email,Role,Amount (₹),Payment Type,Payment Method,Transaction ID,Status,Date\n';
    const rows = payments.map(p => {
      let displayStatus = p.status || 'Pending';
      if (displayStatus === 'completed') displayStatus = 'Success';
      else if (displayStatus === 'failed') displayStatus = 'Failed';

      let displayRole = p.userRole || 'Employee';
      if (['jobseeker', 'employee'].includes(displayRole?.toLowerCase())) displayRole = 'Employee';
      else if (['employer'].includes(displayRole?.toLowerCase())) displayRole = 'Employer';

      const displayType = p.paymentType || (p.action === 'post_job' ? 'Job Post' : 'Job Apply');
      const name = (p.name || p.userId?.name || 'Unknown').replace(/,/g, ' ');
      const email = p.email || p.userId?.email || 'N/A';
      const date = new Date(p.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      return `${p._id},"${name}",${email},${displayRole},${p.amount},${displayType},${p.paymentMethod || 'Razorpay'},${p.transactionId || p.orderId || 'N/A'},${displayStatus},"${date}"`;
    }).join('\n');

    const csv = headers + rows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=QuickHire_Payments_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Export CSV Error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV', error: error.message });
  }
};

// Store payment after a successful external transaction (manual/webhook)
exports.storePayment = async (req, res) => {
  try {
    const {
      userId,
      userRole,
      name,
      email,
      amount,
      paymentType,
      paymentMethod,
      transactionId,
      orderId,
      status,
      jobId
    } = req.body;

    // Validate required fields
    if (!userId || !amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'userId, amount, and transactionId are required'
      });
    }

    // Check for duplicate transaction
    const existing = await Payment.findOne({ transactionId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Transaction ID already exists'
      });
    }

    // Get user info if not provided
    let userName = name;
    let userEmail = email;
    let role = userRole;
    if (!userName || !userEmail) {
      const user = await User.findById(userId).select('name email role');
      if (user) {
        userName = userName || user.name;
        userEmail = userEmail || user.email;
        role = role || user.role;
      }
    }

    const payment = new Payment({
      userId,
      userRole: role || 'Employee',
      name: userName || '',
      email: userEmail || '',
      jobId: jobId || null,
      amount,
      paymentType: paymentType || 'Job Apply',
      paymentMethod: paymentMethod || 'Razorpay',
      transactionId,
      orderId: orderId || `manual_${Date.now()}`,
      status: status || 'Success',
      paymentStatus: (status === 'Success') ? 'completed' : 'pending',
      action: paymentType === 'Job Post' ? 'post_job' : 'apply'
    });

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment stored successfully',
      data: payment
    });
  } catch (error) {
    console.error('Store Payment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to store payment', error: error.message });
  }
};
