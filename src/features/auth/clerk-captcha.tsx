/**
 * Where Clerk renders its bot protection challenge during sign-up. It stays
 * empty while bot protection is turned off in the Clerk dashboard.
 */
export function ClerkCaptcha() {
  return <div id="clerk-captcha" />
}
