/**
 * ═══════════════════════════════════════════════════════════════════════
 *  NearbyJobs.jsx  –  "Find Jobs Near You" Feature
 * ═══════════════════════════════════════════════════════════════════════
 *
 *  ALGORITHM EXPLANATION  (Haversine Formula)
 *  ──────────────────────────────────────────
 *  The Haversine formula calculates the great-circle distance between
 *  two points on a sphere given their latitudes and longitudes.
 *
 *  Given two points (lat1, lng1) and (lat2, lng2):
 *
 *      a = sin²(Δlat / 2)
 *        + cos(lat1) · cos(lat2) · sin²(Δlng / 2)
 *
 *      c = 2 · atan2(√a, √(1 − a))
 *
 *      distance = R · c          (R = 6 371 km, Earth's mean radius)
 *
 *  This works because the Haversine formula avoids the numerical
 *  instabilities of the simpler spherical law of cosines for short
 *  distances, and is accurate to within ~0.5 % for all distances.
 *
 *  WORKFLOW
 *  ────────
 *  1. On mount, request the browser's Geolocation API for
 *     the employee's current latitude / longitude.
 *  2. Employee types a distance (in km) into the search bar.
 *  3. On search, we call the backend `/api/jobs/nearby` endpoint,
 *     which runs a MongoDB $geoNear aggregation (or Haversine
 *     fallback) to return only matching jobs.
 *  4. As a bonus, the frontend also has a pure-JS Haversine utility
 *     that we use when we have sample/demo data, or as a local filter
 *     on the returned results.
 *  5. Each job card shows the calculated distance (e.g. "2.3 km away").
 *
 * ═══════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI, authAPI, paymentAPI } from '../../services/api';
import TrustApplyModal from '../../components/TrustApplyModal';
import PaymentModal from '../../components/PaymentModal';
import { toast } from 'react-toastify';
import './NearbyJobs.css';

// ─── Sample / fallback job data ────────────────────────────────────────
// Used when the backend has no geo-tagged jobs yet so the UI isn't empty.
const SAMPLE_JOBS = [
    {
        _id: 'sample-1',
        title: 'Executive Chef',
        company: 'Spice Garden Mumbai',
        salaryMin: 45000,
        salaryMax: 60000,
        salaryType: 'MONTHLY',
        jobType: 'FULL_TIME',
        location: { city: 'Mumbai', address: 'Andheri West' },
        latitude: 19.1364,
        longitude: 72.8296,
        workersRequired: 1,
        workersHired: 0,
        skills: ['Continental', 'Management'],
        experience: 'SENIOR',
        isUrgent: true,
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'sample-2',
        title: 'Retail Associate',
        company: 'FashioStore BKC',
        salaryMin: 18000,
        salaryMax: 22000,
        salaryType: 'MONTHLY',
        jobType: 'FULL_TIME',
        location: { city: 'Mumbai', address: 'BKC' },
        latitude: 19.0596,
        longitude: 72.8656,
        workersRequired: 4,
        workersHired: 1,
        skills: ['Billing', 'Communication'],
        experience: 'ENTRY',
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'sample-3',
        title: 'Warehouse Specialist',
        company: 'Logistics Hub',
        salaryMin: 15000,
        salaryMax: 18000,
        salaryType: 'MONTHLY',
        jobType: 'FULL_TIME',
        location: { city: 'Thane', address: 'Majiwada' },
        latitude: 19.2183,
        longitude: 72.9781,
        workersRequired: 15,
        workersHired: 5,
        skills: ['Heavy Lifting'],
        experience: 'ANY',
        immediateJoining: true,
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'sample-4',
        title: 'Software Intern',
        company: 'TechDelhi',
        salaryMin: 10000,
        salaryMax: 15000,
        salaryType: 'MONTHLY',
        jobType: 'INTERNSHIP',
        location: { city: 'Delhi', address: 'Connaught Place' },
        latitude: 28.6315,
        longitude: 77.2167,
        workersRequired: 2,
        workersHired: 0,
        skills: ['JavaScript', 'React'],
        experience: 'FRESHER',
        createdAt: new Date().toISOString(),
    },
    {
        _id: 'sample-5',
        title: 'Security Guard',
        company: 'SafeGuard South',
        salaryMin: 12000,
        salaryMax: 14000,
        salaryType: 'MONTHLY',
        jobType: 'FULL_TIME',
        location: { city: 'Bangalore', address: 'Koramangala' },
        latitude: 12.9352,
        longitude: 77.6245,
        workersRequired: 10,
        workersHired: 8,
        skills: ['Observation'],
        experience: 'ENTRY',
        createdAt: new Date().toISOString(),
    },
];

// ═══════════════════════════════════════════════════════════════════
//  HAVERSINE DISTANCE CALCULATION (pure JavaScript, reusable)
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate the great-circle distance between two points using the
 * Haversine formula.
 *
 * @param {number} lat1  – Latitude of point 1  (degrees)
 * @param {number} lng1  – Longitude of point 1 (degrees)
 * @param {number} lat2  – Latitude of point 2  (degrees)
 * @param {number} lng2  – Longitude of point 2 (degrees)
 * @returns {number}     – Distance in kilometres
 *
 * Steps:
 *   1. Convert all degrees to radians.
 *   2. Compute Δlat and Δlng.
 *   3. Apply the Haversine formula:
 *        a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)
 *        c = 2·atan2(√a, √(1−a))
 *        distance = R · c
 *   4. Return the distance in km.
 */
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
    // Step 1 – Earth's mean radius in kilometres
    const R = 6371;

    // Step 2 – Helper to convert degrees → radians
    const toRadians = (degrees) => (degrees * Math.PI) / 180;

    // Step 3 – Compute deltas in radians
    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    // Step 4 – Haversine intermediate value 'a'
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    // Step 5 – Angular distance 'c'
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Step 6 – Final distance in km
    return R * c;
}

