# Test Files to Remove for Production

The following files should be removed before deploying to production:

1. `test.js` - Contains test MongoDB connection code
2. `test.http` - Contains test HTTP requests with hardcoded data

These files are for development/testing purposes only and should not be deployed to production servers.

## Commands to remove:
```bash
rm test.js
rm test.http
```