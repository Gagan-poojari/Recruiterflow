# QA Automation (SauceDemo & ReqRes)

Playwright + TypeScript test suite for the SauceDemo store UI and the ReqRes public API.

---

## How to Run

1. Install dependencies and the Chromium browser:
```bash
npm install
npx playwright install chromium
```

2. Run the tests:
```bash
npx playwright test
```

You can also run UI or API tests separately:
```bash
npm run test:ui       # just the saucedemo tests
npm run test:api      # just the reqres api tests
npm run test:headed   # open the browser window while running
```

---

## Expected Output

```text
Running 8 tests using 6 workers

  ok 1 [chromium] › tests\api\users.spec.ts:17:7 › ReqRes API User Endpoints › 4. GET /api/users/2 returns status 200 and data.email (456ms)
  ok 2 [chromium] › tests\api\users.spec.ts:49:7 › ReqRes API User Endpoints › bonus: GET /api/users/23 returns 404 not found (528ms)
  ok 3 [chromium] › tests\api\users.spec.ts:30:7 › ReqRes API User Endpoints › 5. POST /api/users creates a new user with status 201 (714ms)
  ok 4 [chromium] › tests\ui\login.spec.ts:16:7 › SauceDemo Login Flow › locked-out user sees error message containing "locked out" (2.3s)
  ok 5 [chromium] › tests\ui\login.spec.ts:5:7 › SauceDemo Login Flow › valid login as standard_user displays Products page (2.4s)
  ok 6 [chromium] › tests\ui\cart.spec.ts:22:7 › SauceDemo Shopping Cart Flow › bonus: remove product from cart clears the cart badge (2.8s)
  ok 7 [chromium] › tests\ui\cart.spec.ts:11:7 › SauceDemo Shopping Cart Flow › add to cart increments cart badge to 1 (2.7s)
  ok 8 [chromium] › tests\ui\login.spec.ts:26:7 › SauceDemo Login Flow › bonus: logs out from side menu and returns to login page (3.0s)

  8 passed (8.8s)
```

---

## What's Covered

### UI Tests (SauceDemo)
1. **Valid login**: logs in with `standard_user` and checks that the "Products" heading shows up.
2. **Locked-out user**: tries to log in with `locked_out_user` and confirms the error says "locked out".
3. **Add to cart**: adds an item and checks that the cart badge shows 1.
4. **Remove from cart (bonus)**: removes the item and confirms the badge disappears.
5. **Logout (bonus)**: opens the side menu, hits logout, and checks we're back on the login page.
6. **Page Object (bonus)**: login locators and actions are kept in `pages/LoginPage.ts` so tests don't repeat them.

### API Tests (ReqRes)
1. **GET /api/users/2**: verifies status 200 and checks `data.email` exists.
2. **POST /api/users**: sends `{ name: "morpheus", job: "leader" }` and expects 201 with the created user's name.
3. **GET /api/users/23 (bonus)**: checks that requesting a non-existent user returns 404.
4. Passes the `x-api-key` header if you have `REQRES_API_KEY` set in your environment.