// ═══════════════════════════════════════════════════════════════════
//  FILTER JOBS BY DISTANCE (reusable utility)
// ═══════════════════════════════════════════════════════════════════

/**
 * Filter an array of job objects and keep only those within
 * `maxKm` of the user's position. Each returned job gets an
 * extra `.distanceKm` property.
 *
 * @param {Array}  jobs    – Array of job objects with lat/lng
 * @param {number} userLat – Employee's latitude
 * @param {number} userLng – Employee's longitude
 * @param {number} maxKm   – Maximum distance in kilometres
 * @returns {Array}        – Filtered & sorted (nearest first)
 */
function filterJobsByDistance(jobs, userLat, userLng, maxKm) {
    return jobs
        .map((job) => {
            // Each job may store coords in different shapes:
            //   • backend GeoJSON → job.coordinates.coordinates = [lng, lat]
            //   • sample data     → job.latitude, job.longitude
            let jobLat, jobLng;
            if (job.coordinates?.coordinates?.length === 2) {
                [jobLng, jobLat] = job.coordinates.coordinates;
            } else {
                jobLat = job.latitude;
                jobLng = job.longitude;
            }

            // Skip jobs without valid coordinates
            if (jobLat == null || jobLng == null) return null;

            // Calculate Haversine distance
            const distance = calculateHaversineDistance(
                userLat,
                userLng,
                jobLat,
                jobLng
            );

            return {
                ...job,
                distanceKm: parseFloat(distance.toFixed(2)),
            };
        })
        .filter((job) => job !== null && job.distanceKm <= maxKm) // keep only nearby
        .sort((a, b) => a.distanceKm - b.distanceKm); // nearest first
}

// ═══════════════════════════════════════════════════════════════════
//  REACT COMPONENT
// ═══════════════════════════════════════════════════════════════════

