import { test as setup, expect } from "@playwright/test"

const authFile = "test/e2e/.auth/user.json"

setup("authenticate", async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/auth/login")
  await page.getByLabel("Email").fill("testtest1@gmail.com")
  await page.getByLabel("Password").fill("password")
  await page.getByRole("button", { name: "Login" }).click()
  // Wait until the page receives the cookies.

  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  await page.waitForURL("/dashboard")
  await expect(page.locator("img[alt='Jobi Logo']")).toBeVisible()
  // End of authentication steps.
  await page.context().storageState({ path: authFile })
})
