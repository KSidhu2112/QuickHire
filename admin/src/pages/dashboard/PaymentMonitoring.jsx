import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FaMoneyBillWave,
  FaUserTie,
  FaUserCog,
  FaClock,
  FaTimesCircle,
  FaDownload,
  FaSyncAlt,
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSortAmountDown,
  FaSortAmountUp,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaExclamationCircle,
  FaHourglassHalf,
  FaCreditCard,
  FaReceipt
} from 'react-icons/fa';
import './PaymentMonitoring.css';

const API_BASE = 'http://localhost:5000/api/payments/admin';

const PaymentMonitoring = () => {
  // Data
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sorting
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // UI State
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch payments
  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const params = {
        page: currentPage,
        limit: perPage,
        sortBy,
        sortOrder,
      };

      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get(`${API_BASE}/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (res.data.success) {
        setPayments(res.data.data);
        setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, perPage, roleFilter, statusFilter, startDate, endDate, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Export CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await axios.get(`${API_BASE}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      // Download file
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QuickHire_Payments_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || startDate || endDate || searchQuery;

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Format date
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  // Generate pagination buttons
  const getPaginationButtons = () => {
    if (!pagination) return [];
    const { currentPage: cp, totalPages: tp } = pagination;
    const buttons = [];
    const range = 2;

    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) buttons.push(i);
    } else {
      buttons.push(1);
      if (cp > range + 2) buttons.push('...');
      for (let i = Math.max(2, cp - range); i <= Math.min(tp - 1, cp + range); i++) {
        buttons.push(i);
      }
      if (cp < tp - range - 1) buttons.push('...');
      buttons.push(tp);
    }

    return buttons;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Success': return <FaCheckCircle />;
      case 'Failed': return <FaTimesCircle />;
      case 'Pending': return <FaHourglassHalf />;
      default: return <FaExclamationCircle />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="payment-dashboard">
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading payment dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-dashboard fade-in">
      {/* Header */}
      <div className="payment-header">
        <div className="payment-header-left">
          <h1>💳 Payment Dashboard</h1>
          <p>Monitor all transactions • Employees ₹10/apply • Employers ₹20/post</p>
        </div>
        <div className="header-actions">
          <button
            className={`btn-export ${exporting ? 'disabled' : ''}`}
            onClick={handleExportCSV}
            disabled={exporting}
            id="btn-export-csv"
          >
            <FaDownload />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            className={`btn-refresh ${refreshing ? 'spinning' : ''}`}
            onClick={() => fetchPayments(true)}
            id="btn-refresh"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="revenue-cards-grid stagger-children">
        <div className="revenue-card total" id="card-total-revenue">
          <div className="card-icon"><FaMoneyBillWave /></div>
          <div className="card-details">
            <div className="card-label">Total Revenue</div>
            <div className="card-value">₹{(summary?.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="card-count">{summary?.totalSuccessCount || 0} successful payments</div>
          </div>
        </div>

        <div className="revenue-card employee" id="card-employee-revenue">
          <div className="card-icon"><FaUserCog /></div>
          <div className="card-details">
            <div className="card-label">Employee Revenue</div>
            <div className="card-value">₹{(summary?.employeeRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="card-count">{summary?.employeeCount || 0} job applications</div>
          </div>
        </div>

        <div className="revenue-card employer" id="card-employer-revenue">
          <div className="card-icon"><FaUserTie /></div>
          <div className="card-details">
            <div className="card-label">Employer Revenue</div>
            <div className="card-value">₹{(summary?.employerRevenue || 0).toLocaleString('en-IN')}</div>
            <div className="card-count">{summary?.employerCount || 0} job posts</div>
          </div>
        </div>

        <div className="revenue-card pending" id="card-pending">
          <div className="card-icon"><FaClock /></div>
          <div className="card-details">
            <div className="card-label">Pending</div>
            <div className="card-value">₹{(summary?.pendingAmount || 0).toLocaleString('en-IN')}</div>
            <div className="card-count">{summary?.pendingCount || 0} awaiting</div>
          </div>
        </div>

        <div className="revenue-card failed" id="card-failed">
          <div className="card-icon"><FaTimesCircle /></div>
          <div className="card-details">
            <div className="card-label">Failed</div>
            <div className="card-value">₹{(summary?.failedAmount || 0).toLocaleString('en-IN')}</div>
            <div className="card-count">{summary?.failedCount || 0} transactions</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar" id="filters-bar">
        <div className="filter-group">
          <label><FaFilter style={{ marginRight: '0.3rem' }} />Role</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
            id="filter-role"
          >
            <option value="all">All Roles</option>
            <option value="Employee">Employee</option>
            <option value="Employer">Employer</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            id="filter-status"
          >
            <option value="all">All Status</option>
            <option value="Success">✅ Success</option>
            <option value="Failed">❌ Failed</option>
            <option value="Pending">⏳ Pending</option>
          </select>
        </div>

        <div className="filter-group">
          <label>From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
            id="filter-start-date"
          />
        </div>

        <div className="filter-group">
          <label>To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
            id="filter-end-date"
          />
        </div>

        <div className="filter-group">
          <label><FaSearch style={{ marginRight: '0.3rem' }} />Search</label>
          <div className="search-input-wrapper">
            <FaSearch />
            <input
              type="text"
              placeholder="Name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="filter-actions">
            <button className="btn-clear-filters" onClick={clearFilters} id="btn-clear-filters">
              <FaTimes /> Clear
            </button>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="results-info">
        <span className="results-count">
          Showing <strong>{payments.length}</strong> of <strong>{pagination?.totalRecords || 0}</strong> payments
          {hasActiveFilters && ' (filtered)'}
        </span>
        <div className="per-page-select">
          <label>Per Page:</label>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            id="select-per-page"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Payment Table */}
      <div className="payment-table-wrapper">
        <table className="payment-table" id="payment-table">
          <thead>
            <tr>
              <th className={`sortable ${sortBy === 'name' ? 'sorted' : ''}`} onClick={() => handleSort('name')}>
                Name / Email
                {sortBy === 'name' && (
                  <span className="sort-icon">{sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                )}
              </th>
              <th>Role</th>
              <th className={`sortable ${sortBy === 'amount' ? 'sorted' : ''}`} onClick={() => handleSort('amount')}>
                Amount
                {sortBy === 'amount' && (
                  <span className="sort-icon">{sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                )}
              </th>
              <th>Payment Type</th>
              <th>Method</th>
              <th>Transaction ID</th>
              <th>Status</th>
              <th className={`sortable ${sortBy === 'createdAt' ? 'sorted' : ''}`} onClick={() => handleSort('createdAt')}>
                Date
                {sortBy === 'createdAt' && (
                  <span className="sort-icon">{sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="8">
                  <div className="empty-state">
                    <div className="empty-state-icon"><FaFileInvoiceDollar /></div>
                    <h3>No payments found</h3>
                    <p>{hasActiveFilters ? 'Try adjusting your filters' : 'Payments will appear here once transactions are made'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              payments.map((payment, idx) => {
                const { date, time } = formatDate(payment.createdAt);
                const roleClass = payment.userRole === 'Employer' ? 'employer' : 'employee';
                const statusClass = payment.status.toLowerCase();

                return (
                  <tr key={payment._id || idx}>
                    <td>
                      <div className="user-cell">
                        <span className="user-name">{payment.name}</span>
                        <span className="user-email">{payment.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${roleClass}`}>
                        {payment.userRole === 'Employer' ? <FaUserTie /> : <FaUserCog />}
                        {payment.userRole}
                      </span>
                    </td>
                    <td className="amount-cell">₹{payment.amount}</td>
                    <td>
                      <span className="type-badge">
                        {payment.paymentType === 'Job Post' ? <FaReceipt /> : <FaCreditCard />}
                        {payment.paymentType}
                      </span>
                    </td>
                    <td>
                      <span className="method-badge">{payment.paymentMethod}</span>
                    </td>
                    <td className="txn-id" title={payment.transactionId}>
                      {payment.transactionId?.length > 18
                        ? payment.transactionId.slice(0, 18) + '...'
                        : payment.transactionId}
                    </td>
                    <td>
                      <span className={`status-pill ${statusClass}`}>
                        <span className="status-dot" />
                        {payment.status}
                      </span>
                    </td>
                    <td className="date-cell">
                      {date}
                      <div className="date-time">{time}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="pagination-bar" id="pagination">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            id="btn-prev-page"
          >
            <FaChevronLeft />
          </button>

          {getPaginationButtons().map((btn, idx) => (
            btn === '...' ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
            ) : (
              <button
                key={btn}
                className={currentPage === btn ? 'active' : ''}
                onClick={() => setCurrentPage(btn)}
              >
                {btn}
              </button>
            )
          ))}

          <button
            disabled={!pagination.hasNext}
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            id="btn-next-page"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentMonitoring;
