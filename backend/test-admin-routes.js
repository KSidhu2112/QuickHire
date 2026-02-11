// Test script to verify admin routes are loaded
const express = require('express');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use('/api/admin', adminRoutes);

// Get all registered routes
const routes = [];
app._router.stack.forEach(middleware => {
    if (middleware.route) {
        routes.push({
            path: middleware.route.path,
            methods: Object.keys(middleware.route.methods)
        });
    } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach(handler => {
            if (handler.route) {
                const path = '/api/admin' + handler.route.path;
                routes.push({
                    path: path,
                    methods: Object.keys(handler.route.methods)
                });
            }
        });
    }
});

console.log('Registered Admin Routes:');
routes.forEach(route => {
    console.log(`  ${route.methods.join(', ').toUpperCase()} ${route.path}`);
});

// Check if /api/admin/jobs exists
const jobsRoute = routes.find(r => r.path === '/api/admin/jobs');
if (jobsRoute) {
    console.log('\n✅ /api/admin/jobs route is registered!');
    console.log(`   Methods: ${jobsRoute.methods.join(', ').toUpperCase()}`);
} else {
    console.log('\n❌ /api/admin/jobs route NOT found!');
}