const NearbyJobs = () => {
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────
    const [userLocation, setUserLocation] = useState(null); // { lat, lng }
    const [locationError, setLocationError] = useState('');
    const [locationLoading, setLocationLoading] = useState(true);
    const [distanceInput, setDistanceInput] = useState('20'); // km input
    const [searchRadius, setSearchRadius] = useState(20); // active search km
    const [hasSearched, setHasSearched] = useState(false);

    const [nearJobs, setNearJobs] = useState([]); // jobs <= searchRadius
    const [farJobs, setFarJobs] = useState([]); // jobs > 20km or other
    const [loading, setLoading] = useState(false);
    const [usingSampleData, setUsingSampleData] = useState(false);

    // Apply modal state
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showTrustModal, setShowTrustModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [showDistant, setShowDistant] = useState(false); // Toggle for distant jobs

    // ── Step 1: Detect location and load INITIAL jobs ──────────────
    useEffect(() => {
        const storedUser = authAPI.getStoredUser();
        if (!storedUser || storedUser.role !== 'jobseeker') {
            navigate('/login');
            return;
        }

        if (!navigator.geolocation) {
            setLocationError('Geolocation not supported.');
            setLocationLoading(false);
            fetchAllJobs(null); // Load without location
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const loc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                setUserLocation(loc);
                setLocationLoading(false);
                fetchAllJobs(loc);
            },
            (error) => {
                console.warn('Geolocation failed:', error.message);
                setLocationError('Could not get your exact location. Distances might not be accurate.');
                setLocationLoading(false);
                fetchAllJobs(null);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [navigate]);

    // ── Load All Jobs function ─────────────────────────────────────
    const fetchAllJobs = async (loc, optionalRadius) => {
        setLoading(true);
        try {
            const radiusToUse = optionalRadius || parseFloat(distanceInput || 20);

            const geoResponse = await jobAPI.getNearbyJobs(
                loc?.lat || 19.076,
                loc?.lng || 72.877,
                20000
            );

            let combinedJobs = [];
            if (geoResponse.success && geoResponse.jobs.length > 0) {
                combinedJobs = geoResponse.jobs;
            }

            const allResponse = await jobAPI.getJobs({ status: 'ACTIVE', limit: 100 });
            if (allResponse.success && allResponse.jobs.length > 0) {
                const existingIds = new Set(combinedJobs.map(j => j._id));
                const missingJobs = allResponse.jobs.filter(j => !existingIds.has(j._id));
                combinedJobs = [...combinedJobs, ...missingJobs];
            }

            if (combinedJobs.length === 0) {
                combinedJobs = SAMPLE_JOBS;
                setUsingSampleData(true);
            } else {
                setUsingSampleData(false);
            }

            processJobs(combinedJobs, loc || { lat: 19.076, lng: 72.877 }, radiusToUse);
        } catch (err) {
            processJobs(SAMPLE_JOBS, { lat: 19.076, lng: 72.877 }, optionalRadius || parseFloat(distanceInput || 20));
            setUsingSampleData(true);
        } finally {
            setLoading(false);
            setHasSearched(true);
        }
    };

    const processJobs = (jobs, loc, radius) => {
        const enriched = jobs.map((job) => {
            let jobLat, jobLng;
            if (job.coordinates?.coordinates?.length === 2) {
                [jobLng, jobLat] = job.coordinates.coordinates;
            } else if (job.latitude && job.longitude) {
                jobLat = job.latitude;
                jobLng = job.longitude;
            }

            // If we don't have coords, distance is null
            if (!loc || jobLat == null || jobLng == null) return { ...job, distanceKm: null };

            const dist = calculateHaversineDistance(loc.lat, loc.lng, jobLat, jobLng);
            return { ...job, distanceKm: parseFloat(dist.toFixed(2)) };
        });

        // Group into Near (<= user chosen radius) and Far (everything else)
        const near = enriched.filter(j => j.distanceKm !== null && j.distanceKm <= radius)
            .sort((a, b) => a.distanceKm - b.distanceKm);

        // Everything not in "near" goes into "far" (Other km/Distant)
        // This ensures NO jobs are hidden, addressing the "only showing one job" issue.
        const far = enriched.filter(j => j.distanceKm === null || j.distanceKm > radius)
            .sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

        setNearJobs(near);
        setFarJobs(far);
    };

    // ── Search handler (Radius filtering) ──────────────────────────
    const handleSearch = useCallback(() => {
        const radius = parseFloat(distanceInput);
        if (isNaN(radius) || radius <= 0) {
            toast.error('Please enter a valid km radius.');
            return;
        }

        setSearchRadius(radius);
        // Re-process existing data locally for speed
        // This is why users see only one job if they chose 5km previously.
        // We'll re-fetch to be sure or just re-process.
        fetchAllJobs(userLocation);
    }, [distanceInput, userLocation]);

    // ── Handle pressing Enter in the search input ──────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    };

    // ── Quick-radius buttons ───────────────────────────────────────
    const quickRadii = [2, 5, 10, 20, 50, 100];

    // ── Apply logic ────────────────────────────────────────────────
    const handleApply = async (job) => {
        if (job._id.startsWith('sample-')) {
            toast.info('This is a demo job. Real jobs will appear once employers add geotagged listings.');
            return;
        }
        setSelectedJob(job);
        try {
            const status = await paymentAPI.checkStatus('apply', job._id);
            if (status.paid) {
                setShowTrustModal(true);
            } else {
                setShowPaymentModal(true);
            }
        } catch (error) {
            toast.error('Failed to check payment status');
        }
    };

    const handlePaymentSuccess = () => {
        toast.success('Payment successful! You can now apply.');
        setShowPaymentModal(false);
        setShowTrustModal(true);
    };

    const handleConfirmApply = async (trustDetails) => {
        setIsApplying(true);
        try {
            await applicationAPI.applyForJob(selectedJob._id, {
                coverLetter: '',
                availability: 'Immediate',
                shareContactInfo: true,
                trustDetails,
            });
            toast.success('Application submitted successfully!');
            setShowTrustModal(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to apply';
            toast.error(errorMsg);
        } finally {
            setIsApplying(false);
        }
    };

    // ── Job detail modal ───────────────────────────────────────────
    const handleJobClick = (job) => {
        setSelectedJob(job);
        setShowJobModal(true);
    };

    const closeJobModal = () => {
        setShowJobModal(false);
        setSelectedJob(null);
    };

    // ── Helper renderers ───────────────────────────────────────────
    const formatSalary = (min, max, type) => {
        if (max && max !== min) return `₹${min.toLocaleString()} – ₹${max.toLocaleString()} ${type}`;
        return `₹${min.toLocaleString()} ${type}`;
    };

    const getJobTypeBadgeClass = (type) => {
        switch (type) {
            case 'FULL_TIME':
                return 'badge-blue';
            case 'PART_TIME':
                return 'badge-green';
            case 'DAILY':
                return 'badge-orange';
            case 'EVENT_BASED':
                return 'badge-purple';
            case 'SHIFT_BASED':
                return 'badge-teal';
            default:
                return 'badge-gray';
        }
    };

    const getJobTypeLabel = (type) =>
        type?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || type;

    const JobGrid = ({ jobs, title, icon }) => (
        <div className="nearby-section-group">
            <div className="section-title-wrapper">
                <span className="section-icon">{icon}</span>
                <h3>{title} ({jobs.length})</h3>
            </div>
            <div className="nearby-jobs-grid">
                {jobs.map((job, index) => (
                    <div
                        key={job._id}
                        className="nearby-job-card"
                        style={{ animationDelay: `${index * 0.05}s` }}
                        onClick={() => handleJobClick(job)}
                    >
                        {/* Distance badge */}
                        <div className="distance-badge">
                            <span className="distance-icon">📍</span>
                            <span className="distance-value">
                                {job.distanceKm != null ? `${job.distanceKm} km away` : 'Distance N/A'}
                            </span>
                        </div>

                        {/* Card header */}
                        <div className="njob-header">
                            <div>
                                <h3 className="njob-title">{job.title}</h3>
                                <div className="company-rating-wrapper">
                                    <p className="njob-company">{job.company}</p>
                                    {job.employer?.stats?.avgRating > 0 && (
                                        <div className="employer-rating-badge">
                                            <span className="star">★</span>
                                            <span>{job.employer.stats.avgRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span
                                className={`njob-type-badge ${getJobTypeBadgeClass(
                                    job.jobType
                                )}`}
                            >
                                {getJobTypeLabel(job.jobType)}
                            </span>
                        </div>

                        {/* Info rows */}
                        <div className="njob-info">
                            <div className="njob-info-row">
                                <span className="njob-icon">💰</span>
                                <span>
                                    {formatSalary(
                                        job.salaryMin,
                                        job.salaryMax,
                                        job.salaryType
                                    )}
                                </span>
                            </div>
                            <div className="njob-info-row">
                                <span className="njob-icon">📍</span>
                                <span>
                                    {job.location?.address
                                        ? `${job.location.address}, ${job.location.city}`
                                        : job.location?.city || 'Location N/A'}
                                </span>
                            </div>
                            <div className="njob-info-row">
                                <span className="njob-icon">👥</span>
                                <span>
                                    Vacancies: {Math.max(0, job.workersRequired - (job.workersHired || 0))}
                                </span>
                            </div>

                            {job.showContactInfo && (
                                <div className="njob-contact-info">
                                    <div className="njob-info-row">
                                        <span className="njob-icon">📧</span>
                                        <span className="contact-value">{job.employer?.email || 'N/A'}</span>
                                    </div>
                                    <div className="njob-info-row">
                                        <span className="njob-icon">📞</span>
                                        <span className="contact-value">{job.contactPhone || job.employer?.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                            <div className="njob-skills">
                                {job.skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className="njob-skill-tag">
                                        {s}
                                    </span>
                                ))}
                                {job.skills.length > 3 && (
                                    <span className="njob-skill-tag more">
                                        +{job.skills.length - 3}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Feature badges */}
                        <div className="njob-badges">
                            {job.isUrgent && (
                                <span className="njob-feature urgent">🔥 Urgent</span>
                            )}
                            {job.immediateJoining && (
                                <span className="njob-feature immediate">🚀 Immediate</span>
                            )}
                            {job.accommodation && (
                                <span className="njob-feature accom">🏠 Accommodation</span>
                            )}
                            {job.foodProvided && (
                                <span className="njob-feature food">🍽️ Food</span>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="njob-footer">
                            <span className="njob-posted">
                                Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                            <button
                                className="njob-apply-btn"
                                disabled={job.workersHired >= job.workersRequired}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleApply(job);
                                }}
                            >
                                {job.workersHired >= job.workersRequired ? 'Full' : 'Apply Now'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="nearby-jobs-page">
            {/* ── Hero / Header ─────────────────────────────────── */}
            <div className="nearby-header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    ← Back
                </button>
                <div className="nearby-header-content">
                    <div className="nearby-header-icon">🌍</div>
                    <h1>Explore All Nearby Jobs</h1>
                    <p>Discover opportunities within 20km and beyond your location.</p>
                </div>

                {/* Location status */}
                {locationLoading && (
                    <div className="location-status loading">
                        <div className="pulse-dot" />
                        <span>Detecting your location…</span>
                    </div>
                )}

                {locationError && (
                    <div className="location-status error">
                        <span className="loc-icon">⚠️</span>
                        <span>{locationError}</span>
                    </div>
                )}

                {userLocation && !locationLoading && (
                    <div className="location-status success">
                        <span className="loc-icon">✅</span>
                        <span>
                            Location detected • {userLocation.lat.toFixed(4)}°N,{' '}
                            {userLocation.lng.toFixed(4)}°E
                        </span>
                    </div>
                )}

                {/* ── Search bar ─────────────────────────────────── */}
                <div className="nearby-search-wrapper">
                    <div className="nearby-search-bar">
                        <span className="search-icon-nearby">🔍</span>
                        <input
                            type="text"
                            className="nearby-search-input"
                            placeholder="Filter within (km)"
                            value={distanceInput}
                            onChange={(e) => setDistanceInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!userLocation}
                        />
                        <span className="km-label">km</span>
                        <button
                            className="search-btn"
                            onClick={handleSearch}
                            disabled={!userLocation || loading}
                        >
                            Filter
                        </button>
                    </div>

                    {/* Quick radius chips */}
                    <div className="quick-radius-chips">
                        {quickRadii.map((r) => (
                            <button
                                key={r}
                                className={`radius-chip ${searchRadius === r && hasSearched ? 'active' : ''}`}
                                onClick={() => {
                                    setDistanceInput(String(r));
                                    setSearchRadius(r);
                                    // Trigger fetch immediately with new radius
                                    fetchAllJobs(userLocation, r);
                                }}
                            >
                                {r} km
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Results ───────────────────────────────────────── */}
            <div className="nearby-results-section">
                {!hasSearched ? (
                    <div className="nearby-empty-state">
                        <div className="empty-illustration">🌍</div>
                        <h2>Start Your Search</h2>
                        <p>
                            Your location is being detected. Once found, jobs will automatically load.
                            Use the filter above to narrow down results.
                        </p>
                        <div className="algorithm-explanation">
                            <h3>📐 How Distance Is Calculated</h3>
                            <p>
                                We use the <strong>Haversine formula</strong> — a well-known
                                equation in spherical trigonometry — to compute the
                                great-circle (shortest path on a sphere) distance between
                                your location and each job's location.
                            </p>
                            <div className="formula-box">
                                <code>
                                    a = sin²(Δlat/2) + cos(lat₁) · cos(lat₂) · sin²(Δlng/2)<br />
                                    c = 2 · atan2(√a, √(1 − a))<br />
                                    distance = R · c &nbsp;&nbsp; (R = 6 371 km)
                                </code>
                            </div>
                            <p>
                                This is the same formula used by GPS systems, mapping apps,
                                and ride-sharing services. It's accurate to within ~0.5 % for
                                all distances on Earth.
                            </p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="nearby-loading">
                        <div className="loader-ring" />
                        <p>Locating best jobs for you...</p>
                    </div>
                ) : (
                    <>
                        {usingSampleData && (
                            <div className="demo-info-wrapper">
                                <span className="demo-badge">
                                    🚀 Demo Mode: Showing curated sample jobs
                                </span>
                            </div>
                        )}

                        {/* Section 1: Strict Nearby Filter */}
                        {nearJobs.length > 0 ? (
                            <JobGrid
                                title={`Within ${searchRadius} km (${nearJobs.length})`}
                                icon="🔥"
                                jobs={nearJobs}
                                onApply={handleApply}
                            />
                        ) : (
                            <div className="nearby-empty-state">
                                <div className="empty-illustration">📍</div>
                                <h2>No jobs found within {searchRadius} km</h2>
                                <p>Try increasing your filter radius to see more local opportunities.</p>
                            </div>
                        )}

                        {/* Section 2: Unified Distant/Deduplicated List */}
                        {(farJobs.length > 0) && (
                            <div className="distant-jobs-divider">
                                <button
                                    className={`view-all-toggle ${showDistant ? 'active' : ''}`}
                                    onClick={() => setShowDistant(!showDistant)}
                                >
                                    {showDistant ? 'Hide' : 'Show'} Other Opportunities ({farJobs.length})
                                </button>
                            </div>
                        )}

                        {showDistant && farJobs.length > 0 && (
                            <JobGrid
                                title={`Other km (Beyond ${searchRadius} km)`}
                                icon="🛣️"
                                jobs={farJobs}
                                onApply={handleApply}
                            />
                        )}

                        {nearJobs.length === 0 && farJobs.length === 0 && (
                            <div className="nearby-empty-state">
                                <div className="empty-illustration">📭</div>
                                <h2>No Jobs Found</h2>
                                <p>We couldn't find any jobs right now. Try increasing the distance or check back later!</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Job Detail Modal ──────────────────────────────── */}
            {showJobModal && selectedJob && (
                <div className="modal-overlay" onClick={closeJobModal}>
                    <div className="nearby-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeJobModal}>✕</button>
                        <div className="nearby-modal-header">
                            <h2>{selectedJob.title}</h2>
                            <p>{selectedJob.company}</p>
                            {selectedJob.distanceKm != null && (
                                <span className="modal-distance">
                                    📍 {selectedJob.distanceKm} km from you
                                </span>
                            )}
                        </div>
                        <div className="nearby-modal-body">
                            <div className="modal-info-grid">
                                <div className="modal-info-item">
                                    <span className="label">Salary</span>
                                    <span className="value">
                                        {formatSalary(selectedJob.salaryMin, selectedJob.salaryMax, selectedJob.salaryType)}
                                    </span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="label">Job Type</span>
                                    <span className="value">{getJobTypeLabel(selectedJob.jobType)}</span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="label">Location</span>
                                    <span className="value">
                                        {selectedJob.location?.address
                                            ? `${selectedJob.location.address}, ${selectedJob.location.city}`
                                            : selectedJob.location?.city || 'N/A'}
                                    </span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="label">Vacancies</span>
                                    <span className="value">
                                        {Math.max(0, selectedJob.workersRequired - (selectedJob.workersHired || 0))} open
                                    </span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="label">Experience</span>
                                    <span className="value">{selectedJob.experience || 'Any'}</span>
                                </div>
                            </div>

                            {selectedJob.skills?.length > 0 && (
                                <div className="modal-section">
                                    <h3>Required Skills</h3>
                                    <div className="njob-skills">
                                        {selectedJob.skills.map((s, i) => (
                                            <span key={i} className="njob-skill-tag">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedJob.description && (
                                <div className="modal-section">
                                    <h3>Description</h3>
                                    <p>{selectedJob.description}</p>
                                </div>
                            )}

                            {selectedJob.showContactInfo && (
                                <div className="modal-section">
                                    <h3>Employer Contact</h3>
                                    <div className="contact-details-grid-nearby">
                                        <div className="contact-item">
                                            <span className="label">Email</span>
                                            <span className="value">
                                                <a href={`mailto:${selectedJob.employer?.email}`} className="contact-link">
                                                    {selectedJob.employer?.email || 'N/A'}
                                                </a>
                                            </span>
                                        </div>
                                        <div className="contact-item">
                                            <span className="label">Phone</span>
                                            <span className="value">
                                                <a href={`tel:${selectedJob.contactPhone || selectedJob.employer?.phone}`} className="contact-link">
                                                    {selectedJob.contactPhone || selectedJob.employer?.phone || 'N/A'}
                                                </a>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="nearby-modal-footer">
                            <button className="btn-secondary" onClick={closeJobModal}>Close</button>
                            <button
                                className="njob-apply-btn large"
                                onClick={() => handleApply(selectedJob)}
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Trust Apply Modal ─────────────────────────────── */}
            {showTrustModal && (
                <TrustApplyModal
                    isOpen={showTrustModal}
                    onClose={() => setShowTrustModal(false)}
                    onApply={handleConfirmApply}
                    isApplying={isApplying}
                />
            )}

            {/* ── Payment Modal ──────────────────────────────────── */}
            {showPaymentModal && selectedJob && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={10}
                    action="apply"
                    jobId={selectedJob._id}
                />
            )}
        </div>
    );
};

export default NearbyJobs;
