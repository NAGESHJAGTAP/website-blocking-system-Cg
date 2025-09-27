# TODO: Fix Unblock Button Issue

## Steps to Complete
- [x] Create dynamic API route for /api/blocklist/[domain] with DELETE handler
- [x] Remove DELETE handler from base /api/blocklist/route.js
- [x] Test unblock functionality and DNS reload
- [x] Verify mobile cache handling (note: may require manual DNS flush on mobile)

## Notes
- DNS server watches blocklist.json and reloads automatically on change
- Mobile DNS cache may persist NXDOMAIN until expiration; users may need to flush DNS or wait
