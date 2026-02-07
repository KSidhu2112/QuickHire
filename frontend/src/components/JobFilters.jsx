import React, { useState } from 'react';
import './JobFilters.css';

const JobFilters = ({ onFilterChange, jobType }) => {
    const [filters, setFilters] = useState({
        city: '',
        date: '',
        salaryMin: '',
        experience: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            city: '',
            date: '',
            salaryMin: '',
            experience: '',
        };
        setFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className="job-filters">
            <h3 className="filters-title">Filters</h3>

            <div className="filter-group">
                <label htmlFor="city">Location</label>
                <input
                    type="text"
                    id="city"
                    name="city"
                    placeholder="City name"
                    value={filters.city}
                    onChange={handleChange}
                />
            </div>

            {(jobType === 'DAILY' || jobType === 'EVENT_BASED') && (
                <div className="filter-group">
                    <label htmlFor="date">Work Date</label>
                    <input
                        type="date"
                        id="date"
                        name="date"
                        value={filters.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
            )}

            <div className="filter-group">
                <label htmlFor="salaryMin">Min Salary (₹)</label>
                <input
                    type="number"
                    id="salaryMin"
                    name="salaryMin"
                    placeholder="e.g., 15000"
                    value={filters.salaryMin}
                    onChange={handleChange}
                    min="0"
                />
            </div>

            <div className="filter-group">
                <label htmlFor="experience">Experience Level</label>
                <select
                    id="experience"
                    name="experience"
                    value={filters.experience}
                    onChange={handleChange}
                >
                    <option value="">All Levels</option>
                    <option value="FRESHER">Fresher</option>
                    <option value="ENTRY">Entry Level (1-2 years)</option>
                    <option value="MID">Mid Level (3-5 years)</option>
                    <option value="SENIOR">Senior (5+ years)</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="category">Category</label>
                <select
                    id="category"
                    name="category"
                    value={filters.category || 'ALL'}
                    onChange={handleChange}
                >
                    <option value="ALL">All Categories</option>
                    <option value="SHOP">Shop</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="OFFICE">Office</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="CATERING">Catering</option>
                    <option value="EVENT">Event</option>
                    <option value="HELPER">Helper</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div className="filter-group">
                <label htmlFor="sort">Sort By</label>
                <select
                    id="sort"
                    name="sort"
                    value={filters.sort || '-createdAt'}
                    onChange={handleChange}
                >
                    <option value="-createdAt">Newest First</option>
                    <option value="createdAt">Oldest First</option>
                    <option value="-salaryMax">Salary: High to Low</option>
                    <option value="salaryMin">Salary: Low to High</option>
                </select>
            </div>

            <button className="btn-reset-filters" onClick={handleReset}>
                Reset Filters
            </button>
        </div >
    );
};

export default JobFilters;
